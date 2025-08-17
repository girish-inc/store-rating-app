const express = require('express');
const { neon } = require('@neondatabase/serverless');
const { verifyToken, requireOwner } = require('../middleware/auth');

// DB connection - keeping it consistent across files
const sql = neon(process.env.DATABASE_URL);

const router = express.Router();

// Apply authentication middleware to all owner routes
router.use(verifyToken, requireOwner);

// Get owner dashboard data - this endpoint was the most complex one
router.get('/dashboard', async (req, res) => {
  try {
    const ownerEmail = req.user.email;
    // console.log('Owner dashboard request for:', req.user.id); // debug trace

    // Get store information for this owner using owner_id
    const stores = await sql`
      SELECT id, name, email, address, rating, total_ratings 
      FROM stores 
      WHERE owner_id = ${req.user.id}
    `;

    if (stores.length === 0) {
      return res.status(404).json({ error: 'No store found for this owner' });
    }

    const store = stores[0];

    // Get users who rated this store with their ratings
    const userRatings = await sql`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.address as user_address,
        r.rating,
        r.created_at as rating_date,
        r.updated_at as rating_updated
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = ${store.id}
      ORDER BY r.updated_at DESC
    `;

    // Get rating distribution
    const ratingDistribution = await sql`
      SELECT 
        rating,
        COUNT(*) as count
      FROM ratings 
      WHERE store_id = ${store.id}
      GROUP BY rating
      ORDER BY rating DESC
    `;

    // Get recent ratings (last 10)
    const recentRatings = await sql`
      SELECT 
        u.name as user_name,
        r.rating,
        r.created_at,
        r.updated_at
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = ${store.id}
      ORDER BY r.updated_at DESC
      LIMIT 10
    `;

    // Calculate statistics
    const totalRatings = userRatings.length;
    const averageRating = parseFloat(store.rating) || 0;
    
    // Calculate rating breakdown percentages
    const ratingBreakdown = [1, 2, 3, 4, 5].map(rating => {
      const found = ratingDistribution.find(r => r.rating === rating);
      return {
        rating,
        count: found ? found.count : 0,
        percentage: totalRatings > 0 ? ((found ? found.count : 0) / totalRatings * 100).toFixed(1) : 0
      };
    });

    res.json({
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        average_rating: averageRating,
        total_ratings: totalRatings
      },
      statistics: {
        total_ratings: totalRatings,
        average_rating: averageRating,
        rating_breakdown: ratingBreakdown
      },
      users_who_rated: userRatings,
      recent_ratings: recentRatings
    });
  } catch (error) {
    console.error('Owner dashboard error:', error);
    res.status(500).json({ error: 'Server error fetching dashboard data' });
  }
});

// GET /api/owner/store - Get store information
router.get('/store', async (req, res) => {
  try {
    const ownerEmail = req.user.email;

    const stores = await sql`
      SELECT id, name, email, address, rating, total_ratings, created_at 
      FROM stores 
      WHERE owner_id = ${req.user.id}
    `;

    if (stores.length === 0) {
      return res.status(404).json({ error: 'No store found for this owner' });
    }

    res.json({ store: stores[0] });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Server error fetching store information' });
  }
});

// Get ratings for owner's stores - pagination again, getting used to it now
router.get('/ratings', async (req, res) => {
  try {
    const ownerEmail = req.user.email;
    const { page = 1, limit = 10, sort = 'updated_at', order = 'desc' } = req.query; // same math as admin routes

    // Get store ID
    const stores = await sql`
      SELECT id FROM stores WHERE owner_id = ${req.user.id}
    `;

    if (stores.length === 0) {
      return res.status(404).json({ error: 'No store found for this owner' });
    }

    const storeId = stores[0].id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query with sorting
    const validSortFields = ['rating', 'created_at', 'updated_at', 'user_name'];
    const sortField = validSortFields.includes(sort) ? 
      (sort === 'user_name' ? 'u.name' : `r.${sort}`) : 'r.updated_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Build the query with safe sorting
    let ratingsQuery;
    if (sortField === 'u.name' && sortOrder === 'ASC') {
      ratingsQuery = sql`
        SELECT r.id, r.rating, r.created_at, r.updated_at,
               u.id as user_id, u.name as user_name, u.email as user_email, u.address as user_address
        FROM ratings r JOIN users u ON r.user_id = u.id
        WHERE r.store_id = ${storeId}
        ORDER BY u.name ASC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `;
    } else if (sortField === 'u.name' && sortOrder === 'DESC') {
      ratingsQuery = sql`
        SELECT r.id, r.rating, r.created_at, r.updated_at,
               u.id as user_id, u.name as user_name, u.email as user_email, u.address as user_address
        FROM ratings r JOIN users u ON r.user_id = u.id
        WHERE r.store_id = ${storeId}
        ORDER BY u.name DESC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `;
    } else {
      // Default to updated_at DESC
      ratingsQuery = sql`
        SELECT r.id, r.rating, r.created_at, r.updated_at,
               u.id as user_id, u.name as user_name, u.email as user_email, u.address as user_address
        FROM ratings r JOIN users u ON r.user_id = u.id
        WHERE r.store_id = ${storeId}
        ORDER BY r.updated_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `;
    }
    
    const ratings = await ratingsQuery;

    // Get total count
    const totalResult = await sql`
      SELECT COUNT(*) as total FROM ratings WHERE store_id = ${storeId}
    `;
    const total = totalResult[0].total;

    res.json({
      ratings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Server error fetching ratings' });
  }
});

// Get detailed analytics - owners can reply to reviews
router.get('/analytics', async (req, res) => {
  try {
    const ownerEmail = req.user.email;
    const { period = '30' } = req.query; // days
    // console.log('Analytics request for period:', period); // useful for tracking

    // Get store ID
    const stores = await sql`
      SELECT id, name FROM stores WHERE owner_id = ${req.user.id}
    `;

    if (stores.length === 0) {
      return res.status(404).json({ error: 'No store found for this owner' });
    }

    const storeId = stores[0].id;
    const storeName = stores[0].name;

    // Get ratings over time (last N days)
    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    const ratingsOverTime = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        AVG(rating) as avg_rating
      FROM ratings 
      WHERE store_id = ${storeId} AND created_at >= ${startDate.toISOString()}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get rating trends (compare with previous period)
    const currentPeriodRatings = await sql`
      SELECT 
        COUNT(*) as count,
        AVG(rating) as avg_rating
      FROM ratings 
      WHERE store_id = ${storeId} AND created_at >= ${startDate.toISOString()}
    `;

    const previousPeriodDays = periodDays * 2;
    const previousStartDate = new Date();
    previousStartDate.setDate(previousStartDate.getDate() - previousPeriodDays);
    const previousEndDate = new Date();
    previousEndDate.setDate(previousEndDate.getDate() - periodDays);
    const previousPeriodRatings = await sql`
      SELECT 
        COUNT(*) as count,
        AVG(rating) as avg_rating
      FROM ratings 
      WHERE store_id = ${storeId} 
        AND created_at >= ${previousStartDate.toISOString()}
        AND created_at < ${previousEndDate.toISOString()}
    `;

    const currentCount = currentPeriodRatings[0]?.count || 0;
    const previousCount = previousPeriodRatings[0]?.count || 0;
    const currentAvg = parseFloat(currentPeriodRatings[0]?.avg_rating) || 0;
    const previousAvg = parseFloat(previousPeriodRatings[0]?.avg_rating) || 0;

    res.json({
      store_name: storeName,
      period_days: parseInt(period),
      ratings_over_time: ratingsOverTime,
      trends: {
        current_period: {
          total_ratings: currentCount,
          average_rating: currentAvg
        },
        previous_period: {
          total_ratings: previousCount,
          average_rating: previousAvg
        },
        changes: {
          rating_count_change: currentCount - previousCount,
          rating_count_percentage: previousCount > 0 ? 
            (((currentCount - previousCount) / previousCount) * 100).toFixed(1) : 'N/A',
          average_rating_change: (currentAvg - previousAvg).toFixed(2),
          average_rating_percentage: previousAvg > 0 ? 
            (((currentAvg - previousAvg) / previousAvg) * 100).toFixed(1) : 'N/A'
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
});

module.exports = router;
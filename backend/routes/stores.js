const express = require('express');
const { executeQuery } = require('../config/database');
const { verifyToken, requireUser } = require('../middleware/auth');
const { validateSortQuery } = require('../middleware/validation');
const { LRUCache } = require('lru-cache');

// Cache to speed up repeats - 5 minute TTL
const storeCache = new LRUCache({
  max: 100, // Maximum 100 cached entries
  ttl: 5 * 60 * 1000 // 5 minutes TTL
});

const router = express.Router();

// GET /api/stores - List all stores (public endpoint for normal users)
router.get('/', verifyToken, validateSortQuery, async (req, res) => {
  try {
    const { name, address, sort = 'name', order = 'asc', page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    
    // Cache to speed up repeats - create cache key
    const cacheKey = `stores:${userId}:${name || ''}:${address || ''}:${sort}:${order}:${page}:${limit}`;
    const cachedResult = storeCache.get(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }
    
    let query = `
      SELECT 
        s.id, 
        s.name, 
        s.email, 
        s.address, 
        s.rating, 
        s.total_ratings,
        s.created_at,
        r.rating as user_rating
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id AND r.user_id = $1
    `;
    let params = [userId];
    let whereConditions = [];

    // Add filters
    if (name) {
      whereConditions.push(`s.name ILIKE $${params.length + 1}::text`);
      params.push(`%${name}%`);
    }
    if (address) {
      whereConditions.push(`s.address ILIKE $${params.length + 1}::text`);
      params.push(`%${address}%`);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    // Add sorting
    const validSortFields = ['name', 'address', 'rating', 'created_at'];
    const sortField = validSortFields.includes(sort) ? `s.${sort}` : 's.name';
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const stores = await executeQuery(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM stores s';
    let countParams = [];
    if (whereConditions.length > 0) {
      // Rebuild count query with proper parameter indices
      let countWhereConditions = [];
      if (name) {
        countWhereConditions.push(`s.name ILIKE $${countParams.length + 1}::text`);
        countParams.push(`%${name}%`);
      }
      if (address) {
        countWhereConditions.push(`s.address ILIKE $${countParams.length + 1}::text`);
        countParams.push(`%${address}%`);
      }
      countQuery += ' WHERE ' + countWhereConditions.join(' AND ');
    }
    const [{ total }] = await executeQuery(countQuery, countParams);

    // Format response to include rating status
    const formattedStores = stores.map(store => ({
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      rating: parseFloat(store.rating) || 0,
      total_ratings: store.total_ratings || 0,
      created_at: store.created_at,
      user_rating: store.user_rating,
      can_rate: !store.user_rating, // User can rate if they haven't rated yet
      can_modify: !!store.user_rating // User can modify if they have rated
    }));

    const result = {
      stores: formattedStores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
    
    // Cache to speed up repeats
    storeCache.set(cacheKey, result);
    
    res.json(result);
  } catch (error) {
    console.error('List stores error:', error);
    res.status(500).json({ error: 'Server error fetching stores' });
  }
});

// GET /api/stores/:id - Get store details
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get store details with user's rating
    const stores = await executeQuery(`
      SELECT 
        s.id, 
        s.name, 
        s.email, 
        s.address, 
        s.rating, 
        s.total_ratings,
        s.created_at,
        r.rating as user_rating
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id AND r.user_id = $1
      WHERE s.id = $2
    `, [userId, id]);

    if (stores.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const store = stores[0];

    // Get recent ratings for this store
    const recentRatings = await executeQuery(`
      SELECT 
        r.rating, 
        r.created_at, 
        u.name as user_name
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = $1
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [id]);

    res.json({
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        rating: parseFloat(store.rating) || 0,
        total_ratings: store.total_ratings || 0,
        created_at: store.created_at,
        user_rating: store.user_rating,
        can_rate: !store.user_rating,
        can_modify: !!store.user_rating
      },
      recent_ratings: recentRatings
    });
  } catch (error) {
    console.error('Get store details error:', error);
    res.status(500).json({ error: 'Server error fetching store details' });
  }
});

module.exports = router;
const express = require('express');
const { executeQuery } = require('../config/database');
const { verifyToken, requireUser } = require('../middleware/auth');
const { validateRating } = require('../middleware/validation');

const router = express.Router();

// Apply authentication middleware to all rating routes
router.use(verifyToken);

// Helper function to update store rating
const updateStoreRating = async (storeId) => {
  try {
    // Calculate new average rating and total count
    const [result] = await executeQuery(`
      SELECT 
        AVG(rating) as avg_rating, 
        COUNT(*) as total_ratings 
      FROM ratings 
      WHERE store_id = $1
    `, [storeId]);

    const avgRating = parseFloat(result.avg_rating) || 0;
    const totalRatings = parseInt(result.total_ratings) || 0;

    // Update store with new rating
    await executeQuery(
      'UPDATE stores SET rating = $1, total_ratings = $2 WHERE id = $3',
      [avgRating, totalRatings, storeId]
    );

    return { avgRating, totalRatings };
  } catch (error) {
    console.error('Error updating store rating:', error);
    throw error;
  }
};

// POST /api/ratings - Submit new rating
router.post('/', validateRating, async (req, res) => {
  try {
    const { store_id, rating } = req.body;
    const userId = req.user.id;

    // Check if user is trying to rate (only normal users can rate)
    if (req.user.role !== 'user') {
      return res.status(403).json({ error: 'Only normal users can submit ratings' });
    }

    // Check if store exists
    const stores = await executeQuery(
      'SELECT id FROM stores WHERE id = $1',
      [store_id]
    );

    if (stores.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if user has already rated this store
    const existingRating = await executeQuery(
      'SELECT id FROM ratings WHERE user_id = $1 AND store_id = $2',
      [userId, store_id]
    );

    if (existingRating.length > 0) {
      return res.status(400).json({ error: 'You have already rated this store. Use PUT to modify your rating.' });
    }

    // Insert new rating
    const result = await executeQuery(
      'INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3) RETURNING id',
      [userId, store_id, rating]
    );

    // Update store's average rating
    const { avgRating, totalRatings } = await updateStoreRating(store_id);

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating: {
        id: result[0].id,
        user_id: userId,
        store_id,
        rating,
        created_at: new Date().toISOString()
      },
      store_updated: {
        new_average_rating: avgRating,
        total_ratings: totalRatings
      }
    });
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ error: 'Server error submitting rating' });
  }
});

// PUT /api/ratings - Modify existing rating
router.put('/', validateRating, async (req, res) => {
  try {
    const { store_id, rating } = req.body;
    const userId = req.user.id;

    // Check if user is trying to rate (only normal users can rate)
    if (req.user.role !== 'user') {
      return res.status(403).json({ error: 'Only normal users can modify ratings' });
    }

    // Check if store exists
    const stores = await executeQuery(
      'SELECT id FROM stores WHERE id = $1',
      [store_id]
    );

    if (stores.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if user has rated this store
    const existingRating = await executeQuery(
      'SELECT id, rating FROM ratings WHERE user_id = $1 AND store_id = $2',
      [userId, store_id]
    );

    if (existingRating.length === 0) {
      return res.status(404).json({ error: 'You have not rated this store yet. Use POST to submit a new rating.' });
    }

    const oldRating = existingRating[0].rating;

    // Update existing rating
    await executeQuery(
      'UPDATE ratings SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND store_id = $3',
      [rating, userId, store_id]
    );

    // Update store's average rating
    const { avgRating, totalRatings } = await updateStoreRating(store_id);

    res.json({
      message: 'Rating updated successfully',
      rating: {
        id: existingRating[0].id,
        user_id: userId,
        store_id,
        old_rating: oldRating,
        new_rating: rating,
        updated_at: new Date().toISOString()
      },
      store_updated: {
        new_average_rating: avgRating,
        total_ratings: totalRatings
      }
    });
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({ error: 'Server error updating rating' });
  }
});

// DELETE /api/ratings/:storeId - Delete user's rating for a store
router.delete('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const userId = req.user.id;

    // Check if user is trying to delete (only normal users can delete their ratings)
    if (req.user.role !== 'user') {
      return res.status(403).json({ error: 'Only normal users can delete ratings' });
    }

    // Check if user has rated this store
    const existingRating = await executeQuery(
      'SELECT id, rating FROM ratings WHERE user_id = $1 AND store_id = $2',
      [userId, storeId]
    );

    if (existingRating.length === 0) {
      return res.status(404).json({ error: 'You have not rated this store' });
    }

    // Delete the rating
    await executeQuery(
      'DELETE FROM ratings WHERE user_id = $1 AND store_id = $2',
      [userId, storeId]
    );

    // Update store's average rating
    const { avgRating, totalRatings } = await updateStoreRating(storeId);

    res.json({
      message: 'Rating deleted successfully',
      deleted_rating: existingRating[0],
      store_updated: {
        new_average_rating: avgRating,
        total_ratings: totalRatings
      }
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({ error: 'Server error deleting rating' });
  }
});

// GET /api/ratings/my-ratings - Get current user's ratings
router.get('/my-ratings', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Get user's ratings with store information
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const ratings = await executeQuery(`
      SELECT 
        r.id,
        r.rating,
        r.created_at,
        r.updated_at,
        s.id as store_id,
        s.name as store_name,
        s.address as store_address,
        s.rating as store_avg_rating
      FROM ratings r
      JOIN stores s ON r.store_id = s.id
      WHERE r.user_id = $1
      ORDER BY r.updated_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit), offset]);

    // Get total count
    const [{ total }] = await executeQuery(
      'SELECT COUNT(*) as total FROM ratings WHERE user_id = $1',
      [userId]
    );

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
    console.error('Get my ratings error:', error);
    res.status(500).json({ error: 'Server error fetching your ratings' });
  }
});

module.exports = router;
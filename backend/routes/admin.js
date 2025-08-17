const express = require('express');
const bcrypt = require('bcrypt');
const { executeQuery } = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { validateUserRegistration, validateStore, validateSortQuery } = require('../middleware/validation');
const { LRUCache } = require('lru-cache');

// Cache to speed up repeats - 5 minute TTL
const adminCache = new LRUCache({
  max: 50, // Maximum 50 cached entries
  ttl: 5 * 60 * 1000 // 5 minutes TTL
});

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(verifyToken, requireAdmin);

// GET /api/admin/dashboard - Get dashboard statistics - this was a pain to get right
router.get('/dashboard', async (req, res) => {
  try {
    // console.log('Fetching admin dashboard data...'); // debug line
    // Cache to speed up repeats
    const cacheKey = 'admin:dashboard';
    const cachedResult = adminCache.get(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }
    // Parallel API calls for better performance - took me a while to figure out the AVG function
    const [
      [userCount],
      [storeCount], 
      [ratingCount],
      recentUsers,
      recentStores
    ] = await Promise.all([
      executeQuery('SELECT COUNT(*) as count FROM users WHERE role != $1', ['admin']),
      executeQuery('SELECT COUNT(*) as count FROM stores'),
      executeQuery('SELECT COUNT(*) as count FROM ratings'),
      executeQuery(
        'SELECT name, email, role, created_at FROM users WHERE role != $1 ORDER BY created_at DESC LIMIT 5',
        ['admin']
      ),
      executeQuery(
        'SELECT name, email, rating, created_at FROM stores ORDER BY created_at DESC LIMIT 5'
      )
    ]);

    const result = {
      statistics: {
        totalUsers: userCount.count,
        totalStores: storeCount.count,
        totalRatings: ratingCount.count
      },
      recentActivity: {
        recentUsers,
        recentStores
      }
    };
    
    // Cache to speed up repeats
    adminCache.set(cacheKey, result);
    
    res.json(result);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Server error fetching dashboard data' });
  }
});

// POST /api/admin/stores - Add new store
router.post('/stores', validateStore, async (req, res) => {
  try {
    const { name, email, address } = req.body;

    // Check if store email already exists
    const existingStore = await executeQuery(
      'SELECT id FROM stores WHERE email = $1',
      [email]
    );

    if (existingStore.length > 0) {
      return res.status(400).json({ error: 'Store with this email already exists' });
    }

    // Insert new store
    const result = await executeQuery(
      'INSERT INTO stores (name, email, address) VALUES ($1, $2, $3) RETURNING id',
      [name, email, address || null]
    );

    res.status(201).json({
      message: 'Store added successfully',
      store: {
        id: result[0].id,
        name,
        email,
        address,
        rating: 0.0
      }
    });
  } catch (error) {
    console.error('Add store error:', error);
    res.status(500).json({ error: 'Server error adding store' });
  }
});

// POST /api/admin/users - Add new user
router.post('/users', validateUserRegistration, async (req, res) => {
  try {
    const { name, email, password, address, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await executeQuery(
      'INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, hashedPassword, address || null, role]
    );

    res.status(201).json({
      message: 'User added successfully',
      user: {
        id: result[0].id,
        name,
        email,
        address,
        role
      }
    });
  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({ error: 'Server error adding user' });
  }
});

// GET /api/admin/stores - List all stores with filtering and sorting
router.get('/stores', validateSortQuery, async (req, res) => {
  try {
    const { name, sort = 'name', order = 'asc', page = 1, limit = 10 } = req.query;
    
    // Cache to speed up repeats
    const cacheKey = `admin:stores:${name || ''}:${sort}:${order}:${page}:${limit}`;
    const cachedResult = adminCache.get(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }
    
    let query = 'SELECT id, name, email, address, rating, total_ratings, created_at FROM stores';
    let params = [];
    let whereConditions = [];

    // Add filters
    if (name) {
      whereConditions.push(`name LIKE $${params.length + 1}`);
      params.push(`%${name}%`);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    // Add sorting
    const validSortFields = ['name', 'email', 'rating', 'created_at'];
    const sortField = validSortFields.includes(sort) ? sort : 'name';
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const stores = await executeQuery(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM stores';
    let countParams = [];
    if (whereConditions.length > 0) {
      countQuery += ' WHERE ' + whereConditions.join(' AND ');
      countParams = params.slice(0, -2); // Remove limit and offset
    }
    const [{ total }] = await executeQuery(countQuery, countParams);

    const result = {
      stores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
    
    // Cache to speed up repeats
    adminCache.set(cacheKey, result);
    
    res.json(result);
  } catch (error) {
    console.error('List stores error:', error);
    res.status(500).json({ error: 'Server error fetching stores' });
  }
});

// GET /api/admin/users - List all users with filtering and sorting - pagination was tricky at first
router.get('/users', validateSortQuery, async (req, res) => {
  try {
    const { name, role, sort = 'name', order = 'asc', page = 1, limit = 10 } = req.query;
    // math here confused me initially
    
    // Cache to speed up repeats
    const cacheKey = `admin:users:${name || ''}:${role || ''}:${sort}:${order}:${page}:${limit}`;
    const cachedResult = adminCache.get(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }
    
    let query = 'SELECT id, name, email, address, role, created_at FROM users WHERE role != $1';
    let params = ['admin'];
    let whereConditions = [];

    // Add filters
    if (name) {
      whereConditions.push(`name LIKE $${params.length + 1}`);
      params.push(`%${name}%`);
    }
    if (role) {
      whereConditions.push(`role = $${params.length + 1}`);
      params.push(role);
    }

    if (whereConditions.length > 0) {
      query += ' AND ' + whereConditions.join(' AND ');
    }

    // Add sorting
    const validSortFields = ['name', 'email', 'role', 'created_at'];
    const sortField = validSortFields.includes(sort) ? sort : 'name';
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const users = await executeQuery(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE role != $1';
    let countParams = ['admin'];
    if (whereConditions.length > 0) {
      countQuery += ' AND ' + whereConditions.join(' AND ');
      // Add the additional filter parameters (excluding 'admin' which is already in countParams)
      countParams = countParams.concat(params.slice(1, -2)); // Skip 'admin' and remove limit/offset
    }
    const [{ total }] = await executeQuery(countQuery, countParams);

    const result = {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
    
    // Cache to speed up repeats
    adminCache.set(cacheKey, result);
    
    res.json(result);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// GET /api/admin/users/:id - Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get user details
    const users = await executeQuery(
      'SELECT id, name, email, address, role, created_at FROM users WHERE id = $1 AND role != \'admin\'',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // If user is a store owner, get their store rating
    if (user.role === 'owner') {
      const stores = await executeQuery(
        'SELECT id, name, rating, total_ratings FROM stores WHERE email = $1',
        [user.email]
      );
      if (stores.length > 0) {
        user.store = stores[0];
      }
    }

    // Get user's ratings if they are a normal user
    if (user.role === 'user') {
      const ratings = await executeQuery(
        'SELECT r.rating, r.created_at, s.name as store_name FROM ratings r JOIN stores s ON r.store_id = s.id WHERE r.user_id = $1',
        [id]
      );
      user.ratings = ratings;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Server error fetching user details' });
  }
});

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', validateUserRegistration, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, role } = req.body;

    // Check if user exists and is not admin
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE id = $1 AND role != \'admin\'',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken by another user
    const emailCheck = await executeQuery(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );

    if (emailCheck.length > 0) {
      return res.status(400).json({ error: 'Email already taken by another user' });
    }

    // Update user
    await executeQuery(
      'UPDATE users SET name = $1, email = $2, address = $3, role = $4 WHERE id = $5',
      [name, email, address || null, role, id]
    );

    // Clear cache
    adminCache.clear();

    res.json({
      message: 'User updated successfully',
      user: { id, name, email, address, role }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error updating user' });
  }
});

// DELETE /api/admin/users/:id - Delete user - had to be careful with this one
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // console.log('Deleting user:', id); // keeping for safety

    // Check if user exists and is not admin
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE id = $1 AND role != \'admin\'',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user's ratings first (foreign key constraint)
    await executeQuery('DELETE FROM ratings WHERE user_id = $1', [id]);
    
    // Delete user
    await executeQuery('DELETE FROM users WHERE id = $1', [id]);

    // Clear cache
    adminCache.clear();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// PUT /api/admin/stores/:id - Update store
router.put('/stores/:id', validateStore, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address } = req.body;

    // Check if store exists
    const existingStores = await executeQuery(
      'SELECT id FROM stores WHERE id = $1',
      [id]
    );

    if (existingStores.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if email is already taken by another store
    const emailCheck = await executeQuery(
      'SELECT id FROM stores WHERE email = $1 AND id != $2',
      [email, id]
    );

    if (emailCheck.length > 0) {
      return res.status(400).json({ error: 'Email already taken by another store' });
    }

    // Update store
    await executeQuery(
      'UPDATE stores SET name = $1, email = $2, address = $3 WHERE id = $4',
      [name, email, address || null, id]
    );

    // Clear cache
    adminCache.clear();

    res.json({
      message: 'Store updated successfully',
      store: { id, name, email, address }
    });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ error: 'Server error updating store' });
  }
});

// DELETE /api/admin/stores/:id - Delete store
router.delete('/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if store exists
    const existingStores = await executeQuery(
      'SELECT id FROM stores WHERE id = $1',
      [id]
    );

    if (existingStores.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Delete store's ratings first (foreign key constraint)
    await executeQuery('DELETE FROM ratings WHERE store_id = $1', [id]);
    
    // Delete store
    await executeQuery('DELETE FROM stores WHERE id = $1', [id]);

    // Clear cache
    adminCache.clear();

    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({ error: 'Server error deleting store' });
  }
});

module.exports = router;
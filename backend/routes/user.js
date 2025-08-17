const express = require('express');
const bcrypt = require('bcrypt');
const { executeQuery } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { validatePasswordUpdate } = require('../middleware/validation');

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(verifyToken);

// PUT /api/users/update-password - Update user password
router.put('/update-password', validatePasswordUpdate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get current user password
    const users = await executeQuery(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await executeQuery(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNewPassword, userId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Server error updating password' });
  }
});

// GET /api/users/profile - Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    const users = await executeQuery(
      'SELECT id, name, email, address, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// PUT /api/users/profile - Update user profile (name, address)
router.put('/profile', async (req, res) => {
  try {
    const { name, address } = req.body;
    const userId = req.user.id;

    // Validate name length
    if (name && (name.length < 20 || name.length > 60)) {
      return res.status(400).json({ error: 'Name must be between 20 and 60 characters' });
    }

    // Validate address length
    if (address && address.length > 400) {
      return res.status(400).json({ error: 'Address must not exceed 400 characters' });
    }

    let updateFields = [];
    let params = [];

    if (name) {
      updateFields.push('name = ?');
      params.push(name);
    }

    if (address !== undefined) {
      updateFields.push('address = ?');
      params.push(address || null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    await executeQuery(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${params.length}`,
      params
    );

    // Get updated user data
    const users = await executeQuery(
      'SELECT id, name, email, address, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    res.json({
      message: 'Profile updated successfully',
      user: users[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

module.exports = router;
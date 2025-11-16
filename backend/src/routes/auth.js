const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { User } = require('../utils/database');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// 🔐 SECURE ADMIN RESET ENDPOINT
router.post('/admin-password-reset', async (req, res) => {
  try {
    const { confirmCode, newUsername, newPassword } = req.body;

    // Validate required fields
    if (!confirmCode || !newUsername || !newPassword) {
      return res.status(400).json({ 
        message: 'Missing required fields: confirmCode, newUsername, newPassword' 
      });
    }

    // Validate confirmation code against environment variable
    const ADMIN_RESET_CODE = process.env.ADMIN_RESET_CODE;
    
    if (!ADMIN_RESET_CODE) {
      return res.status(500).json({ 
        message: 'Admin reset code not configured on server' 
      });
    }

    if (confirmCode !== ADMIN_RESET_CODE) {
      // Log failed attempts for security monitoring
      console.warn(`⚠️ Failed admin reset attempt with code: ${confirmCode}`);
      return res.status(403).json({ 
        message: 'Invalid confirmation code' 
      });
    }

    // Password validation
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long' 
      });
    }

    // Find or create admin user
    let admin = await User.findOne({ where: { role: 'admin' } });

    if (admin) {
      // Update existing admin
      admin.email = newUsername;
      admin.password = newPassword; // Will be hashed by beforeUpdate hook
      admin.name = 'Admin User';
      admin.department = 'Administration';
      await admin.save();
      
      console.log(`✅ Admin credentials updated: ${newUsername}`);
      return res.status(200).json({ 
        message: 'Admin credentials updated successfully',
        username: newUsername 
      });
    } else {
      // Create new admin
      admin = await User.create({
        name: 'Admin User',
        email: newUsername,
        password: newPassword,
        role: 'admin',
        department: 'Administration'
      });
      
      console.log(`✅ Admin user created: ${newUsername}`);
      return res.status(201).json({ 
        message: 'Admin user created successfully',
        username: newUsername 
      });
    }

  } catch (error) {
    console.error('❌ Admin reset error:', error);
    return res.status(500).json({ 
      message: 'Failed to reset admin credentials',
      error: error.message 
    });
  }
});

// Protected routes
router.get('/profile', authenticateToken, getProfile);

module.exports = router;

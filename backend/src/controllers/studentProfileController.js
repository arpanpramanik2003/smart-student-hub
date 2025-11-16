const { User } = require('../utils/database');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;

// Profile picture upload setup
const profileStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = 'uploads/profiles/';
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `profile-${req.user.id}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and GIF images are allowed'));
    }
  }
});

// Get student profile
const getProfile = async (req, res) => {
  try {
    console.log('📝 Getting profile for user:', req.user.id);
    
    const user = await User.findByPk(req.user.id, {
      attributes: [
        'id', 'name', 'email', 'department', 'year', 'studentId',
        'profilePicture', 'tenthResult', 'twelfthResult', 'address', 
        'languages', 'skills', 'otherDetails',
        // New fields
        'phone', 'dateOfBirth', 'gender', 'category', 'hobbies',
        'achievements', 'projects', 'certifications', 
        'linkedinUrl', 'githubUrl', 'portfolioUrl',
        'createdAt', 'updatedAt'
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Profile fetched successfully');
    
    res.json({
      success: true,
      profile: user.toJSON()
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile',
      error: error.message 
    });
  }
};

// Update student profile with file upload support
const updateProfile = [
  profileUpload.single('profilePicture'), // Handle file upload
  async (req, res) => {
    try {
      const userId = req.user.id;
      
      console.log('📝 Updating profile for user:', userId);
      console.log('📦 Request body:', req.body);
      console.log('📷 Uploaded file:', req.file?.filename);
      
      // Get current user
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Prepare update data
      const updateData = {};
      
      // Handle all possible profile fields
      const allowedFields = [
        'tenthResult', 'twelfthResult', 'address', 'languages', 'skills', 
        'otherDetails', 'phone', 'dateOfBirth', 'gender', 'category', 
        'hobbies', 'achievements', 'projects', 'certifications',
        'linkedinUrl', 'githubUrl', 'portfolioUrl'
      ];

      // Extract and validate fields from request body
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          // Handle empty strings as null for database
          updateData[field] = req.body[field] === '' ? null : req.body[field];
        }
      });

      // Handle profile picture upload
      if (req.file) {
        console.log('🖼️ Processing profile picture upload');
        
        // Delete old profile picture if exists
        if (user.profilePicture) {
          try {
            const oldFilePath = path.join(process.cwd(), user.profilePicture.replace('/', ''));
            await fs.unlink(oldFilePath);
            console.log('🗑️ Old profile picture deleted');
          } catch (err) {
            console.log('⚠️ Old profile picture not found or already deleted');
          }
        }
        
        updateData.profilePicture = `/uploads/profiles/${req.file.filename}`;
      }

      console.log('💾 Final update data:', updateData);

      // Update user profile
      const [updatedRowsCount] = await User.update(updateData, {
        where: { id: userId }
      });

      if (updatedRowsCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'No changes were made to the profile'
        });
      }

      // Fetch updated user data
      const updatedUser = await User.findByPk(userId, {
        attributes: [
          'id', 'name', 'email', 'department', 'year', 'studentId',
          'profilePicture', 'tenthResult', 'twelfthResult', 'address', 
          'languages', 'skills', 'otherDetails',
          'phone', 'dateOfBirth', 'gender', 'category', 'hobbies',
          'achievements', 'projects', 'certifications', 
          'linkedinUrl', 'githubUrl', 'portfolioUrl',
          'updatedAt'
        ]
      });

      console.log('✅ Profile updated successfully');

      res.json({
        success: true,
        message: 'Profile updated successfully',
        profile: updatedUser.toJSON()
      });

    } catch (error) {
      console.error('❌ Update profile error:', error);
      
      // Delete uploaded file if there was an error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete uploaded file:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }
];

module.exports = {
  getProfile,
  updateProfile
};

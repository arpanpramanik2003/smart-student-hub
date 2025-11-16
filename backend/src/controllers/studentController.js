const { Activity, User } = require('../utils/database');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { uploadFile, deleteFile } = require('../utils/cloudStorage');

// Certificate upload multer setup - using memoryStorage for Google Drive
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for cloud upload
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) return cb(null, true);
    else cb(new Error('Only images (JPEG, PNG) and documents (PDF, DOC, DOCX) are allowed'));
  }
});

// Avatar upload multer setup - using memoryStorage for Google Drive
const avatarUpload = multer({
  storage: multer.memoryStorage(), // Store in memory for cloud upload
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) return cb(null, true);
    else cb(new Error('Only JPEG and PNG images are allowed'));
  }
});

const uploadAvatar = [
  avatarUpload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
      
      // Upload to Google Drive (or local in development)
      const profilePictureUrl = await uploadFile(req.file, 'avatars');
      
      // Delete old avatar if exists
      if (req.user.profilePicture) {
        await deleteFile(req.user.profilePicture);
      }
      
      await req.user.update({ profilePicture: profilePictureUrl });
      res.json({ message: 'Profile picture updated', profilePicture: profilePictureUrl });
    } catch (error) {
      console.error('Profile pic upload error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
];

// Activity validation schema with Joi
const activitySchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  type: Joi.string().valid(
    'conference',
    'workshop',
    'certification',
    'competition',
    'internship',
    'leadership',
    'community_service',
    'club_activity',
    'online_course'
  ).required(),
  description: Joi.string().max(1000).allow('').optional(),
  date: Joi.date().required(),
  duration: Joi.string().max(50).allow('').optional(),
  organizer: Joi.string().max(200).allow('').optional(),
  credits: Joi.alternatives().try(
    Joi.number().min(0).max(10),
    Joi.string().pattern(/^\d+(\.\d+)?$/).custom((value) => parseFloat(value))
  ).default(0),
});

// Submit new activity controller
const submitActivity = async (req, res) => {
  try {
    const { error, value } = activitySchema.validate(req.body);
    if (error) {
      console.error('❌ Validation error:', error.details[0].message);
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    // Upload certificate to Google Drive (or local in development)
    let fileUrl = null;
    if (req.file) {
      try {
        console.log('📤 Uploading file:', req.file.originalname);
        fileUrl = await uploadFile(req.file, 'certificates');
        console.log('✅ File uploaded successfully:', fileUrl);
      } catch (uploadError) {
        console.error('❌ File upload failed:', uploadError.message);
        return res.status(500).json({ 
          message: 'File upload failed', 
          details: uploadError.message 
        });
      }
    }

    const activityData = {
      ...value,
      studentId: req.user.id,
      filePath: fileUrl
    };

    const activity = await Activity.create(activityData);
    console.log('✅ Activity created:', activity.id);
    
    res.status(201).json({
      message: 'Activity submitted successfully',
      activity: {
        id: activity.id,
        title: activity.title,
        type: activity.type,
        date: activity.date,
        status: activity.status,
        credits: activity.credits,
        filePath: activity.filePath
      }
    });

  } catch (error) {
    console.error('❌ Submit activity error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      details: error.message 
    });
  }
};

// Get list of student's activities
const getMyActivities = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    const where = { studentId: req.user.id };
    if (status) where.status = status;
    if (type) where.type = type;

    const offset = (page - 1) * limit;

    const { count, rows } = await Activity.findAndCountAll({
      where,
      include: [
        { 
          model: User, 
          as: 'approver', 
          attributes: ['name', 'email'],
          required: false 
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      activities: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        hasMore: offset + rows.length < count
      }
    });

  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get activity statistics for logged in student
const getActivityStats = async (req, res) => {
  try {
    const stats = await Activity.findAll({
      where: { studentId: req.user.id },
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('status')), 'count'],
        [require('sequelize').fn('SUM', require('sequelize').col('credits')), 'totalCredits']
      ],
      group: ['status']
    });

    const totalActivities = await Activity.count({ 
      where: { studentId: req.user.id } 
    });

    const totalCredits = await Activity.sum('credits', {
      where: { 
        studentId: req.user.id,
        status: 'approved'
      }
    });

    res.json({
      totalActivities,
      totalCredits: totalCredits || 0,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.getDataValue('count'));
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  submitActivity: [upload.single('certificate'), submitActivity],  // certificate upload multer instance
  getMyActivities,
  getActivityStats,
  uploadAvatar,  // avatar upload multer instance
};

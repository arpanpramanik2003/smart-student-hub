const { Activity, User } = require('../utils/database');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

// Certificate upload multer setup
const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/certificates/'),
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage: certificateStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) return cb(null, true);
    else cb(new Error('Only images (JPEG, PNG) and documents (PDF, DOC, DOCX) are allowed'));
  }
});

// Avatar upload multer setup
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/avatars/'),
  filename: (req, file, cb) => {
    const uniqueName = `avatar-${req.user.id}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const avatarUpload = multer({
  storage: avatarStorage,
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
      const profilePictureUrl = `/uploads/avatars/${req.file.filename}`;
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
  description: Joi.string().max(1000).optional(),
  date: Joi.date().required(),
  duration: Joi.string().max(50).optional(),
  organizer: Joi.string().max(200).optional(),
  credits: Joi.number().min(0).max(10).default(0),
});

// Submit new activity controller
const submitActivity = async (req, res) => {
  try {
    const { error, value } = activitySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    const activityData = {
      ...value,
      studentId: req.user.id,
      filePath: req.file ? req.file.path : null
    };

    const activity = await Activity.create(activityData);
    
    res.status(201).json({
      message: 'Activity submitted successfully',
      activity: {
        id: activity.id,
        title: activity.title,
        type: activity.type,
        date: activity.date,
        status: activity.status,
        credits: activity.credits
      }
    });

  } catch (error) {
    console.error('Submit activity error:', error);
    res.status(500).json({ message: 'Internal server error' });
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

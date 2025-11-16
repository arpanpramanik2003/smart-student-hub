const { Activity, User } = require('../utils/database');
const Joi = require('joi');

// Get all pending activities for faculty review
const getPendingActivities = async (req, res) => {
  try {
    const { page = 1, limit = 10, department } = req.query;
    const offset = (page - 1) * limit;

    const where = { status: 'pending' };
    
    // Faculty can see activities from their department or all if admin
    if (req.user.role === 'faculty' && department) {
      // Add department filter logic if needed
    }

    const { count, rows } = await Activity.findAndCountAll({
      where,
      include: [
        { 
          model: User, 
          as: 'student', 
          attributes: ['name', 'email', 'studentId', 'department', 'year']
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
    console.error('Get pending activities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all activities (approved/rejected) for faculty review
const getAllActivities = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, department } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status && status !== 'all') where.status = status;

    const { count, rows } = await Activity.findAndCountAll({
      where,
      include: [
        { 
          model: User, 
          as: 'student', 
          attributes: ['name', 'email', 'studentId', 'department', 'year']
        },
        { 
          model: User, 
          as: 'approver', 
          attributes: ['name', 'email'],
          required: false
        }
      ],
      order: [['updatedAt', 'DESC']],
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
    console.error('Get all activities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve or reject activity
const reviewActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { status, remarks, credits } = req.body;

    // Validation
    const schema = Joi.object({
      status: Joi.string().valid('approved', 'rejected').required(),
      remarks: Joi.string().max(500).optional(),
      credits: Joi.number().min(0).max(10).when('status', {
        is: 'approved',
        then: Joi.optional(),
        otherwise: Joi.forbidden()
      })
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    const activity = await Activity.findByPk(activityId, {
      include: [{ model: User, as: 'student', attributes: ['name', 'email'] }]
    });

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (activity.status !== 'pending') {
      return res.status(400).json({ message: 'Activity has already been reviewed' });
    }

    // Update activity
    const updateData = {
      status: value.status,
      approvedBy: req.user.id,
      remarks: value.remarks,
      ...(value.status === 'approved' && value.credits !== undefined && { credits: value.credits })
    };

    await activity.update(updateData);

    // Fetch updated activity with relations
    const updatedActivity = await Activity.findByPk(activityId, {
      include: [
        { model: User, as: 'student', attributes: ['name', 'email', 'studentId'] },
        { model: User, as: 'approver', attributes: ['name', 'email'] }
      ]
    });

    res.json({
      message: `Activity ${value.status} successfully`,
      activity: updatedActivity
    });

  } catch (error) {
    console.error('Review activity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get faculty dashboard statistics
const getFacultyStats = async (req, res) => {
  try {
    const totalActivities = await Activity.count();
    const pendingCount = await Activity.count({ where: { status: 'pending' } });
    const approvedCount = await Activity.count({ where: { status: 'approved' } });
    const rejectedCount = await Activity.count({ where: { status: 'rejected' } });
    
    const reviewedByMe = await Activity.count({ 
      where: { approvedBy: req.user.id } 
    });

    // Recent activities reviewed by this faculty
    const recentReviews = await Activity.findAll({
      where: { approvedBy: req.user.id },
      include: [
        { model: User, as: 'student', attributes: ['name', 'studentId'] }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 5
    });

    res.json({
      totalActivities,
      pendingCount,
      approvedCount,
      rejectedCount,
      reviewedByMe,
      recentReviews
    });

  } catch (error) {
    console.error('Get faculty stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getPendingActivities,
  getAllActivities, 
  reviewActivity,
  getFacultyStats
};

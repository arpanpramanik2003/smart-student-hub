const { Activity, User } = require('../utils/database');
const Joi = require('joi');

// Get all pending activities for faculty review
const getPendingActivities = async (req, res) => {
  try {
    const { page = 1, limit = 10, department } = req.query;
    const offset = (page - 1) * limit;

    const where = { status: 'pending' };
    
    // 🔥 Faculty can only see activities from students in their assigned program category
    if (req.user.role === 'faculty') {
      // Get faculty's program category
      const faculty = await User.findByPk(req.user.id, {
        attributes: ['programCategory']
      });
      
      // Only show activities from students in the same program category
      if (faculty && faculty.programCategory) {
        const studentsInCategory = await User.findAll({
          where: { 
            role: 'student',
            programCategory: faculty.programCategory 
          },
          attributes: ['id']
        });
        
        const studentIds = studentsInCategory.map(s => s.id);
        
        // Only filter if there are students in the category
        // If empty array, this means no students match - activities will show as empty (correct behavior)
        if (studentIds.length > 0) {
          where.studentId = studentIds;
        } else {
          // No students in this category - return no results by adding impossible condition
          where.id = -1;
        }
      }
      // If faculty has no programCategory, show all activities (backward compatibility)
    }

    const { count, rows } = await Activity.findAndCountAll({
      where,
      include: [
        { 
          model: User, 
          as: 'student', 
          attributes: ['name', 'email', 'studentId', 'department', 'programCategory', 'program', 'specialization', 'year']
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
    
    // 🔥 Faculty can only see activities from students in their assigned program category
    if (req.user.role === 'faculty') {
      const faculty = await User.findByPk(req.user.id, {
        attributes: ['programCategory']
      });
      
      if (faculty && faculty.programCategory) {
        const studentsInCategory = await User.findAll({
          where: { 
            role: 'student',
            programCategory: faculty.programCategory 
          },
          attributes: ['id']
        });
        
        const studentIds = studentsInCategory.map(s => s.id);
        
        // Only filter if there are students in the category
        if (studentIds.length > 0) {
          where.studentId = studentIds;
        } else {
          // No students in this category - return no results by adding impossible condition
          where.id = -1;
        }
      }
      // If faculty has no programCategory, show all activities (backward compatibility)
    }

    const { count, rows } = await Activity.findAndCountAll({
      where,
      include: [
        { 
          model: User, 
          as: 'student', 
          attributes: ['name', 'email', 'studentId', 'department', 'programCategory', 'program', 'specialization', 'year']
        },
        { 
          model: User, 
          as: 'approver', 
          attributes: ['name', 'email', 'programCategory'],
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
      remarks: Joi.string().max(500).allow('').optional(),
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
    // 🔥 Faculty can only see stats from students in their assigned program category
    let studentIds = null;
    
    if (req.user.role === 'faculty') {
      const faculty = await User.findByPk(req.user.id, {
        attributes: ['programCategory']
      });
      
      if (faculty && faculty.programCategory) {
        const studentsInCategory = await User.findAll({
          where: { 
            role: 'student',
            programCategory: faculty.programCategory 
          },
          attributes: ['id']
        });
        
        studentIds = studentsInCategory.map(s => s.id);
        
        // If no students in this category, set to empty array to show zero stats
        if (studentIds.length === 0) {
          return res.json({
            totalActivities: 0,
            pendingCount: 0,
            approvedCount: 0,
            rejectedCount: 0,
            reviewedByMe: 0,
            recentReviews: []
          });
        }
      }
      // If faculty has no programCategory, show all activities (backward compatibility)
    }
    
    // Build where clause for filtering by student IDs
    const activityWhere = studentIds ? { studentId: studentIds } : {};
    
    const totalActivities = await Activity.count({ where: activityWhere });
    const pendingCount = await Activity.count({ 
      where: { ...activityWhere, status: 'pending' } 
    });
    const approvedCount = await Activity.count({ 
      where: { ...activityWhere, status: 'approved' } 
    });
    const rejectedCount = await Activity.count({ 
      where: { ...activityWhere, status: 'rejected' } 
    });
    
    const reviewedByMe = await Activity.count({ 
      where: { ...activityWhere, approvedBy: req.user.id } 
    });

    // Recent activities reviewed by this faculty (also filtered by program category)
    const recentReviews = await Activity.findAll({
      where: { ...activityWhere, approvedBy: req.user.id },
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

// Get all students for faculty view
const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, year, programCategory, program, specialization, admissionYear } = req.query;
    const offset = (page - 1) * limit;

    const where = { role: 'student' };
    
    // 🔥 "View All, Approve Own" pattern - Faculty can VIEW all students
    // (Activity approval is restricted by program category in getPendingActivities/getAllActivities)
    // No automatic filtering by faculty's program category for student browsing
    
    // Add search filter (name, email, studentId, program, or specialization)
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { studentId: { [Op.like]: `%${search}%` } },
        { program: { [Op.like]: `%${search}%` } },
        { specialization: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Add program category filter (only if explicitly requested by user)
    if (programCategory && programCategory !== 'all') {
      where.programCategory = programCategory;
    }
    
    // Add program filter
    if (program && program !== 'all') {
      where.program = program;
    }
    
    // Add specialization filter
    if (specialization && specialization !== 'all') {
      where.specialization = specialization;
    }
    
    // Add year filter
    if (year && year !== 'all') {
      where.year = parseInt(year);
    }
    
    // Add admission year filter
    if (admissionYear && admissionYear !== 'all') {
      where.admissionYear = parseInt(admissionYear);
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: [
        'id', 'name', 'email', 'studentId', 'department', 'year',
        'programCategory', 'program', 'specialization', 'admissionYear',
        'phone', 'dateOfBirth', 'gender', 'category', 'address',
        'tenthResult', 'twelfthResult', 
        'skills', 'languages', 'hobbies', 'achievements',
        'projects', 'certifications',
        'linkedinUrl', 'githubUrl', 'portfolioUrl',
        'profilePicture', 'otherDetails', 'isActive', 'createdAt'
      ],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get activity stats for each student
    const studentsWithStats = await Promise.all(rows.map(async (student) => {
      const totalActivities = await Activity.count({ where: { studentId: student.id } });
      const approvedActivities = await Activity.count({ 
        where: { studentId: student.id, status: 'approved' } 
      });
      const totalCredits = await Activity.sum('credits', { 
        where: { studentId: student.id, status: 'approved' } 
      }) || 0;

      return {
        ...student.toJSON(),
        stats: {
          totalActivities,
          approvedActivities,
          totalCredits
        }
      };
    }));

    res.json({
      students: studentsWithStats,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        hasMore: offset + rows.length < count
      }
    });

  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getPendingActivities,
  getAllActivities, 
  reviewActivity,
  getFacultyStats,
  getAllStudents
};

const { Activity, User } = require('../utils/database');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { validateProgramSelection, getCategoryValue } = require('../constants/programsData');

// GET /api/admin/stats - Dashboard statistics
const getAdminStats = async (req, res) => {
  try {
    console.log('📊 Fetching admin statistics...');

    // Basic counts
    const totalUsers = await User.count();
    const studentCount = await User.count({ where: { role: 'student' } });
    const facultyCount = await User.count({ where: { role: 'faculty' } });
    const adminCount = await User.count({ where: { role: 'admin' } });

    const totalActivities = await Activity.count();
    const pendingActivities = await Activity.count({ where: { status: 'pending' } });
    const approvedActivities = await Activity.count({ where: { status: 'approved' } });
    const rejectedActivities = await Activity.count({ where: { status: 'rejected' } });

    console.log('✅ Basic counts:', { totalUsers, studentCount, facultyCount, adminCount });
    console.log('✅ Activity counts:', { totalActivities, pendingActivities, approvedActivities, rejectedActivities });

    // Program Category stats (replacing department stats)
    let programCategoryStats = [];
    try {
      programCategoryStats = await User.findAll({
        attributes: ['programCategory', [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']],
        where: {
          programCategory: { [Op.not]: null },
          role: { [Op.in]: ['student', 'faculty'] }
        },
        group: ['programCategory'],
        raw: true
      });
      console.log('✅ Program Category stats:', programCategoryStats);
    } catch (error) {
      console.error('❌ Program Category stats error:', error);
      programCategoryStats = [];
    }

    // Activity type stats
    let activityTypeStats = [];
    try {
      activityTypeStats = await Activity.findAll({
        attributes: ['type', [Activity.sequelize.fn('COUNT', Activity.sequelize.col('id')), 'count']],
        group: ['type'],
        raw: true
      });
      console.log('✅ Activity type stats:', activityTypeStats);
    } catch (error) {
      console.error('❌ Activity type stats error:', error);
      activityTypeStats = [];
    }

    // Top students with actual credits and activity counts
    let topStudents = [];
    try {
      console.log('🔍 Calculating top students...');

      const studentsWithActivities = await User.findAll({
        where: { role: 'student' },
        include: [{
          model: Activity,
          as: 'activities',
          attributes: ['credits', 'status'],
          required: false
        }],
        attributes: ['id', 'name', 'studentId', 'department', 'programCategory', 'program', 'specialization'],
        raw: false
      });

      console.log('👥 Found students:', studentsWithActivities.length);

      topStudents = studentsWithActivities.map(student => {
        const activities = student.activities || [];
        const approvedActivities = activities.filter(activity => activity.status === 'approved');

        const totalCredits = approvedActivities.reduce((sum, activity) => {
          return sum + (parseFloat(activity.credits) || 0);
        }, 0);

        const activityCount = activities.length;

        return {
          id: student.id,
          name: student.name || 'Unknown',
          studentId: student.studentId || 'N/A',
          department: student.department || null,
          programCategory: student.programCategory || null,
          program: student.program || null,
          specialization: student.specialization || null,
          totalCredits: Math.round(totalCredits * 10) / 10,
          activityCount: activityCount
        };
      })
        .filter(student => student.activityCount > 0 || student.totalCredits > 0)
        .sort((a, b) => {
          if (b.totalCredits !== a.totalCredits) {
            return b.totalCredits - a.totalCredits;
          }
          return b.activityCount - a.activityCount;
        })
        .slice(0, 10);

      console.log('🏆 Top students calculated:', topStudents.length, 'students');

    } catch (error) {
      console.error('❌ Top students calculation error:', error);
      topStudents = [];
    }

    const response = {
      userStats: { totalUsers, studentCount, facultyCount, adminCount },
      activityStats: { totalActivities, pendingActivities, approvedActivities, rejectedActivities },
      programCategoryStats: programCategoryStats.map(cat => ({
        programCategory: cat.programCategory || 'Unknown',
        count: parseInt(cat.count) || 0
      })),
      activityTypeStats: activityTypeStats.map(type => ({
        type: type.type || 'Unknown',
        count: parseInt(type.count) || 0
      })),
      topStudents
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch admin statistics',
      details: error.message
    });
  }
};

// GET /api/admin/users - Get all users with pagination and filters
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = 'all',
      programCategory = 'all',
      program = 'all',
      specialization = 'all',
      year = 'all',
      admissionYear = 'all'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { studentId: { [Op.like]: `%${search}%` } },
        { programCategory: { [Op.like]: `%${search}%` } },
        { program: { [Op.like]: `%${search}%` } },
        { specialization: { [Op.like]: `%${search}%` } }
      ];
    }

    if (role !== 'all') {
      whereClause.role = role;
    }

    if (programCategory !== 'all') {
      whereClause.programCategory = programCategory;
    }
    
    if (program !== 'all') {
      whereClause.program = program;
    }
    
    if (specialization !== 'all') {
      whereClause.specialization = specialization;
    }
    
    if (year !== 'all') {
      whereClause.year = parseInt(year);
    }
    
    if (admissionYear !== 'all') {
      whereClause.admissionYear = parseInt(admissionYear);
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: ['password'] }
    });

    res.json({
      users,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// POST /api/admin/users - Create new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, programCategory, program, specialization, year, admissionYear, studentId } = req.body;

    // Validation - programCategory required for both students and faculty
    if (!name || !email || !password || !role || !programCategory) {
      return res.status(400).json({
        error: 'Name, email, password, role, and program category are required'
      });
    }

    // Convert programCategory KEY to VALUE for database storage
    const programCategoryValue = getCategoryValue(programCategory);
    if (!programCategoryValue) {
      return res.status(400).json({
        error: 'Invalid program category'
      });
    }

    // Additional validation for students - program, specialization, and admissionYear are required
    if (role === 'student') {
      if (!program) {
        return res.status(400).json({
          error: 'Program is required for students'
        });
      }
      if (!specialization || specialization.trim() === '') {
        return res.status(400).json({
          error: 'Specialization is mandatory for students'
        });
      }
      if (!admissionYear) {
        return res.status(400).json({
          error: 'Admission year is mandatory for students'
        });
      }
    }

    // Validate program selection for students
    if (role === 'student' && programCategory && program) {
      const programValidation = validateProgramSelection(programCategory, program, specialization);
      if (!programValidation.valid) {
        return res.status(400).json({ 
          error: 'Invalid program selection', 
          details: programValidation.message 
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user (password will be hashed automatically by User model's beforeCreate hook)
    const user = await User.create({
      name,
      email,
      password, // Don't hash here - let the model hook handle it
      role,
      department: department || null, // Optional
      programCategory: programCategoryValue, // Required for both students and faculty (stored as VALUE)
      program: role === 'student' ? program : null,
      specialization: role === 'student' ? specialization : null, // Only for students (mandatory)
      year: role === 'student' ? year : null,
      admissionYear: role === 'student' ? admissionYear : null, // Only for students (mandatory)
      studentId: role === 'student' ? studentId : null,
      isActive: true
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toJSON();
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// PUT /api/admin/users/:id - Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, programCategory, program, specialization, year, admissionYear, studentId, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === parseInt(id) && isActive === false) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    // Validation - programCategory required if provided role is student or faculty
    if (role && (role === 'student' || role === 'faculty') && !programCategory) {
      return res.status(400).json({
        error: 'Program category is required for students and faculty'
      });
    }

    // Convert programCategory KEY to VALUE for database storage
    let programCategoryValue = programCategory;
    if (programCategory) {
      const converted = getCategoryValue(programCategory);
      if (!converted) {
        return res.status(400).json({
          error: 'Invalid program category'
        });
      }
      programCategoryValue = converted;
    }

    // Additional validation for students - program, specialization, and admissionYear are required
    if (role === 'student') {
      if (!program) {
        return res.status(400).json({
          error: 'Program is required for students'
        });
      }
      if (!specialization || specialization.trim() === '') {
        return res.status(400).json({
          error: 'Specialization is mandatory for students'
        });
      }
      if (!admissionYear) {
        return res.status(400).json({
          error: 'Admission year is mandatory for students'
        });
      }
    }

    // Validate program selection for students
    if (role === 'student' && programCategory && program) {
      const programValidation = validateProgramSelection(programCategory, program, specialization);
      if (!programValidation.valid) {
        return res.status(400).json({ 
          error: 'Invalid program selection', 
          details: programValidation.message 
        });
      }
    }

    // Update user
    await user.update({
      name,
      email,
      role,
      department: department !== undefined ? department : user.department,
      programCategory: programCategoryValue || user.programCategory,
      program: role === 'student' ? (program !== undefined ? program : user.program) : null,
      specialization: role === 'student' ? (specialization !== undefined ? specialization : user.specialization) : null,
      year: role === 'student' ? (year !== undefined ? year : user.year) : null,
      admissionYear: role === 'student' ? (admissionYear !== undefined ? admissionYear : user.admissionYear) : null,
      studentId: role === 'student' ? (studentId !== undefined ? studentId : user.studentId) : null,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    // Return updated user without password
    const { password: _, ...userWithoutPassword } = user.toJSON();
    res.json({
      success: true,
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// DELETE /api/admin/users/:id - Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Prevent deleting other admins
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin accounts' });
    }

    console.log(`🗑️ Deleting user ${id} (${user.name}) - Checking related records...`);
    
    // Delete activities created by this user
    const deletedActivities = await Activity.destroy({
      where: { studentId: id }
    });
    console.log(`✅ Deleted ${deletedActivities} activities created by user ${id}`);
    
    // Update activities approved by this user
    const [updatedCount] = await Activity.update(
      { 
        approvedBy: null, 
        remarks: `Previously approved by ${user.name} (deleted account)` 
      },
      { where: { approvedBy: id } }
    );
    console.log(`✅ Updated ${updatedCount} activities approved by user ${id}`);

    // Now delete the user
    await user.destroy();
    console.log(`✅ User ${id} deleted successfully`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        error: 'Cannot delete user due to related records. Please contact support.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// POST /api/admin/users/:id/toggle-status - Toggle user active status
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === parseInt(id) && user.isActive) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    // Prevent deactivating other admins
    if (user.role === 'admin' && user.isActive) {
      return res.status(400).json({ error: 'Cannot deactivate admin accounts' });
    }

    await user.update({ isActive: !user.isActive });

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
};

// GET /api/admin/reports - Generate comprehensive reports  
const getSystemReports = async (req, res) => {
  try {
    console.log('📊 Generating reports with filters:', req.query);

    const { startDate, endDate, format = 'json', status = 'all' } = req.query;

    // Build WHERE conditions
    let whereConditions = ['1=1'];
    let params = [];

    if (startDate) {
      whereConditions.push('a."createdAt" >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('a."createdAt" <= ?');
      params.push(endDate + ' 23:59:59');
    }

    if (status !== 'all') {
      whereConditions.push('a.status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.join(' AND ');

    const activitiesQuery = `
      SELECT 
        a.id,
        a.title,
        a.type,
        a.date,
        a.credits,
        a.organizer,
        a.description,
        a.status,
        a."createdAt",
        a."updatedAt",
        u.name as "userName",
        u."studentId",
        u.department,
        u."programCategory",
        u.program,
        u.specialization,
        u.year,
        u."admissionYear"
      FROM activities a
      LEFT JOIN users u ON a."studentId" = u.id
      WHERE ${whereClause}
      ORDER BY a."createdAt" DESC
    `;

    const activities = await Activity.sequelize.query(activitiesQuery, {
      replacements: params,
      type: Activity.sequelize.QueryTypes.SELECT
    });

    console.log(`✅ Found ${activities.length} activities`);

    // Calculate summary statistics
    const totalActivities = activities.length;
    const approvedActivities = activities.filter(activity => activity.status === 'approved');
    const totalCredits = approvedActivities.reduce((sum, activity) => sum + (parseFloat(activity.credits) || 0), 0);

    // Breakdowns
    const statusBreakdown = activities.reduce((acc, activity) => {
      const status = activity.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const programCategoryBreakdown = activities.reduce((acc, activity) => {
      const category = activity.programCategory || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const activityTypeBreakdown = activities.reduce((acc, activity) => {
      const type = activity.type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const reportData = {
      summary: {
        totalActivities,
        totalApprovedActivities: approvedActivities.length,
        totalCredits: Math.round(totalCredits * 10) / 10,
        statusBreakdown,
        programCategoryBreakdown,
        activityTypeBreakdown,
        dateRange: {
          start: startDate,
          end: endDate
        }
      },
      activities: activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        type: activity.type,
        date: activity.date,
        credits: parseFloat(activity.credits) || 0,
        organizer: activity.organizer,
        description: activity.description,
        status: activity.status,
        createdAt: activity.createdAt,
        student: {
          name: activity.userName,
          studentId: activity.studentId,
          department: activity.department,
          programCategory: activity.programCategory,
          program: activity.program,
          specialization: activity.specialization,
          year: activity.year,
          admissionYear: activity.admissionYear
        }
      }))
    };

    if (format === 'csv') {
      const csvSafe = (value) => {
        if (value === null || value === undefined) return '';
        return String(value).replace(/"/g, '""');
      };

      const csvHeader = 'Student Name,Student ID,Program Category,Program,Specialization,Department,Year,Admission Year,Activity Title,Type,Date,Credits,Organizer,Status,Created Date,Description\n';
      const csvRows = activities.map(activity => [
        `"${csvSafe(activity.userName)}"`,
        `"${csvSafe(activity.studentId)}"`,
        `"${csvSafe(activity.programCategory)}"`,
        `"${csvSafe(activity.program)}"`,
        `"${csvSafe(activity.specialization)}"`,
        `"${csvSafe(activity.department)}"`,
        `"${csvSafe(activity.year)}"`,
        `"${csvSafe(activity.admissionYear || '')}"`,
        `"${csvSafe(activity.title)}"`,
        `"${csvSafe(activity.type)}"`,
        `"${csvSafe(activity.date)}"`,
        parseFloat(activity.credits) || 0,
        `"${csvSafe(activity.organizer)}"`,
        `"${csvSafe(activity.status)}"`,
        `"${csvSafe(activity.createdAt)}"`,
        `"${csvSafe(activity.description)}"`
      ].join(',')).join('\n');

      const csvContent = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="activity-report-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\ufeff' + csvContent);
    } else {
      res.json(reportData);
    }
  } catch (error) {
    console.error('❌ Generate reports error:', error);
    res.status(500).json({
      error: 'Failed to generate reports',
      details: error.message
    });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getSystemReports
};

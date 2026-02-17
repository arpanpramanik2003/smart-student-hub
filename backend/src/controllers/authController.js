const jwt = require('jsonwebtoken');
const { User } = require('../utils/database');
const Joi = require('joi');
const { PROGRAM_CATEGORIES, validateProgramSelection, getCategoryValue } = require('../constants/programsData');

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
    .messages({
      'string.pattern.base': 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
    }),
  role: Joi.string().valid('student', 'faculty').default('student'),
  
  // NEW: Program structure fields (required for both student and faculty)
  programCategory: Joi.string().required(), // Required for both roles
  program: Joi.string().when('role', {
    is: 'student',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  specialization: Joi.string().when('role', {
    is: 'student',
    then: Joi.required().messages({
      'any.required': 'Specialization is mandatory for students'
    }),
    otherwise: Joi.optional().allow('', null)
  }),
  
  // Legacy department field (optional for backward compatibility)
  department: Joi.string().optional(),
  
  year: Joi.number().integer().when('role', {
    is: 'student', 
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  admissionYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).when('role', {
    is: 'student',
    then: Joi.required().messages({
      'any.required': 'Admission year is mandatory for students'
    }),
    otherwise: Joi.optional()
  }),
  studentId: Joi.string().when('role', {
    is: 'student',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register new user
const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details[0].message 
      });
    }

    const { name, email, password, role, department, programCategory, program, specialization, year, admissionYear, studentId } = value;

    // Convert programCategory KEY to VALUE for database storage
    const programCategoryValue = getCategoryValue(programCategory);
    if (!programCategoryValue) {
      return res.status(400).json({ 
        message: 'Invalid program category' 
      });
    }

    // Additional validation for student program selection
    if (role === 'student') {
      // Validate that specialization is provided and not empty for students
      if (!specialization || specialization.trim() === '') {
        return res.status(400).json({ 
          message: 'Specialization is mandatory for students'
        });
      }
      
      // Validate program selection
      const programValidation = validateProgramSelection(programCategory, program, specialization);
      if (!programValidation.valid) {
        return res.status(400).json({ 
          message: 'Invalid program selection', 
          details: programValidation.message 
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    // Check if studentId already exists (for students)
    if (role === 'student' && studentId) {
      const existingStudent = await User.findOne({ where: { studentId } });
      if (existingStudent) {
        return res.status(409).json({ message: 'Student ID already exists' });
      }
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role,
      department: department || programCategoryValue, // Use programCategoryValue if department not provided
      programCategory: programCategoryValue, // Store as VALUE
      program: role === 'student' ? program : null,
      specialization: role === 'student' ? specialization : null, // Only for students
      year: role === 'student' ? year : null,
      admissionYear: role === 'student' ? admissionYear : null, // Only for students
      studentId: role === 'student' ? studentId : null
    });

    // Generate token
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        programCategory: user.programCategory,
        program: user.program,
        specialization: user.specialization,
        year: user.year,
        admissionYear: user.admissionYear,
        studentId: user.studentId,
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      // Don't reveal validation details to prevent user enumeration
      return res.status(400).json({ 
        message: 'Invalid input' 
      });
    }

    const { email, password } = value;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      // Generic error message to prevent user enumeration
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        programCategory: user.programCategory,
        program: user.program,
        specialization: user.specialization,
        year: user.year,
        studentId: user.studentId,
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// 🔥 MAIN FIX: Get current user profile with fresh data from database
const getProfile = async (req, res) => {
  try {
    // ✅ Fetch fresh user data from database (not from req.user)
    const user = await User.findByPk(req.user.id, {
      attributes: [
        'id', 
        'name', 
        'email', 
        'role', 
        'department',
        'programCategory',
        'program',
        'specialization',
        'year', 
        'studentId', 
        'profilePicture',
        'isActive'
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        programCategory: user.programCategory,
        program: user.program,
        specialization: user.specialization,
        year: user.year,
        studentId: user.studentId,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  getProfile
};

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('student', 'faculty', 'admin'), allowNull: false, defaultValue: 'student' },
    department: { type: DataTypes.STRING, allowNull: true }, // Legacy field, kept for compatibility
    
    // 🎓 NEW PROGRAM STRUCTURE FIELDS
    programCategory: { type: DataTypes.STRING, allowNull: true }, // e.g., "Engineering & Technology"
    program: { type: DataTypes.STRING, allowNull: true }, // e.g., "B.Tech"
    specialization: { type: DataTypes.STRING, allowNull: true }, // e.g., "Artificial Intelligence & Machine Learning"
    
    year: { type: DataTypes.INTEGER, allowNull: true },
    studentId: { type: DataTypes.STRING, allowNull: true, unique: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    
    // 🔥 EXISTING CV FIELDS (already in your model)
    profilePicture: { type: DataTypes.STRING, allowNull: true },
    tenthResult: { type: DataTypes.STRING, allowNull: true },
    twelfthResult: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    languages: { type: DataTypes.STRING, allowNull: true }, // Comma separated
    skills: { type: DataTypes.STRING, allowNull: true }, // Comma separated
    otherDetails: { type: DataTypes.TEXT, allowNull: true },

    // 🔥 NEW FIELDS NEEDED (Add these to fix the saving issue)
    phone: { type: DataTypes.STRING, allowNull: true },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
    gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: true },
    category: { type: DataTypes.ENUM('General', 'OBC', 'SC', 'ST'), allowNull: true },
    hobbies: { type: DataTypes.STRING, allowNull: true },
    achievements: { type: DataTypes.TEXT, allowNull: true },
    projects: { type: DataTypes.TEXT, allowNull: true },
    certifications: { type: DataTypes.TEXT, allowNull: true },
    linkedinUrl: { type: DataTypes.STRING, allowNull: true, validate: { isUrl: true } },
    githubUrl: { type: DataTypes.STRING, allowNull: true, validate: { isUrl: true } },
    portfolioUrl: { type: DataTypes.STRING, allowNull: true, validate: { isUrl: true } },
  }, {
    timestamps: true, // This will add createdAt and updatedAt
    tableName: 'users'
  });

  User.beforeCreate(async (user) => {
    if (user.password) user.password = await bcrypt.hash(user.password, 12);
  });
  
  User.beforeUpdate(async (user) => {
    if (user.changed('password')) user.password = await bcrypt.hash(user.password, 12);
  });
  
  User.prototype.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  return User;
};

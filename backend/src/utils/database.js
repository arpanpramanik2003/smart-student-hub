const { Sequelize } = require('sequelize');
const path = require('path');

// Database setup - PostgreSQL (Supabase) for production, SQLite for local dev
let sequelize;

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  // Production: PostgreSQL (Supabase)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Supabase requires SSL
      }
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
  console.log('🐘 Using PostgreSQL (Supabase) database');
} else {
  // Development: SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../', process.env.DB_NAME || 'smart_student_hub.db'),
    logging: console.log,
  });
  console.log('💾 Using SQLite database for development');
}

// Import models
const UserModel = require('../models/User');
const ActivityModel = require('../models/Activity');

// Initialize models
const User = UserModel(sequelize);
const Activity = ActivityModel(sequelize);

// Define associations
User.hasMany(Activity, { foreignKey: 'studentId', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Activity.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// 🔥 Migration helper function
const migrateDatabase = async () => {
  try {
    // Check if new columns exist, if not add them
    const queryInterface = sequelize.getQueryInterface();
    const tableDescription = await queryInterface.describeTable('users');
    
    console.log('🔄 Checking for missing columns...');
    
    const newColumns = [
      { name: 'phone', definition: { type: 'VARCHAR(255)', allowNull: true } },
      { name: 'dateOfBirth', definition: { type: 'DATE', allowNull: true } },
      { name: 'gender', definition: { type: 'VARCHAR(255)', allowNull: true } },
      { name: 'category', definition: { type: 'VARCHAR(255)', allowNull: true } },
      { name: 'hobbies', definition: { type: 'VARCHAR(255)', allowNull: true } },
      { name: 'achievements', definition: { type: 'TEXT', allowNull: true } },
      { name: 'projects', definition: { type: 'TEXT', allowNull: true } },
      { name: 'certifications', definition: { type: 'TEXT', allowNull: true } },
      { name: 'linkedinUrl', definition: { type: 'VARCHAR(255)', allowNull: true } },
      { name: 'githubUrl', definition: { type: 'VARCHAR(255)', allowNull: true } },
      { name: 'portfolioUrl', definition: { type: 'VARCHAR(255)', allowNull: true } }
    ];

    for (const column of newColumns) {
      if (!tableDescription[column.name]) {
        console.log(`➕ Adding column: ${column.name}`);
        await queryInterface.addColumn('users', column.name, column.definition);
      }
    }
    
    console.log('✅ Database migration completed.');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
};

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // First sync with alter: true to add new columns
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');
    
    // Run migration for any missing columns
    await migrateDatabase();
    
    // Create default admin user if not exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@smartstudenthub.com',
        password: 'admin123',
        role: 'admin',
        department: 'Administration'
      });
      console.log('✅ Default admin user created.');
    }
    
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Activity,
  syncDatabase
};

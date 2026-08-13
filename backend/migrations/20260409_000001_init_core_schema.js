export const id = '20260409_000001_init_core_schema';

const normalizeTableName = (table) => {
  if (typeof table === 'string') {
    return table;
  }

  if (table?.tableName) {
    return table.tableName;
  }

  return String(table);
};

const currentTimestampLiteral = (Sequelize, dialect) => {
  if (dialect === 'postgres') {
    return Sequelize.literal('NOW()');
  }

  return Sequelize.literal('CURRENT_TIMESTAMP');
};

export const up = async ({ queryInterface, Sequelize, dialect }) => {
  const tables = await queryInterface.showAllTables();
  const tableNames = new Set(tables.map(normalizeTableName));
  const tsDefault = currentTimestampLiteral(Sequelize, dialect);

  if (!tableNames.has('users')) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      role: {
        type: Sequelize.ENUM('student', 'faculty', 'admin'),
        allowNull: false,
        defaultValue: 'student',
      },
      department: { type: Sequelize.STRING, allowNull: true },
      programCategory: { type: Sequelize.STRING, allowNull: true },
      program: { type: Sequelize.STRING, allowNull: true },
      specialization: { type: Sequelize.STRING, allowNull: true },
      year: { type: Sequelize.INTEGER, allowNull: true },
      admissionYear: { type: Sequelize.INTEGER, allowNull: true },
      studentId: { type: Sequelize.STRING, allowNull: true, unique: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      profilePicture: { type: Sequelize.STRING, allowNull: true },
      tenthResult: { type: Sequelize.STRING, allowNull: true },
      twelfthResult: { type: Sequelize.STRING, allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      languages: { type: Sequelize.STRING, allowNull: true },
      skills: { type: Sequelize.STRING, allowNull: true },
      otherDetails: { type: Sequelize.TEXT, allowNull: true },
      phone: { type: Sequelize.STRING, allowNull: true },
      dateOfBirth: { type: Sequelize.DATEONLY, allowNull: true },
      gender: { type: Sequelize.ENUM('Male', 'Female', 'Other'), allowNull: true },
      category: { type: Sequelize.ENUM('General', 'OBC', 'SC', 'ST'), allowNull: true },
      hobbies: { type: Sequelize.STRING, allowNull: true },
      achievements: { type: Sequelize.TEXT, allowNull: true },
      projects: { type: Sequelize.TEXT, allowNull: true },
      certifications: { type: Sequelize.TEXT, allowNull: true },
      linkedinUrl: { type: Sequelize.STRING, allowNull: true },
      githubUrl: { type: Sequelize.STRING, allowNull: true },
      portfolioUrl: { type: Sequelize.STRING, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: tsDefault },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: tsDefault },
    });

    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['studentId']);
  }

  if (!tableNames.has('activities')) {
    await queryInterface.createTable('activities', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING, allowNull: false },
      type: {
        type: Sequelize.ENUM(
          'conference',
          'workshop',
          'certification',
          'competition',
          'internship',
          'leadership',
          'community_service',
          'club_activity',
          'online_course'
        ),
        allowNull: false,
      },
      description: { type: Sequelize.TEXT, allowNull: true },
      date: { type: Sequelize.DATE, allowNull: false },
      duration: { type: Sequelize.STRING, allowNull: true },
      organizer: { type: Sequelize.STRING, allowNull: true },
      filePath: { type: Sequelize.STRING, allowNull: true },
      status: {
        type: Sequelize.ENUM('pending', 'pending_mentor', 'mentor_approved', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      approvedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      credits: { type: Sequelize.DECIMAL(3, 1), allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: tsDefault },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: tsDefault },
    });

    await queryInterface.addIndex('activities', ['studentId']);
    await queryInterface.addIndex('activities', ['status']);
    await queryInterface.addIndex('activities', ['type']);
    await queryInterface.addIndex('activities', ['date']);
  }
};

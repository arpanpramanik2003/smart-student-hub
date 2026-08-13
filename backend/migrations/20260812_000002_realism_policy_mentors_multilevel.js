export const id = '20260812_000002_realism_policy_mentors_multilevel';

const normalizeTableName = (table) => {
  if (typeof table === 'string') return table;
  if (table?.tableName) return table.tableName;
  return String(table);
};

const currentTimestampLiteral = (Sequelize, dialect) => {
  if (dialect === 'postgres') return Sequelize.literal('NOW()');
  return Sequelize.literal('CURRENT_TIMESTAMP');
};

const NAAC_CRITERION_MAP = {
  online_course: 'Criterion 1',
  certification: 'Criterion 1',
  workshop: 'Criterion 1',
  conference: 'Criterion 2',
  competition: 'Criterion 3',
  internship: 'Criterion 3',
  leadership: 'Criterion 5',
  club_activity: 'Criterion 5',
  community_service: 'Criterion 7',
};

const LEVEL_MULTIPLIERS = {
  college: 1.0,
  state: 1.5,
  national: 2.0,
  international: 3.0,
};

const BASE_CREDITS = {
  conference: 2.0,
  workshop: 1.0,
  certification: 2.0,
  competition: 2.0,
  internship: 3.0,
  leadership: 1.5,
  community_service: 1.5,
  club_activity: 1.0,
  online_course: 1.5,
};

export const up = async ({ queryInterface, Sequelize, dialect }) => {
  const tables = await queryInterface.showAllTables();
  const tableNames = new Set(tables.map(normalizeTableName));
  const tsDefault = currentTimestampLiteral(Sequelize, dialect);

  // 1. Create credit_policies table
  if (!tableNames.has('credit_policies')) {
    await queryInterface.createTable('credit_policies', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      activityType: { type: Sequelize.STRING, allowNull: false },
      level: { type: Sequelize.STRING, allowNull: false },
      credits: { type: Sequelize.DECIMAL(3, 1), allowNull: false, defaultValue: 1.0 },
      naacCriterion: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: tsDefault },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: tsDefault },
    });

    await queryInterface.addIndex('credit_policies', ['activityType', 'level'], { unique: true });
    await queryInterface.addIndex('credit_policies', ['isActive']);

    // Seed default credit policies for all combinations (9 types * 4 levels)
    const activityTypes = Object.keys(NAAC_CRITERION_MAP);
    const levels = ['college', 'state', 'national', 'international'];
    const policyRecords = [];

    for (const type of activityTypes) {
      for (const level of levels) {
        const base = BASE_CREDITS[type] || 1.0;
        const mult = LEVEL_MULTIPLIERS[level] || 1.0;
        const calculatedCredits = Math.min(10.0, Math.round(base * mult * 10) / 10);
        policyRecords.push({
          activityType: type,
          level: level,
          credits: calculatedCredits,
          naacCriterion: NAAC_CRITERION_MAP[type] || 'Criterion 5',
          description: `Default policy for ${type.replace('_', ' ')} at ${level} level.`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    await queryInterface.bulkInsert('credit_policies', policyRecords);
  }

  // 2. Add mentorId to users table
  const userTableInfo = await queryInterface.describeTable('users');
  if (!userTableInfo.mentorId) {
    await queryInterface.addColumn('users', 'mentorId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('users', ['mentorId']);
  }

  // 3. Add achievementLevel, policyId, naacCriterion, mentor/admin review fields to activities table
  const activityTableInfo = await queryInterface.describeTable('activities');
  
  if (!activityTableInfo.achievementLevel) {
    await queryInterface.addColumn('activities', 'achievementLevel', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'college',
    });
  }

  if (!activityTableInfo.policyId) {
    await queryInterface.addColumn('activities', 'policyId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'credit_policies', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }

  if (!activityTableInfo.naacCriterion) {
    await queryInterface.addColumn('activities', 'naacCriterion', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }

  if (!activityTableInfo.mentorReviewedBy) {
    await queryInterface.addColumn('activities', 'mentorReviewedBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }

  if (!activityTableInfo.mentorReviewedAt) {
    await queryInterface.addColumn('activities', 'mentorReviewedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  }

  if (!activityTableInfo.mentorRemarks) {
    await queryInterface.addColumn('activities', 'mentorRemarks', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  }

  if (!activityTableInfo.finalApprovedBy) {
    await queryInterface.addColumn('activities', 'finalApprovedBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }

  if (!activityTableInfo.finalApprovedAt) {
    await queryInterface.addColumn('activities', 'finalApprovedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  }

  if (!activityTableInfo.adminRemarks) {
    await queryInterface.addColumn('activities', 'adminRemarks', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  }

  // Populate naacCriterion for existing activities based on activity type
  for (const [type, criterion] of Object.entries(NAAC_CRITERION_MAP)) {
    await queryInterface.bulkUpdate('activities', { naacCriterion: criterion }, { type: type });
  }

  if (dialect === 'postgres') {
    await queryInterface.sequelize.query(`ALTER TYPE "enum_activities_status" ADD VALUE IF NOT EXISTS 'pending_mentor';`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_activities_status" ADD VALUE IF NOT EXISTS 'mentor_approved';`);
  }

  // Migrate existing status 'pending' -> 'pending_mentor'
  await queryInterface.bulkUpdate('activities', { status: 'pending_mentor' }, { status: 'pending' });
};

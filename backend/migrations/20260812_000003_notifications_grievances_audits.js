export const id = '20260812_000003_notifications_grievances_audits';

const normalizeTableName = (table) => {
  if (typeof table === 'string') return table;
  if (table?.tableName) return table.tableName;
  return String(table);
};

const currentTimestampLiteral = (Sequelize, dialect) => {
  if (dialect === 'postgres') return Sequelize.literal('NOW()');
  return Sequelize.literal('CURRENT_TIMESTAMP');
};

export const up = async ({ queryInterface, Sequelize, dialect }) => {
  const tables = await queryInterface.showAllTables();
  const tableNames = new Set(tables.map(normalizeTableName));
  const tsDefault = currentTimestampLiteral(Sequelize, dialect);

  // 1. Create notifications table
  if (!tableNames.has('notifications')) {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type: { type: Sequelize.STRING, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      activityId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'activities', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      isRead: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      readAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: tsDefault },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: tsDefault },
    });

    await queryInterface.addIndex('notifications', ['userId', 'isRead']);
  }

  // 2. Create activity_audits table
  if (!tableNames.has('activity_audits')) {
    await queryInterface.createTable('activity_audits', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      activityId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'activities', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      previousStatus: { type: Sequelize.STRING, allowNull: false },
      newStatus: { type: Sequelize.STRING, allowNull: false },
      performedBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      snapshotData: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: tsDefault },
    });

    await queryInterface.addIndex('activity_audits', ['activityId']);
  }

  // 3. Create activity_grievances table
  if (!tableNames.has('activity_grievances')) {
    await queryInterface.createTable('activity_grievances', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      activityId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'activities', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      appealReason: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending_admin' },
      adminId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      adminResolutionRemarks: { type: Sequelize.TEXT, allowNull: true },
      resolvedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: tsDefault },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: tsDefault },
    });

    await queryInterface.addIndex('activity_grievances', ['status']);
    await queryInterface.addIndex('activity_grievances', ['activityId']);
  }
};

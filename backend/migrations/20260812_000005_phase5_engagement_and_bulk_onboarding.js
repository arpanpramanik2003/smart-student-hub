export const id = '20260812_000005_phase5_engagement_and_bulk_onboarding';

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

  // 1. Add mustChangePassword to users table if missing
  const userTableDescription = await queryInterface.describeTable('users');
  if (!userTableDescription.mustChangePassword) {
    await queryInterface.addColumn('users', 'mustChangePassword', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }

  // 2. Create user_imports table for bulk onboarding audit logs
  if (!tableNames.has('user_imports')) {
    await queryInterface.createTable('user_imports', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      adminId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      fileName: { type: Sequelize.STRING, allowNull: false },
      totalRows: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      skippedCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      errorCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      details: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: tsDefault },
    });

    await queryInterface.addIndex('user_imports', ['adminId']);
  }
};

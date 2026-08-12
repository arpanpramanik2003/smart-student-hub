import { DataTypes } from 'sequelize';

export default function UserImportModel(sequelize) {
  const UserImport = sequelize.define(
    'UserImport',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      fileName: { type: DataTypes.STRING, allowNull: false },
      totalRows: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      createdCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      skippedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      errorCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      details: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      timestamps: true,
      tableName: 'user_imports',
    }
  );

  return UserImport;
}

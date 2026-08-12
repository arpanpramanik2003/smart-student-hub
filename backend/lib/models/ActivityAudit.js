import { DataTypes } from 'sequelize';

export default function ActivityAuditModel(sequelize) {
  const ActivityAudit = sequelize.define(
    'ActivityAudit',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      activityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'activities', key: 'id' },
      },
      previousStatus: { type: DataTypes.STRING, allowNull: false },
      newStatus: { type: DataTypes.STRING, allowNull: false },
      performedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      snapshotData: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      timestamps: true,
      updatedAt: false,
      tableName: 'activity_audits',
    }
  );

  return ActivityAudit;
}

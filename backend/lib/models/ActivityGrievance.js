import { DataTypes } from 'sequelize';

export default function ActivityGrievanceModel(sequelize) {
  const ActivityGrievance = sequelize.define(
    'ActivityGrievance',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      activityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'activities', key: 'id' },
      },
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      appealReason: { type: DataTypes.TEXT, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending_admin' },
      adminId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      adminResolutionRemarks: { type: DataTypes.TEXT, allowNull: true },
      resolvedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      timestamps: true,
      tableName: 'activity_grievances',
    }
  );

  return ActivityGrievance;
}

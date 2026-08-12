import { DataTypes } from 'sequelize';

export default function NotificationModel(sequelize) {
  const Notification = sequelize.define(
    'Notification',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      type: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      activityId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'activities', key: 'id' },
      },
      isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      readAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      timestamps: true,
      tableName: 'notifications',
    }
  );

  return Notification;
}

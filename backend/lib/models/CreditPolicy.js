import { DataTypes } from 'sequelize';

export default function CreditPolicyModel(sequelize) {
  const CreditPolicy = sequelize.define(
    'CreditPolicy',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      activityType: { type: DataTypes.STRING, allowNull: false },
      level: { type: DataTypes.STRING, allowNull: false },
      credits: { type: DataTypes.DECIMAL(3, 1), allowNull: false, defaultValue: 1.0 },
      naacCriterion: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      timestamps: true,
      tableName: 'credit_policies',
    }
  );

  return CreditPolicy;
}

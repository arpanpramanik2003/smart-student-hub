import { DataTypes } from 'sequelize';

export default function ActivityModel(sequelize) {
  const Activity = sequelize.define(
    'Activity',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      title: { type: DataTypes.STRING, allowNull: false },
      type: {
        type: DataTypes.ENUM(
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
      achievementLevel: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'college',
      },
      policyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'credit_policies', key: 'id' },
      },
      naacCriterion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      date: { type: DataTypes.DATE, allowNull: false },
      duration: { type: DataTypes.STRING, allowNull: true },
      organizer: { type: DataTypes.STRING, allowNull: true },
      filePath: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.ENUM('pending_mentor', 'mentor_approved', 'approved', 'rejected'),
        defaultValue: 'pending_mentor',
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      mentorReviewedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      mentorReviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      mentorRemarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      finalApprovedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      finalApprovedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      adminRemarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      credits: { type: DataTypes.DECIMAL(3, 1), defaultValue: 0 },
      verificationId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      isRevoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      revokedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      revocationReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: 'activities',
    }
  );

  return Activity;
}
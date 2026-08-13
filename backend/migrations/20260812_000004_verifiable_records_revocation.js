import crypto from 'crypto';

export const id = '20260812_000004_verifiable_records_revocation';

export const up = async ({ queryInterface, Sequelize }) => {
  const tableDescription = await queryInterface.describeTable('activities');

  if (!tableDescription.verificationId) {
    await queryInterface.addColumn('activities', 'verificationId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }

  if (!tableDescription.isRevoked) {
    await queryInterface.addColumn('activities', 'isRevoked', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }

  if (!tableDescription.revokedAt) {
    await queryInterface.addColumn('activities', 'revokedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  }

  if (!tableDescription.revokedBy) {
    await queryInterface.addColumn('activities', 'revokedBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }

  if (!tableDescription.revocationReason) {
    await queryInterface.addColumn('activities', 'revocationReason', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  }

  try {
    await queryInterface.addIndex('activities', ['verificationId'], { unique: true });
  } catch (err) {
    // Index might already exist
  }

  // Backfill verificationId for any existing approved activities that don't have one
  const approvedActivities = await queryInterface.sequelize.query(
    `SELECT id FROM "activities" WHERE "status" = 'approved' AND ("verificationId" IS NULL OR "verificationId" = '')`,
    { type: Sequelize.QueryTypes.SELECT }
  );

  for (const act of approvedActivities) {
    const token = 'vref_' + crypto.randomBytes(16).toString('hex');
    await queryInterface.sequelize.query(
      `UPDATE "activities" SET "verificationId" = :token WHERE "id" = :id`,
      { replacements: { token, id: act.id } }
    );
  }
};

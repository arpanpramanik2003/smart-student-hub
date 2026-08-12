import { Sequelize } from 'sequelize';
import path from 'path';
import pg from 'pg';
import { loadConfig } from './config.js';
import { runMigrations } from './migrations.js';

const g = globalThis;

const createSequelize = () => {
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectModule: pg,
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      logging: false,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    });
  }

  const configuredStorage = process.env.DB_PATH || process.env.DB_NAME;
  if (!configuredStorage) {
    throw new Error('SQLite database path is not configured. Set DB_PATH or DB_NAME in backend/.env');
  }

  const dbPath = path.isAbsolute(configuredStorage)
    ? configuredStorage
    : path.join(process.cwd(), configuredStorage);

  return new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
  });
};

export const initDB = async () => {
  if (
    g.__db_initialized &&
    g.__db_User &&
    g.__db_Activity &&
    g.__db_CreditPolicy &&
    g.__db_Notification &&
    g.__db_ActivityAudit &&
    g.__db_ActivityGrievance
  ) {
    return {
      sequelize: g.__db_sequelize,
      User: g.__db_User,
      Activity: g.__db_Activity,
      CreditPolicy: g.__db_CreditPolicy,
      Notification: g.__db_Notification,
      ActivityAudit: g.__db_ActivityAudit,
      ActivityGrievance: g.__db_ActivityGrievance,
    };
  }

  const config = loadConfig();

  if (!g.__db_sequelize) {
    g.__db_sequelize = createSequelize();
  }

  const sq = g.__db_sequelize;

  const { default: UserModel } = await import('./models/User.js');
  const { default: ActivityModel } = await import('./models/Activity.js');
  const { default: CreditPolicyModel } = await import('./models/CreditPolicy.js');
  const { default: NotificationModel } = await import('./models/Notification.js');
  const { default: ActivityAuditModel } = await import('./models/ActivityAudit.js');
  const { default: ActivityGrievanceModel } = await import('./models/ActivityGrievance.js');

  g.__db_User = g.__db_User || UserModel(sq);
  g.__db_Activity = g.__db_Activity || ActivityModel(sq);
  g.__db_CreditPolicy = g.__db_CreditPolicy || CreditPolicyModel(sq);
  g.__db_Notification = g.__db_Notification || NotificationModel(sq);
  g.__db_ActivityAudit = g.__db_ActivityAudit || ActivityAuditModel(sq);
  g.__db_ActivityGrievance = g.__db_ActivityGrievance || ActivityGrievanceModel(sq);

  const User = g.__db_User;
  const Activity = g.__db_Activity;
  const CreditPolicy = g.__db_CreditPolicy;
  const Notification = g.__db_Notification;
  const ActivityAudit = g.__db_ActivityAudit;
  const ActivityGrievance = g.__db_ActivityGrievance;

  if (!g.__db_associations_set) {
    User.hasMany(Activity, { foreignKey: 'studentId', as: 'activities' });
    Activity.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
    Activity.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

    // Mentor-Mentee association
    User.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
    User.hasMany(User, { foreignKey: 'mentorId', as: 'mentees' });

    // Credit Policy association
    Activity.belongsTo(CreditPolicy, { foreignKey: 'policyId', as: 'policy' });
    CreditPolicy.hasMany(Activity, { foreignKey: 'policyId', as: 'activities' });

    // Two-stage review associations
    Activity.belongsTo(User, { foreignKey: 'mentorReviewedBy', as: 'mentorReviewer' });
    Activity.belongsTo(User, { foreignKey: 'finalApprovedBy', as: 'finalApprover' });

    // Notification associations
    User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
    Notification.belongsTo(User, { foreignKey: 'userId', as: 'recipient' });
    Notification.belongsTo(Activity, { foreignKey: 'activityId', as: 'activity' });

    // Audit Log associations
    Activity.hasMany(ActivityAudit, { foreignKey: 'activityId', as: 'audits' });
    ActivityAudit.belongsTo(Activity, { foreignKey: 'activityId', as: 'activity' });
    ActivityAudit.belongsTo(User, { foreignKey: 'performedBy', as: 'performer' });

    // Grievance / Appeals associations
    Activity.hasMany(ActivityGrievance, { foreignKey: 'activityId', as: 'grievances' });
    ActivityGrievance.belongsTo(Activity, { foreignKey: 'activityId', as: 'activity' });
    ActivityGrievance.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
    ActivityGrievance.belongsTo(User, { foreignKey: 'adminId', as: 'resolver' });

    g.__db_associations_set = true;
  }

  if (!g.__db_initialized) {
    try {
      await sq.authenticate();
      await runMigrations(sq);

      if (config.dbSyncStrategy === 'alter' && config.isProduction) {
        throw new Error('DB_SYNC_STRATEGY=alter is not allowed in production.');
      }

      try {
        if (config.dbSyncStrategy === 'safe') {
          await CreditPolicy.sync();
          await User.sync();
          await Activity.sync();
          await Notification.sync();
          await ActivityAudit.sync();
          await ActivityGrievance.sync();
        } else if (config.dbSyncStrategy === 'alter') {
          await CreditPolicy.sync({ alter: true });
          await User.sync({ alter: true });
          await Activity.sync({ alter: true });
          await Notification.sync({ alter: true });
          await ActivityAudit.sync({ alter: true });
          await ActivityGrievance.sync({ alter: true });
        } else {
          console.log('DB sync disabled. Using migrations only.');
        }
      } catch (syncError) {
        if (config.dbSyncStrategy === 'alter' && !config.isProduction) {
          console.warn('DB alter failed, falling back to safe sync:', syncError.message);
          await CreditPolicy.sync();
          await User.sync();
          await Activity.sync();
          await Notification.sync();
          await ActivityAudit.sync();
          await ActivityGrievance.sync();
        } else {
          throw syncError;
        }
      }

      g.__db_initialized = true;
    } catch (error) {
      console.error('DB initialization error:', error.message);
      throw error;
    }
  }

  return {
    sequelize: sq,
    User,
    Activity,
    CreditPolicy,
    Notification,
    ActivityAudit,
    ActivityGrievance,
  };
};
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
  if (g.__db_initialized && g.__db_User && g.__db_Activity) {
    return { sequelize: g.__db_sequelize, User: g.__db_User, Activity: g.__db_Activity };
  }

  const config = loadConfig();

  if (!g.__db_sequelize) {
    g.__db_sequelize = createSequelize();
  }

  const sq = g.__db_sequelize;

  const { default: UserModel } = await import('./models/User.js');
  const { default: ActivityModel } = await import('./models/Activity.js');

  g.__db_User = g.__db_User || UserModel(sq);
  g.__db_Activity = g.__db_Activity || ActivityModel(sq);

  const User = g.__db_User;
  const Activity = g.__db_Activity;

  if (!g.__db_associations_set) {
    User.hasMany(Activity, { foreignKey: 'studentId', as: 'activities' });
    Activity.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
    Activity.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
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
          await User.sync();
          await Activity.sync();
        } else if (config.dbSyncStrategy === 'alter') {
          await User.sync({ alter: true });
          await Activity.sync({ alter: true });
        } else {
          console.log('DB sync disabled. Using migrations only.');
        }
      } catch (syncError) {
        if (config.dbSyncStrategy === 'alter' && !config.isProduction) {
          console.warn('DB alter failed, falling back to safe sync:', syncError.message);
          await User.sync();
          await Activity.sync();
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

  return { sequelize: sq, User, Activity };
};

export const getModels = () => ({
  User: g.__db_User,
  Activity: g.__db_Activity,
  sequelize: g.__db_sequelize,
});
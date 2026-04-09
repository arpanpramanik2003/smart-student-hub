import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDB } from '../lib/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const run = async () => {
  const { sequelize } = await initDB();
  console.log('Migration check complete. Pending migrations (if any) were applied.');
  await sequelize.close();
};

run().catch((error) => {
  console.error('Migration run failed:', error);
  process.exit(1);
});

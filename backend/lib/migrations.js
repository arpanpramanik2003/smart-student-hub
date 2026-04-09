import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';

const migrationDir = path.join(process.cwd(), 'migrations');
const migrationTableName = 'SequelizeMeta';

const normalizeTableName = (table) => {
  if (typeof table === 'string') {
    return table;
  }

  if (table?.tableName) {
    return table.tableName;
  }

  return String(table);
};

const ensureMetaTable = async (queryInterface, Sequelize) => {
  const tables = await queryInterface.showAllTables();
  const tableNames = new Set(tables.map(normalizeTableName));

  if (tableNames.has(migrationTableName)) {
    return;
  }

  await queryInterface.createTable(migrationTableName, {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true,
    },
  });
};

const listMigrationFiles = async () => {
  try {
    const entries = await fs.readdir(migrationDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
};

const loadMigrationModule = async (fileName) => {
  const absolutePath = path.join(migrationDir, fileName);
  return import(pathToFileURL(absolutePath).href);
};

export const runMigrations = async (sequelize) => {
  const { queryInterface, Sequelize } = sequelize;

  await ensureMetaTable(queryInterface, Sequelize);

  const appliedRows = await queryInterface.sequelize.query(
    `SELECT name FROM ${migrationTableName}`,
    { type: Sequelize.QueryTypes.SELECT }
  );
  const applied = new Set(appliedRows.map((row) => row.name));

  const files = await listMigrationFiles();
  for (const fileName of files) {
    const migration = await loadMigrationModule(fileName);
    const migrationId = migration.id || fileName;

    if (applied.has(migrationId)) {
      continue;
    }

    if (typeof migration.up !== 'function') {
      throw new Error(`Migration ${fileName} is missing an up() function.`);
    }

    await migration.up({ queryInterface, Sequelize, dialect: sequelize.getDialect() });
    await queryInterface.bulkInsert(migrationTableName, [{ name: migrationId }]);
    console.log(`Applied migration: ${migrationId}`);
  }
};

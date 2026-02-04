const dockerCompose = require('docker-compose');
const { DataSource } = require('typeorm');
const path = require('path');

module.exports = async () => {
  console.log('🟢 Starting Docker containers...');
  await dockerCompose.upAll({ commandOptions: ['--remove-orphans'] });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('⏳ Initializing database schema...');

  // Create a temporary DataSource just to run migrations
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: '127.0.0.1',
    port: 5433,
    username: 'postgres',
    password: 'postgres',
    database: '3d-extractable-management_test',
    entities: [path.join(__dirname, '../src/DAL/entities/**/*.entity.ts')],
    migrations: [path.join(__dirname, '../src/DAL/migrations/**/*.ts')],
    synchronize: false,
    logging: false,
    ssl: false,
  });

  try {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    console.log('✅ Migrations completed');
  } catch (err) {
    console.warn('⚠️  Migration initialization warning:', err instanceof Error ? err.message : String(err));
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
  console.log('🚀 Environment ready for tests');
};

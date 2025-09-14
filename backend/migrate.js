require('dotenv').config();

// Use Railway public network connection
process.env.NODE_ENV = 'production';
process.env.DB_HOST = 'yamanote.proxy.rlwy.net';
process.env.DB_NAME = 'railway';
process.env.DB_USER = 'root';
process.env.DB_PASS = 'eZXStDOCTbOpfuqRpEqAHfraEbKWIaXp';
process.env.DB_PORT = '48485';
process.env.DB_DIALECT = 'mysql';

const { sequelize } = require('./src/models');

async function runMigrations() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    console.log('Running database sync...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables created/updated successfully.');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
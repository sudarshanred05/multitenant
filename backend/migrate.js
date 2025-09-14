require('dotenv').config();
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
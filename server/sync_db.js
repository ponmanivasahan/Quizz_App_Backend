require('dotenv').config({ path: __dirname + '/.env' });
const { sequelize } = require('./models');

async function sync() {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced with alter: true');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing:', error);
    process.exit(1);
  }
}
sync();

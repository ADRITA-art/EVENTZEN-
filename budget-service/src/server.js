const app = require('./app');
const sequelize = require('./config/database');

const PORT = Number(process.env.PORT || 8081);
const RETRY_COUNT = Number(process.env.DB_RETRY_COUNT || 10);
const RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 3000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectAndSyncDb = async () => {
  let lastError;

  for (let attempt = 1; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      return;
    } catch (error) {
      lastError = error;
      console.error(`Database connection attempt ${attempt}/${RETRY_COUNT} failed`);
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError;
};

const startServer = async () => {
  try {
    await connectAndSyncDb();
    app.listen(PORT, () => {
      console.log(`Budget service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  }
};

startServer();

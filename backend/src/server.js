require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');


const { sequelize } = require('./models');


const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');
const syncRoutes = require('./routes/sync');


const errorHandler = require('./middleware/errorHandler');


const SchedulerService = require('./jobs/scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

const scheduler = new SchedulerService();


app.use(helmet());
app.use(compression());


app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));


const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}


app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Shopify Insights Service is running',
    timestamp: new Date().toISOString(),
    version: '1.0.1',
    database: 'connected'
  });
});


app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sync', syncRoutes);




app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});


app.use(errorHandler);

async function startServer() {
  try {

    await sequelize.authenticate();
    console.log('Database connection established successfully.');


    // Force sync in production to create tables in Railway database
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully.');
    
    console.log('✅ Tables created in Railway database schema: railway');


    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API URL: http://localhost:${PORT}/api`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });


    if (process.env.NODE_ENV !== 'test') {
      scheduler.startScheduler();
    }


    process.on('SIGTERM', async () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      scheduler.stopScheduler();
      server.close(() => {
        console.log('Server closed.');
        sequelize.close().then(() => {
          console.log('Database connection closed.');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received. Shutting down gracefully...');
      scheduler.stopScheduler();
      server.close(() => {
        console.log('Server closed.');
        sequelize.close().then(() => {
          console.log('Database connection closed.');
          process.exit(0);
        });
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;

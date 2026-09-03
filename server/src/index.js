require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Test Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'College ERP API is running' });
});

// Import Routes
const userRoutes = require('./routes/user.routes');
// app.use('/api/auth', authRoutes); // Auth routes are mostly handled by Firebase Auth on the frontend, but we expose /me via user routes
app.use('/api/users', userRoutes);
app.use('/api/auth', userRoutes); // For the /me route to get role

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

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

// Firebase Connection Test Route
const { db } = require('./config/firebaseAdmin');
app.get('/api/firebase-test', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ status: 'error', message: 'Firestore is not initialized.' });
    }
    // Write test
    const testDoc = db.collection('system_tests').doc('connection_test');
    await testDoc.set({
      message: 'Connection successful',
      timestamp: new Date()
    });
    
    // Read test
    const docSnapshot = await testDoc.get();
    
    res.status(200).json({
      status: 'success',
      message: 'Successfully communicated with Firestore!',
      data: docSnapshot.data()
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    res.status(500).json({ status: 'error', message: 'Firebase connection failed', error: error.message });
  }
});

// Import Routes
const userRoutes = require('./routes/user.routes');
const apiRoutes = require('./routes/api.routes');

app.use('/api/users', userRoutes);
app.use('/api/auth', userRoutes); // For the /me route to get role
app.use('/api', apiRoutes); // Mount all dynamic CRUD routes (students, faculty, etc.)

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

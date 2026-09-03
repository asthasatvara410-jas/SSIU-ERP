require('dotenv').config();
const admin = require('firebase-admin');

// Ensure that we only initialize the app once
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace escaped newlines if passed in via env variables
      privateKey: process.env.FIREBASE_PRIVATE_KEY 
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
    };

    // If we have minimal credentials, initialize with them
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      console.warn('Firebase credentials not fully provided. Firestore connections will fail.');
    }
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error.message);
  }
}

const db = admin.apps.length ? admin.firestore() : null;

module.exports = { admin, db };

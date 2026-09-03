const admin = require("firebase-admin");
const path = require("path");

let serviceAccount;
try {
  // Assuming the user places serviceAccountKey.json in the server folder
  serviceAccount = require("../../serviceAccountKey.json");
} catch (error) {
  console.error("Error: serviceAccountKey.json not found! Please place it in the server/ directory.");
}

try {
  if (serviceAccount && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully using serviceAccountKey.json");
  } else if (!serviceAccount) {
    console.warn("Firebase Admin SDK NOT initialized: Missing serviceAccountKey.json");
  }
} catch (error) {
  console.error("Firebase Admin SDK initialization error:", error.message);
}

const db = admin.apps.length ? admin.firestore() : null;

module.exports = {
  admin,
  db
};

const { db, admin } = require('../config/firebase');

// Fetch current user's role from Firestore
exports.getCurrentUserRole = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ status: 'error', message: 'User not found in database' });
    }
    
    return res.status(200).json({ status: 'success', role: userDoc.data().role, user: userDoc.data() });
  } catch (error) {
    next(error);
  }
};

// Create a new user (Creates Firebase Auth user + Firestore document)
exports.createUser = async (req, res, next) => {
  try {
    const { email, password, role, name } = req.body;
    
    if (!email || !password || !role) {
      return res.status(400).json({ status: 'error', message: 'Email, password, and role are required' });
    }

    // 1. Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Save user role and data in Firestore
    const userData = {
      uid: userRecord.uid,
      email,
      name,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    return res.status(201).json({ status: 'success', data: userData });
  } catch (error) {
    next(error);
  }
};

// Get all users
exports.getUsers = async (req, res, next) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push(doc.data());
    });
    
    return res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const uid = req.params.id;
    const { role, name } = req.body;
    
    // Update in Firestore
    const updateData = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (role) updateData.role = role;
    if (name) updateData.name = name;

    await db.collection('users').doc(uid).update(updateData);
    
    // If name provided, also update Auth profile
    if (name) {
      await admin.auth().updateUser(uid, { displayName: name });
    }

    return res.status(200).json({ status: 'success', message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const uid = req.params.id;
    
    // 1. Delete from Firestore
    await db.collection('users').doc(uid).delete();
    
    // 2. Delete from Firebase Auth
    await admin.auth().deleteUser(uid);
    
    return res.status(200).json({ status: 'success', message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

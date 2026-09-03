const { db } = require('../config/firebase');

/**
 * Middleware to authorize users based on their role from the Firestore `users` collection.
 * Must be used AFTER `verifyToken` middleware.
 * 
 * @param {Array<string>} allowedRoles - Array of roles allowed to access the route.
 */
const authorizeRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized: No user found' });
      }

      // Fetch user role from Firestore
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      
      if (!userDoc.exists) {
        return res.status(403).json({ status: 'error', message: 'Forbidden: User record not found' });
      }

      const userData = userDoc.data();
      const userRole = userData.role; // e.g. 'Super Admin', 'Admin', 'HOD', 'Faculty', 'Student'

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          status: 'error', 
          message: `Forbidden: Access denied for role ${userRole}` 
        });
      }

      // Attach role to request for downstream use if needed
      req.user.role = userRole;
      next();
    } catch (error) {
      console.error('Role Middleware Error:', error.message);
      return res.status(500).json({ status: 'error', message: 'Internal Server Error during authorization' });
    }
  };
};

module.exports = { authorizeRole };

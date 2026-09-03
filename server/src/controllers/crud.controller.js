const { db, admin } = require('../config/firebaseAdmin');

/**
 * A generic CRUD controller to handle basic Firestore operations for any collection.
 * This ensures consistency, avoids code duplication, and scales to all ERP modules.
 */
class CrudController {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.collection = db.collection(collectionName);
  }

  // Create document
  create = async (req, res, next) => {
    try {
      const data = {
        ...req.body,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await this.collection.add(data);
      const doc = await docRef.get();
      
      return res.status(201).json({
        status: 'success',
        data: { id: doc.id, ...doc.data() }
      });
    } catch (error) {
      next(error);
    }
  };

  // Get all documents
  getAll = async (req, res, next) => {
    try {
      const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      
      return res.status(200).json({ status: 'success', data: items });
    } catch (error) {
      next(error);
    }
  };

  // Get single document by ID
  getById = async (req, res, next) => {
    try {
      const doc = await this.collection.doc(req.params.id).get();
      if (!doc.exists) {
        return res.status(404).json({ status: 'error', message: 'Document not found' });
      }
      
      return res.status(200).json({ status: 'success', data: { id: doc.id, ...doc.data() } });
    } catch (error) {
      next(error);
    }
  };

  // Update document
  update = async (req, res, next) => {
    try {
      const data = {
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Prevent updating the ID itself
      delete data.id;

      await this.collection.doc(req.params.id).update(data);
      
      return res.status(200).json({ status: 'success', message: 'Updated successfully' });
    } catch (error) {
      if (error.code === 5) { // NOT_FOUND in Firestore Admin
        return res.status(404).json({ status: 'error', message: 'Document not found' });
      }
      next(error);
    }
  };

  // Delete document
  delete = async (req, res, next) => {
    try {
      await this.collection.doc(req.params.id).delete();
      return res.status(200).json({ status: 'success', message: 'Deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = CrudController;

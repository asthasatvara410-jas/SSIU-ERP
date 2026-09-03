const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { authorizeRole } = require('../middlewares/role.middleware');
const CrudController = require('../controllers/crud.controller');

const router = express.Router();

// Define all collections needed for the ERP
const collections = [
  'students',
  'faculty',
  'departments',
  'courses',
  'subjects',
  'academicYears',
  'semesters',
  'attendance',
  'fees',
  'examinations',
  'results',
  'timetables',
  'notices',
  'documents'
];

// Dynamically generate CRUD routes for all entities
collections.forEach((collection) => {
  const controller = new CrudController(collection);
  
  // Create router for this specific collection
  const collectionRouter = express.Router();
  
  // Protect all CRUD routes with token verification
  collectionRouter.use(verifyToken);
  
  // Determine roles allowed to modify this collection (simplistic RBAC for now)
  // In a full production app, this would be highly granular (e.g. Faculty can only modify their own attendance)
  const adminOnly = authorizeRole(['Super Admin', 'Admin']);
  const academicStaff = authorizeRole(['Super Admin', 'Admin', 'HOD', 'Faculty']);
  
  // Everyone authenticated can GET lists/items (we can tighten this later per-module)
  collectionRouter.get('/', controller.getAll);
  collectionRouter.get('/:id', controller.getById);

  // Role-based Write Access (simplified logic for demonstration)
  if (['attendance', 'results', 'timetables', 'documents'].includes(collection)) {
    // Faculty & HOD can write academic data
    collectionRouter.post('/', academicStaff, controller.create);
    collectionRouter.put('/:id', academicStaff, controller.update);
    collectionRouter.delete('/:id', adminOnly, controller.delete); // Only admins can completely delete
  } else if (collection === 'notices') {
    // Admins and HODs can post notices
    const noticePosters = authorizeRole(['Super Admin', 'Admin', 'HOD']);
    collectionRouter.post('/', noticePosters, controller.create);
    collectionRouter.put('/:id', noticePosters, controller.update);
    collectionRouter.delete('/:id', noticePosters, controller.delete);
  } else {
    // For core management (students, faculty, departments, fees, etc.), only Admins can write
    collectionRouter.post('/', adminOnly, controller.create);
    collectionRouter.put('/:id', adminOnly, controller.update);
    collectionRouter.delete('/:id', adminOnly, controller.delete);
  }

  // Mount to main router
  router.use(`/${collection}`, collectionRouter);
});

module.exports = router;

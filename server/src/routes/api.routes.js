const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { authorizeRole } = require('../middlewares/role.middleware');
const SqlCrudController = require('../controllers/sqlCrud.controller');

const router = express.Router();

// Define all collections needed for the ERP and their singular event names
const collections = [
  { table: 'students', singular: 'student' },
  { table: 'faculty', singular: 'faculty' },
  { table: 'departments', singular: 'department' },
  { table: 'courses', singular: 'course' },
  { table: 'subjects', singular: 'subject' },
  { table: 'academicYears', singular: 'academicYear' },
  { table: 'semesters', singular: 'semester' },
  { table: 'attendance', singular: 'attendance' },
  { table: 'fees', singular: 'fee' },
  { table: 'examinations', singular: 'examination' },
  { table: 'results', singular: 'result' },
  { table: 'timetables', singular: 'timetable' },
  { table: 'notices', singular: 'notice' },
  { table: 'documents', singular: 'document' }
];

// Dynamically generate CRUD routes for all entities
collections.forEach(({ table, singular }) => {
  const controller = new SqlCrudController(table, singular);
  
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
  if (['attendance', 'results', 'timetables', 'documents'].includes(table)) {
    // Faculty & HOD can write academic data
    collectionRouter.post('/', academicStaff, controller.create);
    collectionRouter.put('/:id', academicStaff, controller.update);
    collectionRouter.delete('/:id', adminOnly, controller.delete); // Only admins can completely delete
  } else if (table === 'notices') {
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
  router.use(`/${table}`, collectionRouter);
});

module.exports = router;

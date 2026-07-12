// backend/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();

const {
  getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory
} = require('../controllers/categoryController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All category routes require login. Create/update: admin + staff. Delete: admin only.
router.get('/', requireAuth, getAllCategories);
router.get('/:id', requireAuth, getCategoryById);
router.post('/', requireAuth, requireRole('admin', 'staff'), createCategory);
router.put('/:id', requireAuth, requireRole('admin', 'staff'), updateCategory);
router.delete('/:id', requireAuth, requireRole('admin'), deleteCategory);

module.exports = router;

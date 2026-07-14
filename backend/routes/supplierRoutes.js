// backend/routes/supplierRoutes.js
const express = require('express');
const router = express.Router();

const {
  getAllSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier
} = require('../controllers/supplierController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/', requireAuth, getAllSuppliers);
router.get('/:id', requireAuth, getSupplierById);
router.post('/', requireAuth, requireRole('admin', 'staff'), createSupplier);
router.put('/:id', requireAuth, requireRole('admin', 'staff'), updateSupplier);
router.delete('/:id', requireAuth, requireRole('admin'), deleteSupplier);

module.exports = router;

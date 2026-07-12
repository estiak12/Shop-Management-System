// backend/routes/customerRoutes.js
const express = require('express');
const router = express.Router();

const {
  getAllCustomers, getCustomerById, getCustomerSalesHistory,
  createCustomer, updateCustomer, deleteCustomer
} = require('../controllers/customerController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/', requireAuth, getAllCustomers);
router.get('/:id', requireAuth, getCustomerById);
router.get('/:id/sales-history', requireAuth, getCustomerSalesHistory);
router.post('/', requireAuth, requireRole('admin', 'staff'), createCustomer);
router.put('/:id', requireAuth, requireRole('admin', 'staff'), updateCustomer);
router.delete('/:id', requireAuth, requireRole('admin'), deleteCustomer);

module.exports = router;

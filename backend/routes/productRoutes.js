// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();

const {
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct
} = require('../controllers/productController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', requireAuth, getAllProducts);
router.get('/:id', requireAuth, getProductById);

// 'image' must match the form-data field name used in Postman / frontend
router.post('/', requireAuth, requireRole('admin', 'staff'), upload.single('image'), createProduct);
router.put('/:id', requireAuth, requireRole('admin', 'staff'), upload.single('image'), updateProduct);
router.delete('/:id', requireAuth, requireRole('admin'), deleteProduct);

module.exports = router;

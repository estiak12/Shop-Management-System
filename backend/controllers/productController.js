// backend/controllers/productController.js
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const PRODUCT_SELECT_BASE = `
  SELECT
    p.product_id, p.name, p.category_id, c.name AS category_name,
    p.supplier_id, s.name AS supplier_name,
    p.cost_price, p.selling_price, p.stock_quantity, p.low_stock_threshold,
    p.image_path, p.created_at, p.updated_at
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.category_id
  LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
`;

// GET /api/products?search=&category_id=&supplier_id=&low_stock=true
async function getAllProducts(req, res) {
  const { search, category_id, supplier_id, low_stock } = req.query;

  try {
    let sql = PRODUCT_SELECT_BASE;
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`p.name LIKE ?`);
      params.push(`%${search}%`);
    }
    if (category_id) {
      conditions.push(`p.category_id = ?`);
      params.push(category_id);
    }
    if (supplier_id) {
      conditions.push(`p.supplier_id = ?`);
      params.push(supplier_id);
    }
    if (low_stock === 'true') {
      conditions.push(`p.stock_quantity <= p.low_stock_threshold`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }
    sql += ` ORDER BY p.name ASC`;

    const [rows] = await pool.query(sql, params);
    res.json({ products: rows });
  } catch (err) {
    console.error('getAllProducts error:', err);
    res.status(500).json({ error: 'Server error fetching products.' });
  }
}

// GET /api/products/:id
async function getProductById(req, res) {
  try {
    const [rows] = await pool.query(
      `${PRODUCT_SELECT_BASE} WHERE p.product_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ product: rows[0] });
  } catch (err) {
    console.error('getProductById error:', err);
    res.status(500).json({ error: 'Server error fetching product.' });
  }
}

// POST /api/products  (multipart/form-data — 'image' field optional)
async function createProduct(req, res) {
  const {
    name, category_id, supplier_id,
    cost_price, selling_price, stock_quantity, low_stock_threshold
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Product name is required.' });
  }
  if (cost_price === undefined || selling_price === undefined) {
    return res.status(400).json({ error: 'cost_price and selling_price are required.' });
  }

  // multer puts the uploaded file info on req.file
  const image_path = req.file ? `/uploads/products/${req.file.filename}` : null;

  try {
    const [result] = await pool.query(
      `INSERT INTO products
        (name, category_id, supplier_id, cost_price, selling_price, stock_quantity, low_stock_threshold, image_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        category_id || null,
        supplier_id || null,
        cost_price,
        selling_price,
        stock_quantity || 0,
        low_stock_threshold || 10,
        image_path
      ]
    );

    res.status(201).json({
      message: 'Product created.',
      product: { product_id: result.insertId, name: name.trim(), image_path }
    });
  } catch (err) {
    // Clean up uploaded file if the DB insert failed, so we don't leave orphan images
    if (req.file) fs.unlink(req.file.path, () => {});

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Invalid category_id or supplier_id.' });
    }
    console.error('createProduct error:', err);
    res.status(500).json({ error: 'Server error creating product.' });
  }
}

// PUT /api/products/:id  (multipart/form-data — 'image' field optional, replaces old image if provided)
async function updateProduct(req, res) {
  const { id } = req.params;
  const {
    name, category_id, supplier_id,
    cost_price, selling_price, low_stock_threshold
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Product name is required.' });
  }

  try {
    const [existingRows] = await pool.query(
      `SELECT image_path FROM products WHERE product_id = ?`, [id]
    );
    if (existingRows.length === 0) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Product not found.' });
    }

    const oldImagePath = existingRows[0].image_path;
    const image_path = req.file ? `/uploads/products/${req.file.filename}` : oldImagePath;

    await pool.query(
      `UPDATE products
       SET name = ?, category_id = ?, supplier_id = ?, cost_price = ?,
           selling_price = ?, low_stock_threshold = ?, image_path = ?
       WHERE product_id = ?`,
      [
        name.trim(),
        category_id || null,
        supplier_id || null,
        cost_price,
        selling_price,
        low_stock_threshold || 10,
        image_path,
        id
      ]
    );

    // If a new image replaced an old one, delete the old file from disk
    if (req.file && oldImagePath) {
      const oldFilePath = path.join(__dirname, '..', oldImagePath);
      fs.unlink(oldFilePath, () => {}); // ignore errors (e.g. file already missing)
    }

    res.json({ message: 'Product updated.' });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Invalid category_id or supplier_id.' });
    }
    console.error('updateProduct error:', err);
    res.status(500).json({ error: 'Server error updating product.' });
  }
}

// DELETE /api/products/:id
// Note: stock_quantity is NOT edited here directly — that only happens via
// Purchase (Phase 4) and Sale (Phase 5) transactions, to keep stock_history accurate.
async function deleteProduct(req, res) {
  try {
    const [existingRows] = await pool.query(
      `SELECT image_path FROM products WHERE product_id = ?`, [req.params.id]
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    await pool.query(`DELETE FROM products WHERE product_id = ?`, [req.params.id]);

    const imagePath = existingRows[0].image_path;
    if (imagePath) {
      fs.unlink(path.join(__dirname, '..', imagePath), () => {});
    }

    res.json({ message: 'Product deleted.' });
  } catch (err) {
    // fk_purchase_item_product / fk_sale_item_product are ON DELETE RESTRICT —
    // a product that appears in any purchase or sale history can't be deleted.
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({
        error: 'Cannot delete this product — it has purchase or sale history on record.'
      });
    }
    console.error('deleteProduct error:', err);
    res.status(500).json({ error: 'Server error deleting product.' });
  }
}

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };

// backend/controllers/categoryController.js
const { pool } = require('../config/db');

// GET /api/categories?search=xyz
async function getAllCategories(req, res) {
  const { search } = req.query;

  try {
    let sql = `SELECT category_id, name, description, created_at FROM categories`;
    const params = [];

    if (search) {
      sql += ` WHERE name LIKE ?`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY name ASC`;

    const [rows] = await pool.query(sql, params);
    res.json({ categories: rows });
  } catch (err) {
    console.error('getAllCategories error:', err);
    res.status(500).json({ error: 'Server error fetching categories.' });
  }
}

// GET /api/categories/:id
async function getCategoryById(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT category_id, name, description, created_at FROM categories WHERE category_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    res.json({ category: rows[0] });
  } catch (err) {
    console.error('getCategoryById error:', err);
    res.status(500).json({ error: 'Server error fetching category.' });
  }
}

// POST /api/categories
async function createCategory(req, res) {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO categories (name, description) VALUES (?, ?)`,
      [name.trim(), description || null]
    );
    res.status(201).json({
      message: 'Category created.',
      category: { category_id: result.insertId, name: name.trim(), description: description || null }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }
    console.error('createCategory error:', err);
    res.status(500).json({ error: 'Server error creating category.' });
  }
}

// PUT /api/categories/:id
async function updateCategory(req, res) {
  const { name, description } = req.body;
  const { id } = req.params;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE categories SET name = ?, description = ? WHERE category_id = ?`,
      [name.trim(), description || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    res.json({ message: 'Category updated.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }
    console.error('updateCategory error:', err);
    res.status(500).json({ error: 'Server error updating category.' });
  }
}

// DELETE /api/categories/:id
async function deleteCategory(req, res) {
  try {
    // Products referencing this category will have category_id set to NULL
    // automatically (ON DELETE SET NULL in schema.sql) — deletion is always safe.
    const [result] = await pool.query(
      `DELETE FROM categories WHERE category_id = ?`,
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    console.error('deleteCategory error:', err);
    res.status(500).json({ error: 'Server error deleting category.' });
  }
}

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory };

// backend/controllers/supplierController.js
const { pool } = require('../config/db');

// GET /api/suppliers?search=xyz
async function getAllSuppliers(req, res) {
  const { search } = req.query;

  try {
    let sql = `SELECT supplier_id, name, phone, email, address, created_at FROM suppliers`;
    const params = [];

    if (search) {
      sql += ` WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY name ASC`;

    const [rows] = await pool.query(sql, params);
    res.json({ suppliers: rows });
  } catch (err) {
    console.error('getAllSuppliers error:', err);
    res.status(500).json({ error: 'Server error fetching suppliers.' });
  }
}

// GET /api/suppliers/:id
async function getSupplierById(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT supplier_id, name, phone, email, address, created_at FROM suppliers WHERE supplier_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }
    res.json({ supplier: rows[0] });
  } catch (err) {
    console.error('getSupplierById error:', err);
    res.status(500).json({ error: 'Server error fetching supplier.' });
  }
}

// POST /api/suppliers
async function createSupplier(req, res) {
  const { name, phone, email, address } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Supplier name is required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO suppliers (name, phone, email, address) VALUES (?, ?, ?, ?)`,
      [name.trim(), phone || null, email || null, address || null]
    );
    res.status(201).json({
      message: 'Supplier created.',
      supplier: { supplier_id: result.insertId, name: name.trim(), phone, email, address }
    });
  } catch (err) {
    console.error('createSupplier error:', err);
    res.status(500).json({ error: 'Server error creating supplier.' });
  }
}

// PUT /api/suppliers/:id
async function updateSupplier(req, res) {
  const { name, phone, email, address } = req.body;
  const { id } = req.params;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Supplier name is required.' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE suppliers SET name = ?, phone = ?, email = ?, address = ? WHERE supplier_id = ?`,
      [name.trim(), phone || null, email || null, address || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }
    res.json({ message: 'Supplier updated.' });
  } catch (err) {
    console.error('updateSupplier error:', err);
    res.status(500).json({ error: 'Server error updating supplier.' });
  }
}

// DELETE /api/suppliers/:id
async function deleteSupplier(req, res) {
  try {
    const [result] = await pool.query(`DELETE FROM suppliers WHERE supplier_id = ?`, [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }
    res.json({ message: 'Supplier deleted.' });
  } catch (err) {
    // fk_purchase_supplier is ON DELETE RESTRICT — supplier with purchase history can't be deleted
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({
        error: 'Cannot delete this supplier — they have purchase history on record.'
      });
    }
    console.error('deleteSupplier error:', err);
    res.status(500).json({ error: 'Server error deleting supplier.' });
  }
}

module.exports = { getAllSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier };

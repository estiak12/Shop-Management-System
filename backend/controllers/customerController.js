// backend/controllers/customerController.js
const { pool } = require('../config/db');

// GET /api/customers?search=xyz
async function getAllCustomers(req, res) {
  const { search } = req.query;

  try {
    let sql = `SELECT customer_id, name, phone, email, address, created_at FROM customers`;
    const params = [];

    if (search) {
      sql += ` WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY name ASC`;

    const [rows] = await pool.query(sql, params);
    res.json({ customers: rows });
  } catch (err) {
    console.error('getAllCustomers error:', err);
    res.status(500).json({ error: 'Server error fetching customers.' });
  }
}

// GET /api/customers/:id
async function getCustomerById(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT customer_id, name, phone, email, address, created_at FROM customers WHERE customer_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    res.json({ customer: rows[0] });
  } catch (err) {
    console.error('getCustomerById error:', err);
    res.status(500).json({ error: 'Server error fetching customer.' });
  }
}

// GET /api/customers/:id/purchase-history — bonus: sales history for one customer (used later, harmless now)
async function getCustomerSalesHistory(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT s.sale_id, s.total_amount, s.sale_date
       FROM sales s
       WHERE s.customer_id = ?
       ORDER BY s.sale_date DESC`,
      [req.params.id]
    );
    res.json({ sales: rows });
  } catch (err) {
    console.error('getCustomerSalesHistory error:', err);
    res.status(500).json({ error: 'Server error fetching customer sales history.' });
  }
}

// POST /api/customers
async function createCustomer(req, res) {
  const { name, phone, email, address } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Customer name is required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)`,
      [name.trim(), phone || null, email || null, address || null]
    );
    res.status(201).json({
      message: 'Customer created.',
      customer: { customer_id: result.insertId, name: name.trim(), phone, email, address }
    });
  } catch (err) {
    console.error('createCustomer error:', err);
    res.status(500).json({ error: 'Server error creating customer.' });
  }
}

// PUT /api/customers/:id
async function updateCustomer(req, res) {
  const { name, phone, email, address } = req.body;
  const { id } = req.params;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Customer name is required.' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE customer_id = ?`,
      [name.trim(), phone || null, email || null, address || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    res.json({ message: 'Customer updated.' });
  } catch (err) {
    console.error('updateCustomer error:', err);
    res.status(500).json({ error: 'Server error updating customer.' });
  }
}

// DELETE /api/customers/:id
async function deleteCustomer(req, res) {
  try {
    const [result] = await pool.query(`DELETE FROM customers WHERE customer_id = ?`, [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    res.json({ message: 'Customer deleted.' });
  } catch (err) {
    console.error('deleteCustomer error:', err);
    res.status(500).json({ error: 'Server error deleting customer.' });
  }
}

module.exports = {
  getAllCustomers, getCustomerById, getCustomerSalesHistory,
  createCustomer, updateCustomer, deleteCustomer
};

const pool = require('../config/db');
const socketService = require('../services/socket.service');

/**
 * A generic SQL CRUD controller that implements Transactions
 * and emits Real-Time Socket.IO events on successful commits.
 */
class SqlCrudController {
  constructor(tableName, singularName) {
    this.tableName = tableName; // e.g. 'students'
    this.singularName = singularName; // e.g. 'student'
  }

  // CREATE
  create = async (req, res, next) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN'); // Start Transaction

      // Example of generic insert building. For production, strict schema mapping is needed.
      // This maps the req.body keys to column names.
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');

      const queryText = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const result = await client.query(queryText, values);
      
      const newRecord = result.rows[0];

      await client.query('COMMIT'); // Commit Transaction

      // Emit Real-Time Event globally
      socketService.broadcastCrudEvent(this.singularName, 'created', newRecord);

      return res.status(201).json({ status: 'success', data: newRecord });
    } catch (error) {
      await client.query('ROLLBACK'); // Rollback on failure
      console.error(`[${this.tableName}] Create Error:`, error);
      next(error);
    } finally {
      client.release();
    }
  };

  // READ ALL
  getAll = async (req, res, next) => {
    try {
      // Basic SELECT, no transaction needed for single read
      const queryText = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`;
      // Note: If table doesn't have created_at, this will fail. We'll use a safer fallback for now.
      const safeQueryText = `SELECT * FROM ${this.tableName}`;
      
      const result = await pool.query(safeQueryText);
      return res.status(200).json({ status: 'success', data: result.rows });
    } catch (error) {
      console.error(`[${this.tableName}] GetAll Error:`, error);
      next(error);
    }
  };

  // READ ONE
  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const queryText = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const result = await pool.query(queryText, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Record not found' });
      }

      return res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (error) {
      console.error(`[${this.tableName}] GetById Error:`, error);
      next(error);
    }
  };

  // UPDATE
  update = async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      await client.query('BEGIN'); // Start Transaction

      const keys = Object.keys(req.body);
      const values = Object.values(req.body);

      // Build "col1 = $1, col2 = $2"
      const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
      
      // Add the ID to the end of the values array
      values.push(id);
      
      const queryText = `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${values.length} RETURNING *`;
      const result = await client.query(queryText, values);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ status: 'error', message: 'Record not found' });
      }

      const updatedRecord = result.rows[0];

      await client.query('COMMIT'); // Commit Transaction

      // Emit Real-Time Event globally
      socketService.broadcastCrudEvent(this.singularName, 'updated', updatedRecord);

      return res.status(200).json({ status: 'success', data: updatedRecord });
    } catch (error) {
      await client.query('ROLLBACK'); // Rollback on failure
      console.error(`[${this.tableName}] Update Error:`, error);
      next(error);
    } finally {
      client.release();
    }
  };

  // DELETE
  delete = async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      await client.query('BEGIN'); // Start Transaction

      const queryText = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`;
      const result = await client.query(queryText, [id]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ status: 'error', message: 'Record not found' });
      }

      await client.query('COMMIT'); // Commit Transaction

      // Emit Real-Time Event globally (sending just the ID)
      socketService.broadcastCrudEvent(this.singularName, 'deleted', { id });

      return res.status(200).json({ status: 'success', message: 'Deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK'); // Rollback on failure
      console.error(`[${this.tableName}] Delete Error:`, error);
      next(error);
    } finally {
      client.release();
    }
  };
}

module.exports = SqlCrudController;

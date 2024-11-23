const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ogmr',
  password: 'postgres',
  port: 5432, // Default PostgreSQL port
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { login, senha } = req.body;

  try {
    // Query database for the user
    const result = await pool.query('SELECT * FROM usuario WHERE login = $1', [login]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid login or password' });
    }

    const user = result.rows[0];

    if (senha != user.senha) {
      return res.status(401).json({ message: 'Invalid login or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, login: user.login }, 'your_secret_key', {
      expiresIn: '1h',
    });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/verify-token', (req, res) => {
    const { token } = req.body;
  
    try {
      const decoded = jwt.verify(token, 'your_secret_key');
      res.status(200).json({ valid: true });
    } catch (error) {
      res.status(401).json({ valid: false });
    }
});

app.post('/computadores', async (req, res) => {
    const { login } = req.body; 
    try {
      const query = `SELECT * FROM computador C LEFT JOIN switch S ON S.id = C.idswitch WHERE S.login = $1`;
      const values = [login];
      const result = await pool.query(query, values);
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching computers:', err);
      res.status(500).json({ error: 'Failed to fetch computers' });
    }
  });

// Endpoint to toggle status of a specific computer
app.put('/computadores/single/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
  
    try {
      const result = await pool.query(
        'UPDATE Computador SET status = $1 WHERE porta = $2 RETURNING *',
        [status, id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Computador not found' });
      }
  
      res.status(200).json(result.rows[0]); // Return the updated computer data
    } catch (err) {
      console.error('Error updating computer status:', err);
      res.status(500).json({ error: 'Failed to update computer status' });
    }
  });
  

// Endpoint to block all active computers
app.put('/computadores/block-all', async (req, res) => {
    try {
      const result = await pool.query(
        'UPDATE Computador SET status = false WHERE status = true RETURNING *'
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'No active computers found' });
      }
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error blocking all active computers:', err);
      res.status(500).json({ error: 'Failed to block all active computers' });
    }
});

// Endpoint to unblock all blocked computers
app.put('/computadores/unblock-all', async (req, res) => {
    try {
      const result = await pool.query(
        'UPDATE Computador SET Status = true WHERE Status = false RETURNING *'
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'No blocked computers found' });
      }
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error unblocking all blocked computers:', err);
      res.status(500).json({ error: 'Failed to unblock all blocked computers' });
    }
});

app.post('/api/schedule', async (req, res) => {
    const { computadorId, startTime, endTime } = req.body;
  
    if (!computadorId || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    try {
      const result = await pool.query(
        'INSERT INTO Schedule (computador_id, start_time, end_time) VALUES ($1, $2, $3) RETURNING *',
        [computadorId, startTime, endTime]
      );
  
      res.status(201).json(result.rows[0]); // Return the newly created schedule
    } catch (err) {
      console.error('Error creating schedule:', err);
      res.status(500).json({ error: 'Failed to create schedule' });
    }
});
  
  

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

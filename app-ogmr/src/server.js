const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const schedule = require('node-schedule');

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
    const { status, idswitch } = req.body;
  
    try {
      const result = await pool.query(
        'UPDATE COMPUTADOR SET status = $1 WHERE porta = $2 AND IDSWITCH = $3 RETURNING *',
        [status, id, idswitch]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Computador not found' });
      }

      const switchip = await pool.query('SELECT IP FROM SWITCH WHERE ID = $1',[idswitch]);
      const ports = result.rows.map(row => id);
      executeScript(switchip.rows[0].ip, status, ports);
  
      res.status(200).json(result.rows[0]); // Return the updated computer data
    } catch (err) {
      console.error('Error updating computer status:', err);
      res.status(500).json({ error: 'Failed to update computer status' });
    }
  });
  

// Endpoint to block all active computers
app.put('/computadores/block-all', async (req, res) => {
    try {
      const { login } = req.body;
      const _switch = await pool.query('SELECT ID, IP FROM SWITCH WHERE LOGIN = $1',[login]);
      const result = await pool.query(
        'UPDATE Computador SET status = false WHERE status = true AND idswitch = $1 RETURNING *',
        [_switch.rows[0].id]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'No active computers found' });
      }

      
      const ports = result.rows.map(row => row.porta);
      executeScript(_switch.rows[0].ip, false, ports);
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error blocking all active computers:', err);
      res.status(500).json({ error: 'Failed to block all active computers' });
    }
});

// Endpoint to unblock all blocked computers
app.put('/computadores/unblock-all', async (req, res) => {
    try {
      const { login } = req.body;
      const _switch = await pool.query('SELECT ID, IP FROM SWITCH WHERE LOGIN = $1',[login]);
      const result = await pool.query(
        'UPDATE Computador SET status = true WHERE status = false AND idswitch = $1 RETURNING *',
        [_switch.rows[0].id]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'No blocked computers found' });
      }

      const ports = result.rows.map(row => row.porta);
      executeScript(_switch.rows[0].ip, true, ports);
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error unblocking all blocked computers:', err);
      res.status(500).json({ error: 'Failed to unblock all blocked computers' });
    }
});

app.post('/agendar', async (req, res) => {
  const { login, porta, startTime, endTime } = req.body;

  if (!login || !porta || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Insert the schedule into the database
    const result = await pool.query(
      'INSERT INTO BLOQUEIO (ID, IDUSUARIO, IDSWITCH, PORTA, INICIO, FIM, EXECUTADO) VALUES ((SELECT COALESCE(MAX(ID), 0) + 1 FROM BLOQUEIO), (SELECT ID FROM USUARIO WHERE LOGIN = $2), (SELECT ID FROM SWITCH WHERE LOGIN = $2), $1, $3, $4, false) RETURNING *',
      [porta, login, startTime, endTime]
    );

    // Schedule to execute the script at start time (set status to false)
    schedule.scheduleJob(startTime, async () => {
      const _switch = await pool.query('SELECT ID, IP FROM SWITCH WHERE LOGIN = $1', [login]);
      executeScript(_switch.rows[0].ip, false, [porta]);
      const exe = await pool.query('UPDATE Computador SET status = true WHERE porta = $1 AND IDSWITCH = $2', [porta, _switch.rows[0].id]);
      console.log(`Scheduled start at: ${startTime}`);
    });

    schedule.scheduleJob(endTime, async () => {
      const _switch = await pool.query('SELECT ID, IP FROM SWITCH WHERE LOGIN = $1', [login]);
      executeScript(_switch.rows[0].ip, true, [porta]);
      const res = await pool.query('UPDATE BLOQUEIO SET EXECUTADO = TRUE WHERE ID = $1', [result.rows[0].id]);
      const exe = await pool.query('UPDATE Computador SET status = false WHERE porta = $1 AND IDSWITCH = $2 ', [porta, _switch.rows[0].id]);
      console.log(`Scheduled end at: ${endTime}`);
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating schedule:', err);
    res.status(500).json({ error: 'Failed to register schedule' });
  }
});

const executeScript = (ip, operation, ports) => {
  return new Promise((resolve, reject) => {
    const op = operation ? 1 : 2;
    const portsString = ports.join(' '); // Convert ports array to a space-separated string
    const command = `./script.sh ${ip} ${op} ${portsString}`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Script stderr: ${stderr}`);
        }
        resolve(stdout.trim()); // Resolve with the output of the script
    });
  });
};

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

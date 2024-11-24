const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const snmp = require('net-snmp');
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

      /*
      try { 
        const switchIP = await pool.query('SELECT IP FROM SWITCH S LEFT JOIN COMPUTADOR C ON C.IDSWITCH = S.ID WHERE C.ID = $1', [id]);
        const computerPort = await pool.query('SELECT porta FROM COMPUTADOR WHERE ID = $1', [id]);
        try {
          const snmpResult = await setPortStatus(switchIP.rows[0][ip], computerPort.rows[0][porta], status);
          console.log(snmpResult); // Log SNMP result for debugging
        } catch (snmpError) {
            console.error('SNMP Error:', snmpError.message);
            return res.status(500).json({ error: 'Failed to update switch port status' });
        }
      } catch (err) {
        console.error('Error fetching computers:', err);
        res.status(500).json({ error: 'Failed to fetch the switch ip or the computer port' });
      }
      */
  
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

      /*
      for (const computer of result.rows) {
        try {
            const switchIP = await pool.query('SELECT IP FROM SWITCH S LEFT JOIN COMPUTADOR C ON C.IDSWITCH = S.ID WHERE C.ID = $1', [computer.id]);

            const computerPort = await pool.query('SELECT porta FROM COMPUTADOR WHERE ID = $1', [computer.id]);

            const switchIp = switchIP.rows[0].ip;
            const portIndex = computerPort.rows[0].porta;

            await setPortStatus(switchIp, portIndex, false);
            console.log(`Blocked port ${portIndex} on switch ${switchIp}`);
        } catch (snmpError) {
            console.error(`Failed to block port for computer ID: ${computer.id}`, snmpError.message);
        }
      }
      */

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

      /*
      for (const computer of result.rows) {
        try {
            const switchIP = await pool.query( 'SELECT IP FROM SWITCH S LEFT JOIN COMPUTADOR C ON C.IDSWITCH = S.ID WHERE C.ID = $1', [computer.id]);

            const computerPort = await pool.query('SELECT porta FROM COMPUTADOR WHERE ID = $1', [computer.id]);

            const switchIp = switchIP.rows[0].ip;
            const portIndex = computerPort.rows[0].porta;

            await setPortStatus(switchIp, portIndex, true);
            console.log(`Unblocked port ${portIndex} on switch ${switchIp}`);
        } catch (snmpError) {
            console.error(`Failed to unblock port for computer ID: ${computer.id}`, snmpError.message);
        }
      }
      */
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error unblocking all blocked computers:', err);
      res.status(500).json({ error: 'Failed to unblock all blocked computers' });
    }
});

app.post('/agendar', async (req, res) => {
    const {login, porta, startTime, endTime } = req.body;
    
    if (!login || !porta || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    try {
      const result = await pool.query(
        'INSERT INTO BLOQUEIO (ID, IDUSUARIO, IDSWITCH, PORTA, INICIO, FIM) VALUES ((SELECT COALESCE(MAX(ID), 0) + 1 FROM BLOQUEIO), (SELECT ID FROM USUARIO WHERE LOGIN = $2), (SELECT ID FROM SWITCH WHERE LOGIN = $2), $1, $3, $4) RETURNING *',
        [porta, login, startTime, endTime]
      );
  
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error creating schedule:', err);
      res.status(500).json({ error: 'Failed to create schedule' });
    }
});


function setPortStatus(target, portIndex, enable, community = 'public') {
  return new Promise((resolve, reject) => {
      const session = snmp.createSession(target, community);
      const oid = `1.3.6.1.2.1.2.2.1.7.${portIndex}`; // ifAdminStatus OID with port index

      const status = enable ? 1 : 2; // 1 = Up (Enable), 2 = Down (Disable)

      const varbind = [{ oid: oid, type: snmp.ObjectType.Integer, value: status }];

      session.set(varbind, (error) => {
          session.close();
          if (error) {
              reject(error);
          } else {
              resolve(`Port ${portIndex} set to ${enable ? 'Enabled' : 'Disabled'}.`);
          }
      });
  });
}


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

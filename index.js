const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: 'https://bitcoinconvert.github.io/bitcoinconvert/' }));
app.use(express.json());

// Generate HD Address
app.post('/api/blockcypher/address', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.blockcypher.com/v1/btc/main/addrs',
      {},
      { params: { token: process.env.BLOCKCYPHER_TOKEN } }
    );
    res.json({ address: response.data.address });
  } catch (error) {
    console.error('Error generating address:', error.message);
    res.status(500).json({ error: 'Failed to generate address', details: error.message });
  }
});

// Check Balance
app.get('/api/blockcypher/balance/:address', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.blockcypher.com/v1/btc/main/addrs/${req.params.address}/balance`,
      { params: { token: process.env.BLOCKCYPHER_TOKEN } }
    );
    res.json({
      address: response.data.address,
      balance: response.data.final_balance,
      total_received: response.data.total_received,
      total_sent: response.data.total_sent
    });
  } catch (error) {
    console.error('Error fetching balance:', error.message);
    res.status(500).json({ error: 'Failed to fetch balance', details: error.message });
  }
});

// Send BTC (kept as is with placeholder)
app.post('/api/blockcypher/send', async (req, res) => {
  const { to_address, amount, private_key, from_address } = req.body;
  try {
    const newTx = {
      inputs: [{ addresses: [from_address] }],
      outputs: [{ addresses: [to_address], value: amount }]
    };
    const response = await axios.post(
      'https://api.blockcypher.com/v1/btc/main/txs/new',
      newTx,
      { params: { token: process.env.BLOCKCYPHER_TOKEN } }
    );
    const tx = response.data;
    tx.tosign.forEach((tosign, i) => {
      tx.signatures = tx.signatures || [];
      tx.pubkeys = tx.pubkeys || [];
      tx.signatures[i] = 'signature-placeholder'; // Placeholder as per user request
      tx.pubkeys[i] = 'pubkey-placeholder';
    });
    const finalResponse = await axios.post(
      'https://api.blockcypher.com/v1/btc/main/txs/send',
      tx,
      { params: { token: process.env.BLOCKCYPHER_TOKEN } }
    );
    res.json({ tx: finalResponse.data });
  } catch (error) {
    console.error('Error sending BTC:', error.message);
    res.status(500).json({ error: 'Failed to send BTC', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`API inaendesha kwenye http://0.0.0.0:${port}`);
});
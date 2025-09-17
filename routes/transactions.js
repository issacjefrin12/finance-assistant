const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction'); // Make sure this model exists

// Add transaction
router.post('/', async (req, res) => {
  try {
    const { userId, amount, category, type, date } = req.body;
    const transaction = new Transaction({ userId, amount, category, type, date });
    await transaction.save();
    res.status(201).json({ message: 'Transaction saved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save transaction', details: err.message });
  }
});

// Get all transactions
router.get('/:userId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.userId });
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions', details: err.message });
  }
});

module.exports = router;
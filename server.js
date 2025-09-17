// Load environment variables
require('dotenv').config();
console.log('🟢 server.js loaded');

// Imports
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Route imports
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

// Debug route check
if (!authRoutes || typeof authRoutes !== 'function') {
  console.error('❌ authRoutes not loaded correctly');
} else {
  console.log('✅ authRoutes loaded');
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Optional: Log incoming requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection
const mongoUri = process.env.MONGO_URI;
console.log("📌 MONGO_URI from .env:", mongoUri);

mongoose.connect(mongoUri)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

// Real Routes
app.use('/auth', authRoutes); // This must point to routes/auth.js
app.use('/transactions', transactionRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('🟢 Finance Assistant backend is running!');
});

// Fallback route for unknown endpoints
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
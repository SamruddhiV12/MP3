// ======================
// server.js
// ======================

// Load packages
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

// Initialize express
const app = express();
const router = express.Router(); // ✅ Important: shared router instance

// Use environment defined port or default 3000
const port = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
  next();
});

// ======================
// ROUTES
// ======================
require('./routes')(app, router); // ✅ Loads all routes and passes router

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Llama.io Task Management API',
    data: {
      endpoints: {
        users: '/api/users',
        tasks: '/api/tasks'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint not found',
    data: {}
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Internal server error',
    data: {}
  });
});

// Start the server
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));

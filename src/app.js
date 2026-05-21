const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { errorResponse } = require('./utils/response.util');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/seller', require('./routes/seller.routes'));

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    return errorResponse(res, statusCode, message, err.errors || null);
});

module.exports = app;

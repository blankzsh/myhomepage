// app.js - Main server file

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { router: authRouter, authenticateToken } = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Authentication routes
app.use('/api/auth', authRouter);

// Protected routes middleware
const protectRoute = (req, res, next) => {
    // Skip authentication for login page
    if (req.path === '/login' || req.path === '/login.html') {
        return next();
    }
    
    // Check for JWT in cookies or local/session storage via custom header
    const token = req.cookies?.authToken || req.headers['x-auth-token'];
    
    if (!token) {
        return res.redirect('/login');
    }
    
    next();
};

// API routes that require authentication
app.use('/api/messages', authenticateToken, require('./routes/messages'));
app.use('/api/settings', authenticateToken, require('./routes/settings'));
app.use('/api/statistics', authenticateToken, require('./routes/statistics'));

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Admin routes - protected 
app.get('/admin', protectRoute, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

app.get('/admin/messages', protectRoute, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'messages.html'));
});

app.get('/admin/settings', protectRoute, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'settings.html'));
});

// Redirect root to admin dashboard or login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('服务器错误');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


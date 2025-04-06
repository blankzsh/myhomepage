// auth.js - Authentication related routes and middleware

const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

// SQLite database setup
const dbPath = path.join(__dirname, '../database/admin.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database with tables if they don't exist
function initializeDatabase() {
    db.serialize(() => {
        // Create users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT UNIQUE,
            role TEXT DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        )`);
        
        // Check if admin user exists, if not create default admin
        db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
            if (err) {
                console.error('Error checking for admin user:', err.message);
                return;
            }
            
            if (!row) {
                // Create default admin user (password: admin123)
                const hashedPassword = bcrypt.hashSync('admin123', 10);
                db.run(
                    "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
                    ['admin', hashedPassword, 'admin@example.com', 'admin'],
                    function(err) {
                        if (err) {
                            console.error('Error creating default admin:', err.message);
                        } else {
                            console.log('Default admin user created');
                        }
                    }
                );
            }
        });
    });
}

// JWT secret key - should be stored in environment variables in production
const JWT_SECRET = 'your-secret-key-change-this-in-production';
const TOKEN_EXPIRY = '24h';

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ success: false, message: '未授权访问' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: '无效或过期的令牌' });
        }
        
        req.user = user;
        next();
    });
}

// Login route
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }
    
    // Query database for user
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            console.error('Database error during login:', err.message);
            return res.status(500).json({ success: false, message: '服务器错误' });
        }
        
        if (!user) {
            return res.status(401).json({ success: false, message: '用户名或密码错误' });
        }
        
        // Compare password
        bcrypt.compare(password, user.password, (err, match) => {
            if (err) {
                console.error('Error comparing passwords:', err.message);
                return res.status(500).json({ success: false, message: '服务器错误' });
            }
            
            if (!match) {
                return res.status(401).json({ success: false, message: '用户名或密码错误' });
            }
            
            // Update last login time
            db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
            
            // Generate JWT token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username,
                    role: user.role 
                }, 
                JWT_SECRET, 
                { expiresIn: TOKEN_EXPIRY }
            );
            
            // Return success with token
            res.json({
                success: true,
                message: '登录成功',
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        });
    });
});

// Validate token route
router.post('/validate', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// Change password route
router.post('/change-password', authenticateToken, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: '当前密码和新密码不能为空' });
    }
    
    // Get user from database
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ success: false, message: '服务器错误' });
        }
        
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        
        // Verify current password
        bcrypt.compare(currentPassword, user.password, (err, match) => {
            if (err) {
                console.error('Error comparing passwords:', err.message);
                return res.status(500).json({ success: false, message: '服务器错误' });
            }
            
            if (!match) {
                return res.status(401).json({ success: false, message: '当前密码错误' });
            }
            
            // Hash new password
            bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
                if (err) {
                    console.error('Error hashing password:', err.message);
                    return res.status(500).json({ success: false, message: '服务器错误' });
                }
                
                // Update password in database
                db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], function(err) {
                    if (err) {
                        console.error('Error updating password:', err.message);
                        return res.status(500).json({ success: false, message: '服务器错误' });
                    }
                    
                    res.json({ success: true, message: '密码已成功更新' });
                });
            });
        });
    });
});

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    db.get('SELECT id, username, email, role, created_at, last_login FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ success: false, message: '服务器错误' });
        }
        
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        
        res.json({ success: true, user });
    });
});

// Export router and middleware for use in main app
module.exports = {
    router,
    authenticateToken
};


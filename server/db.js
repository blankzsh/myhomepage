const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'messages.db');
console.log('Using database at:', dbPath); // 数据库路径日志

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }
    console.log('Successfully connected to database');
});

// 确保表存在
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT DEFAULT 'new',
            reply TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Table creation error:', err);
            process.exit(1);
        }
        console.log('Database tables verified/created');
    });
});

module.exports = db;

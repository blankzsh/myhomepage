const express = require('express');
const cors = require('cors');
const db = require('./db');
const adminRoutes = require('./routes/admin');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/admin', express.static('admin'));

// 获取消息列表
app.get('/api/messages', async (req, res) => {
    const query = `
        SELECT * FROM messages 
        ORDER BY created_at DESC
    `;
    
    db.all(query, [], (err, messages) => {
        if (err) {
            console.error('Error fetching messages:', err);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
        
        res.json({
            success: true,
            data: messages
        });
    });
});

// 添加新消息
app.post('/api/messages', async (req, res) => {
    const { name, email, content } = req.body;
    
    const query = `
        INSERT INTO messages (name, email, content) 
        VALUES (?, ?, ?)
    `;
    
    db.run(query, [name, email, content], function(err) {
        if (err) {
            console.error('Error adding message:', err);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
        
        res.json({
            success: true,
            data: {
                id: this.lastID,
                name,
                email,
                content,
                status: 'new',
                created_at: new Date().toISOString()
            }
        });
    });
});

// 删除消息
app.delete('/api/messages/:id', async (req, res) => {
    const messageId = req.params.id;
    
    const query = 'DELETE FROM messages WHERE id = ?';
    
    db.run(query, [messageId], function(err) {
        if (err) {
            console.error('Error deleting message:', err);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Message deleted successfully'
        });
    });
});

// 更新消息状态
app.patch('/api/messages/:id/status', async (req, res) => {
    const messageId = req.params.id;
    const { status } = req.body;
    
    const validStatuses = ['new', 'read', 'replied'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status value'
        });
    }
    
    const query = `
        UPDATE messages 
        SET status = ?, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    `;
    
    db.run(query, [status, messageId], function(err) {
        if (err) {
            console.error('Error updating message status:', err);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Status updated successfully'
        });
    });
});

// 回复消息
app.post('/api/messages/:id/reply', async (req, res) => {
    const messageId = req.params.id;
    const { reply } = req.body;
    
    const query = `
        UPDATE messages 
        SET reply = ?,
            status = 'replied',
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    `;
    
    db.run(query, [reply, messageId], function(err) {
        if (err) {
            console.error('Error adding reply:', err);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Reply added successfully'
        });
    });
});
//管理员路由
app.use('/admin', adminRoutes);

// 获取统计信息
app.get('/api/statistics', (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
            SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied_count
        FROM messages
    `;
    
    db.get(query, [], (err, stats) => {
        if (err) {
            console.error('Error fetching statistics:', err);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
        
        const responseRate = stats.total > 0 
            ? (stats.replied_count / stats.total * 100).toFixed(1) 
            : 0;
        
        res.json({
            success: true,
            data: {
                total: stats.total,
                new: stats.new_count,
                responseRate: responseRate
            }
        });
    });
});
// 添加消息接口的详细错误处理
app.post('/api/messages', async (req, res) => {
    const { name, email, content } = req.body;

    // 添加请求数据验证
    if (!name || !email || !content) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    console.log('Received message:', { name, email, content }); // 调试日志

    const query = `
        INSERT INTO messages (name, email, content) 
        VALUES (?, ?, ?)
    `;
    
    db.run(query, [name, email, content], function(err) {
        if (err) {
            console.error('Database error:', err); // 详细错误日志
            return res.status(500).json({
                success: false,
                message: err.message || 'Internal server error'
            });
        }
        
        res.json({
            success: true,
            data: {
                id: this.lastID,
                name,
                email,
                content,
                status: 'new',
                created_at: new Date().toISOString()
            }
        });
    });
});
app.post('/api/messages', async (req, res) => {
    console.log('Received request body:', req.body); // 调试日志

    const { name, email, content } = req.body;

    // 验证必填字段
    if (!name || !email || !content) {
        console.log('Missing required fields:', { name, email, content }); // 调试日志
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format'
        });
    }

    try {
        const query = `
            INSERT INTO messages (name, email, content) 
            VALUES (?, ?, ?)
        `;
        
        db.run(query, [name, email, content], function(err) {
            if (err) {
                console.error('Database error:', err); // 详细错误日志
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }
            
            console.log('Message saved successfully:', this.lastID); // 成功日志
            
            res.json({
                success: true,
                data: {
                    id: this.lastID,
                    name,
                    email,
                    content,
                    status: 'new',
                    created_at: new Date().toISOString()
                }
            });
        });
    } catch (error) {
        console.error('Server error:', error); // 详细错误日志
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});

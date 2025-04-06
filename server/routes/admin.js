const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/dashboard-data', async (req, res) => {
    try {
        // 获取消息总数
        const totalMessages = await db.get(`
            SELECT COUNT(*) as total FROM messages
        `);
        
        // 获取响应率
        const responseRate = await db.get(`
            SELECT 
                ROUND(COUNT(CASE WHEN status = 'replied' THEN 1 END) * 100.0 / COUNT(*), 1) as rate
            FROM messages
        `);
        
        // 获取平均响应时间
        const avgResponseTime = await db.get(`
            SELECT AVG(
                ROUND((strftime('%s', updated_at) - strftime('%s', created_at)) / 3600.0, 1)
            ) as avg_hours
            FROM messages
            WHERE status = 'replied'
        `);
        
        // 获取消息趋势数据
        const messagesTrend = await db.all(`
            SELECT 
                strftime('%Y-%m', created_at) as month,
                COUNT(*) as count
            FROM messages
            GROUP BY month
            ORDER BY month DESC
            LIMIT 6
        `);
        
        // 获取消息类别分布
        const categoriesDistribution = await db.all(`
            SELECT category, COUNT(*) as count
            FROM messages
            GROUP BY category
        `);
        
        res.json({
            totalMessages: totalMessages.total,
            responseRate: responseRate.rate,
            avgResponseTime: avgResponseTime.avg_hours,
            messagesTrend: messagesTrend.map(m => m.count),
            categoriesDistribution: categoriesDistribution.map(c => c.count)
        });
        
    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

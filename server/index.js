const express = require('express');
const Redis = require('ioredis');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Redis 连接配置
const redis = new Redis({
    host: 'localhost',
    port: 6379,
    password: '', // 如果设置了密码，在这里填写
});

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 生成唯一ID
function generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 接收消息的API端点
app.post('/api/messages', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // 验证必填字段
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        // 创建消息对象
        const messageData = {
            id: generateMessageId(),
            name,
            email,
            subject,
            message,
            timestamp: Date.now()
        };

        // 将消息存储到Redis
        // 使用 messageData.id 作为key，消息数据作为value
        await redis.set(
            messageData.id, 
            JSON.stringify(messageData)
        );

        // 将消息ID添加到消息列表中
        await redis.rpush('messages_list', messageData.id);

        // 设置成功响应
        res.status(201).json({
            success: true,
            message: 'Message received successfully',
            data: messageData
        });

    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// 获取所有消息的API端点
app.get('/api/messages', async (req, res) => {
    try {
        // 获取所有消息ID
        const messageIds = await redis.lrange('messages_list', 0, -1);
        
        // 获取所有消息详情
        const messages = await Promise.all(
            messageIds.map(async (id) => {
                const messageData = await redis.get(id);
                return JSON.parse(messageData);
            })
        );

        res.json({
            success: true,
            data: messages
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// 设置消息过期时间（例如30天）
const EXPIRE_TIME = 60 * 60 * 24 * 30; // 30 days in seconds

await redis.set(
    messageData.id, 
    JSON.stringify(messageData),
    'EX',
    EXPIRE_TIME
);


// 启动服务器
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

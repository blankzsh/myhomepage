// 设置 Chart.js 默认配置
Chart.defaults.color = '#fff';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

// 消息趋势图
const messagesCtx = document.getElementById('messagesChart').getContext('2d');
new Chart(messagesCtx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Messages',
            data: [65, 59, 80, 81, 56, 85],
            fill: true,
            backgroundColor: 'rgba(74, 144, 226, 0.2)',
            borderColor: 'rgba(74, 144, 226, 1)',
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    }
});

// 消息类别分布图
const categoriesCtx = document.getElementById('categoriesChart').getContext('2d');
new Chart(categoriesCtx, {
    type: 'doughnut',
    data: {
        labels: ['General', 'Support', 'Feedback', 'Other'],
        datasets: [{
            data: [35, 25, 22, 18],
            backgroundColor: [
                'rgba(74, 144, 226, 0.8)',
                'rgba(40, 167, 69, 0.8)',
                'rgba(255, 193, 7, 0.8)',
                'rgba(108, 117, 125, 0.8)'
            ]
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    }
});

// 实时数据更新
async function fetchDashboardData() {
    try {
        const response = await fetch('/api/admin/dashboard-data');
        const data = await response.json();
        
        // 更新统计卡片
        updateStatCards(data);
        
        // 更新图表
        updateCharts(data);
        
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}

function updateStatCards(data) {
    // 更新统计卡片的值和变化百分比
    document.querySelector('.stat-card:nth-child(1) .stat-value')
        .textContent = data.totalMessages.toLocaleString();
    // ... 更新其他统计卡片
}

function updateCharts(data) {
    // 更新图表数据
    messagesChart.data.datasets[0].data = data.messagesTrend;
    messagesChart.update();
    
    categoriesChart.data.datasets[0].data = data.categoriesDistribution;
    categoriesChart.update();
}

// 每5分钟更新一次数据
setInterval(fetchDashboardData, 5 * 60 * 1000);

// 初始加载
fetchDashboardData();

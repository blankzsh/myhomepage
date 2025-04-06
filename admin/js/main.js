const { createApp, ref, computed } = Vue

createApp({
    setup() {
        const currentView = ref('dashboard')
        const messages = ref([])
        const searchQuery = ref('')
        const statusFilter = ref('all')
        const selectedMessage = ref(null)
        const replyMessage = ref('')
        const settings = ref({
            emailNotifications: true,
            autoResponder: false
        })

        // Stats for dashboard
        const totalMessages = computed(() => messages.value.length)
        const newMessages = computed(() => 
            messages.value.filter(m => m.status === 'new').length
        )
        const responseRate = computed(() => {
            const replied = messages.value.filter(m => m.status === 'replied').length
            return totalMessages.value ? 
                Math.round((replied / totalMessages.value) * 100) : 0
        })

        // Filtered messages based on search and status
        const filteredMessages = computed(() => {
            return messages.value.filter(message => {
                const matchesSearch = 
                    message.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                    message.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                    message.subject.toLowerCase().includes(searchQuery.value.toLowerCase())
                
                const matchesStatus = 
                    statusFilter.value === 'all' || message.status === statusFilter.value

                return matchesSearch && matchesStatus
            })
        })

        // Fetch messages from API
        const fetchMessages = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/messages')
                const data = await response.json()
                if (data.success) {
                    messages.value = data.data.map(msg => ({
                        ...msg,
                        status: msg.status || 'new' // Add status if not present
                    }))
                }
            } catch (error) {
                console.error('Error fetching messages:', error)
                alert('Failed to load messages')
            }
        }

        // Delete message
        const deleteMessage = async (id) => {
            if (!confirm('Are you sure you want to delete this message?')) {
                return
            }

            try {
                const response = await fetch(`http://localhost:3000/api/messages/${id}`, {
                    method: 'DELETE'
                })
                const data = await response.json()
                if (data.success) {
                    messages.value = messages.value.filter(m => m.id !== id)
                }
            } catch (error) {
                console.error('Error deleting message:', error)
                alert('Failed to delete message')
            }
        }

        // View message details
        const messageModal = ref(null)
        const viewMessage = (message) => {
            selectedMessage.value = message
            new bootstrap.Modal(document.getElementById('messageModal')).show()
            
            // Mark as read if new
            if (message.status === 'new') {
                updateMessageStatus(message.id, 'read')
            }
        }

        // Send reply
        const sendReply = async () => {
            if (!replyMessage.value.trim()) {
                alert('Please enter a reply message')
                return
            }

            try {
                // Here you would typically send the reply to your backend
                await updateMessageStatus(selectedMessage.value.id, 'replied')
                
                // Clear reply form and close modal
                replyMessage.value = ''
                bootstrap.Modal.getInstance(document.getElementById('messageModal')).hide()
                
                alert('Reply sent successfully')
            } catch (error) {
                console.error('Error sending reply:', error)
                alert('Failed to send reply')
            }
        }

        // Update message status
        const updateMessageStatus = async (id, status) => {
            try {
                const response = await fetch(`http://localhost:3000/api/messages/${id}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status })
                })
                
                const data = await response.json()
                if (data.success) {
                    // Update local state
                    const messageIndex = messages.value.findIndex(m => m.id === id)
                    if (messageIndex !== -1) {
                        messages.value[messageIndex].status = status
                    }
                }
            } catch (error) {
                console.error('Error updating message status:', error)
                throw error
            }
        }

        // Save settings
        const saveSettings = () => {
            // Here you would typically save settings to backend
            alert('Settings saved successfully')
        }

        // Format date helper
        const formatDate = (timestamp) => {
            return new Date(timestamp).toLocaleString()
        }

        // Get badge class based on status
        const getStatusBadgeClass = (status) => {
            switch (status) {
                case 'new': return 'bg-new'
                case 'read': return 'bg-read'
                case 'replied': return 'bg-replied'
                default: return 'bg-secondary'
            }
        }

        // Logout function
        const logout = () => {
            if (confirm('Are you sure you want to logout?')) {
                // Here you would clear auth tokens, etc.
                window.location.href = '/login.html'
            }
        }

        // Load messages on mount
        fetchMessages()

        return {
            currentView,
            messages,
            filteredMessages,
            searchQuery,
            statusFilter,
            selectedMessage,
            replyMessage,
            settings,
            totalMessages,
            newMessages,
            responseRate,
            fetchMessages,
            deleteMessage,
            viewMessage,
            sendReply,
            saveSettings,
            formatDate,
            getStatusBadgeClass,
            logout
        }
    }
}).mount('#app')


// DOM Elements
const navbar = document.querySelector('.navbar');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');
const contactForm = document.getElementById('contactForm');
const sections = document.querySelectorAll('section');

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(0, 0, 0, 0.7)';
        navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.1)';
        navbar.style.boxShadow = 'none';
    }
});

// Mobile menu toggle
menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    
    // Animate hamburger to X
    const bars = menuToggle.querySelectorAll('.bar');
    bars[0].classList.toggle('active');
    bars[1].classList.toggle('active');
    bars[2].classList.toggle('active');
    
    if (navLinks.classList.contains('active')) {
        bars[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
        bars[1].style.opacity = '0';
        bars[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
    } else {
        bars[0].style.transform = 'none';
        bars[1].style.opacity = '1';
        bars[2].style.transform = 'none';
    }
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        
        // Reset hamburger
        const bars = menuToggle.querySelectorAll('.bar');
        bars[0].style.transform = 'none';
        bars[1].style.opacity = '1';
        bars[2].style.transform = 'none';
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        
        // Skip if href is just "#"
        if (targetId === "#") return;
        
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            const navbarHeight = navbar.offsetHeight;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Project filtering
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        filterBtns.forEach(b => b.classList.remove('active'));
        
        // Add active class to clicked button
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        
        projectCards.forEach(card => {
            if (filter === 'all' || card.getAttribute('data-category') === filter) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                }, 100);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    });
});

// Contact form submission
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form values
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };
        
        try {
            // Send data to backend
            const response = await fetch('http://localhost:3000/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to send message');
            }

            // Display success message
            const formContainer = contactForm.parentElement;
            
            // Create success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <h3>Message Sent Successfully!</h3>
                <p>Thank you for your message, ${formData.name}. I will get back to you soon.</p>
                <button class="submit-btn" id="resetForm">Send Another Message</button>
            `;
            
            // Hide form and show success message
            contactForm.style.display = 'none';
            formContainer.appendChild(successMessage);
            
            // Reset form button
            document.getElementById('resetForm').addEventListener('click', () => {
                contactForm.reset();
                successMessage.remove();
                contactForm.style.display = 'block';
            });

        } catch (error) {
            console.error('Error:', error);
            alert('Failed to send message. Please try again later.');
        }
    });
}


// Scroll animations - 移除了技能条动画处理部分
function checkScroll() {
    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (sectionTop < windowHeight * 0.75) {
            section.classList.add('fade-in');
        }
    });
    
    // 已移除冲突的技能条动画代码
}

// Initial check and add scroll event
window.addEventListener('load', checkScroll);
window.addEventListener('scroll', checkScroll);

// Add animation classes to elements
document.querySelectorAll('.project-card, .glass-card').forEach((element, index) => {
    element.style.opacity = '0';
    element.style.animation = `fadeIn 0.5s ease forwards ${index * 0.1}s`;
});

// 技能进度条代码 - 使用 IntersectionObserver 替代之前的方法
document.addEventListener('DOMContentLoaded', function() {
    // 使用Map来记录已激活的进度条及其宽度值
    const progressBars = new Map();
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const progressBar = entry.target;
            const widthValue = progressBar.getAttribute('data-width');
            
            if (entry.isIntersecting) {
                // 元素在视口中，设置进度条宽度
                progressBar.style.width = widthValue + '%';
                
                // 存储此进度条的宽度值
                progressBars.set(progressBar, widthValue);
            } else {
                // 元素离开视口，但保持其最后的宽度值
                // 不做任何操作，保持现状
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px' // 可以调整这个值以提前触发观察
    });
    
    // 观察所有技能进度条
    document.querySelectorAll('.skill-progress').forEach(progress => {
        // 确保初始宽度为0
        progress.style.width = '0%';
        observer.observe(progress);
    });
});

// Navbar scroll effect with enhanced frosted glass effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});


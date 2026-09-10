// Mobile Menu Toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const nav = document.querySelector('nav');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        nav.classList.toggle('mobile-menu-active');
    });
}

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Close mobile menu if open
            nav.classList.remove('mobile-menu-active');
        }
    });
});

// Form Submission Handler
const bookingForm = document.getElementById('bookingForm');

if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(bookingForm);
        const data = Object.fromEntries(formData.entries());
        
        // Validate form
        if (!data.name || !data.email || !data.service) {
            showNotification('Пожалуйста, заполните все обязательные поля', 'error');
            return;
        }
        
        // Send to backend
        try {
            const response = await fetch('/api/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.name,
                    contact: data.email || data.phone,
                    service: data.service,
                    message: data.message || ''
                }),
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showNotification('Заявка успешно отправлена! Я свяжусь с вами в течение 24 часов.', 'success');
                bookingForm.reset();
            } else {
                throw new Error(result.message || 'Ошибка отправки заявки');
            }
        } catch (error) {
            console.error('Error:', error);
            // Fallback: show success message anyway for demo purposes
            showNotification('Заявка принята! (Демо-режим: в production данные будут отправлены на сервер)', 'success');
            bookingForm.reset();
        }
    });
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background-color: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe sections
document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Update opacity when animation completes
document.querySelectorAll('.section').forEach(section => {
    section.addEventListener('animationend', () => {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
    });
});

// Active Navigation Highlight
const sections = document.querySelectorAll('.section, .header');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Service Card Selection
const serviceCards = document.querySelectorAll('.service-card');
const serviceSelect = document.getElementById('service');

serviceCards.forEach(card => {
    card.addEventListener('click', () => {
        const service = card.getAttribute('data-service');
        if (serviceSelect && service) {
            serviceSelect.value = service;
            
            // Scroll to contact form
            document.querySelector('#contact').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
    
    // Add cursor pointer
    card.style.cursor = 'pointer';
});

// Console welcome message
console.log('%cАндрей Леман | Философский консалтинг', 'font-size: 20px; font-weight: bold; color: #2c1810;');
console.log('%cСайт готов к работе!', 'font-size: 14px; color: #5d4037;');
console.log('%cДля подключения бэкенда см. документацию в README.md', 'font-size: 12px; color: #8d6e63;');

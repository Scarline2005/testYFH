// ==================== HERO BACKGROUND CAROUSEL ====================
const heroPremium = document.querySelector('.hero-premium');
if (heroPremium) {
    const backgroundImages = [
        //'url(\'img/photos/WhatsApp Image 2026-01-31 at 2.33.54 PM (1).jpeg\')',
        //'url(\'img/photos/WhatsApp Image 2026-01-31 at 2.33.54 PM (2).jpeg\')',
        //'url(\'img/photos/WhatsApp Image 2026-01-31 at 2.33.54 PM (3).jpeg\')',
        //'url(\'img/photos/WhatsApp Image 2026-01-31 at 2.33.54 PM (4).jpeg\')',
        'url(\'img/photos/WhatsApp Image 2026-01-31 at 2.33.55 PM (1).jpeg\')'
    ];
    
    let currentImageIndex = 0;
    
    // Set initial background
    heroPremium.style.backgroundImage = backgroundImages[0];
    
    // Change background every 5 seconds
    setInterval(() => {
        currentImageIndex = (currentImageIndex + 1) % backgroundImages.length;
        heroPremium.style.backgroundImage = backgroundImages[currentImageIndex];
    }, 5000);
}

// ==================== LANGUAGE SELECTOR ====================
const translations = {
    fr: {
        'Accueil': 'Accueil',
        'Notre Mission': 'Notre Mission',
        'Programmes': 'Programmes',
        'Équipe': 'Équipe',
        'Partenaires': 'Partenaires',
        'Rejoignez-nous': 'Rejoignez-nous',
        'Actualités': 'Actualités',
        'Contact': 'Contact'
    },
    en: {
        'Accueil': 'Home',
        'Notre Mission': 'Our Mission',
        'Programmes': 'Programs',
        'Équipe': 'Team',
        'Partenaires': 'Partners',
        'Rejoignez-nous': 'Join Us',
        'Actualités': 'News',
        'Contact': 'Contact'
    },
    ht: {
        'Accueil': 'Akèy',
        'Notre Mission': 'Misyon Nou',
        'Programmes': 'Pwogram',
        'Équipe': 'Ekip',
        'Partenaires': 'Patnè',
        'Rejoignez-nous': 'Jwenn Nou',
        'Actualités': 'Nòvèl',
        'Contact': 'Kontakt'
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Language selector functionality
    const langBtns = document.querySelectorAll('.lang-btn');
    let currentLang = localStorage.getItem('language') || 'fr';
    
    // Set active language button
    langBtns.forEach(btn => {
        if (btn.dataset.lang === currentLang) {
            btn.classList.add('active');
        }
    });
    
    // Language change event
    langBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            currentLang = this.dataset.lang;
            localStorage.setItem('language', currentLang);
            
            // Update active button
            langBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update page content
            updatePageLanguage(currentLang);
        });
    });
    
    // Apply saved language on page load
    updatePageLanguage(currentLang);
});

function updatePageLanguage(lang) {
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        const text = link.textContent.trim();
        if (translations[lang][text]) {
            link.textContent = translations[lang][text];
        }
    });
}

// ==================== NAVIGATION HIGHLIGHT ====================
document.addEventListener('DOMContentLoaded', function() {
    // Highlight current page in navigation
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath.includes(href) || (currentPath.endsWith('/') && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// ==================== FORM SUBMISSION ====================
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            consent: formData.get('consent')
        };
        
        // Validate form
        if (!data.name || !data.email || !data.subject || !data.message) {
            alert('Veuillez remplir tous les champs obligatoires (*)');
            return;
        }
        
        if (!data.consent) {
            alert('Veuillez accepter les conditions de confidentialité');
            return;
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            alert('Veuillez entrer une adresse email valide');
            return;
        }
        
        // Here you would normally send the form data to a server
        console.log('Form Data:', data);
        
        // Show success message
        alert('Merci pour votre message! Nous vous répondrons dès que possible.');
        
        // Reset form
        this.reset();
    });
}

// ==================== VOLUNTEER FORM SUBMISSION ====================
const volunteerForm = document.getElementById('volunteerForm');
if (volunteerForm) {
    volunteerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            skills: formData.get('skills'),
            availability: formData.get('availability'),
            motivation: formData.get('motivation'),
            consent: formData.get('consent')
        };
        
        if (!data.name || !data.email || !data.phone || !data.skills || !data.motivation) {
            alert('Veuillez remplir tous les champs obligatoires (*)');
            return;
        }
        
        if (!data.consent) {
            alert('Veuillez accepter les conditions de confidentialité');
            return;
        }
        
        console.log('Volunteer Data:', data);
        alert('Merci pour votre intérêt! Nous vous contacterons très bientôt.');
        this.reset();
    });
}

// ==================== DONATION FORM SUBMISSION ====================
const donationForm = document.getElementById('donationForm');
if (donationForm) {
    donationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            amount: formData.get('amount'),
            message: formData.get('message'),
            anonymous: formData.get('anonymous')
        };
        
        if (!data.name || !data.email || !data.amount) {
            alert('Veuillez remplir tous les champs obligatoires (*)');
            return;
        }
        
        if (data.amount <= 0) {
            alert('Veuillez entrer un montant valide');
            return;
        }
        
        console.log('Donation Data:', data);
        alert(`Merci pour votre don de $${data.amount}! Vous transformez une vie.`);
        this.reset();
    });
}

// ==================== QUICK DONATION FUNCTION ====================
function selectDonation(amount) {
    if (amount > 0) {
        alert(`Vous allez faire un don de $${amount}`);
        document.getElementById('don_amount').value = amount;
        document.getElementById('don_amount').focus();
    } else {
        alert('Entrez un montant personnalisé ci-dessous');
        document.getElementById('don_amount').focus();
    }
}

// ==================== SCROLL TO TOP ====================
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show scroll to top button when scrolling
window.addEventListener('scroll', function() {
    const scrollButton = document.getElementById('scrollToTopBtn');
    if (scrollButton) {
        if (window.scrollY > 300) {
            scrollButton.style.display = 'block';
        } else {
            scrollButton.style.display = 'none';
        }
    }
});

// ==================== ANIMATION ON SCROLL ====================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements with animation class
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll(
        '.impact-card, .feature-card, .program-card, .news-card, .value-card, .benefit-card, .team-member-card'
    );
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// ==================== NEWSLETTER SUBSCRIPTION ====================
document.addEventListener('DOMContentLoaded', function() {
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            if (email) {
                alert(`Merci de vous être inscrit à notre newsletter avec ${email}!`);
                this.reset();
            }
        });
    });
});

// ==================== UTILITY FUNCTIONS ====================

// Format currency
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// Validate email
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// ==================== LOCAL STORAGE ====================

// Save user preferences
function savePreference(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Get user preferences
function getPreference(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

// ==================== SHARE FUNCTIONALITY ====================
function shareOnSocial(platform, url, title) {
    const shareUrl = url || window.location.href;
    const shareTitle = title || document.title;
    let socialUrl = '';
    
    switch(platform) {
        case 'facebook':
            socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
            break;
        case 'twitter':
            socialUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
            break;
        case 'linkedin':
            socialUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
            break;
        case 'whatsapp':
            socialUrl = `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`;
            break;
    }
    
    if (socialUrl) {
        window.open(socialUrl, '_blank', 'width=600,height=400');
    }
}

// ==================== LOGGER ====================
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
}

// Initialize console logging
log('Youth Foundation Haiti website loaded successfully', 'success');
log('Version: 2.0 - Haiti Edition', 'info');


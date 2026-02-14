const ready = (cb) => (document.readyState !== 'loading' ? cb() : document.addEventListener('DOMContentLoaded', cb));

ready(() => {
  const navToggle = document.querySelector('.nav__toggle');
  const navMenu = document.getElementById('nav-menu');
  const header = document.querySelector('.site-header');
  const mobileQuery = window.matchMedia('(max-width: 1024px)');
  const submenuItems = Array.from(document.querySelectorAll('.nav__item--has-submenu'));

  const closeAllSubmenus = () => {
    submenuItems.forEach((item) => {
      item.classList.remove('nav__item--open');
      const parentBtn = item.querySelector('.nav__link--parent');
      parentBtn?.setAttribute('aria-expanded', 'false');
    });
  };

  const setNavState = (isOpen) => {
    if (navMenu) {
      navMenu.classList.toggle('nav__list--open', isOpen);
    }

    if (navToggle) {
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu principal' : 'Ouvrir le menu principal');

      const icon = navToggle.querySelector('.nav__toggle-icon');
      if (icon) {
        icon.classList.toggle('ri-menu-line', !isOpen);
        icon.classList.toggle('ri-close-line', isOpen);
      }
    }

    if (!isOpen) {
      closeAllSubmenus();
    }

    document.body.classList.toggle('nav-open', isOpen && mobileQuery.matches);
  };

  // Mobile navigation toggle
  navToggle?.addEventListener('click', () => {
    const isOpen = !navMenu?.classList.contains('nav__list--open');
    setNavState(Boolean(isOpen));
  });

  // Submenu interactions
  submenuItems.forEach((item) => {
    const parentBtn = item.querySelector('.nav__link--parent');
    if (!parentBtn) return;

    parentBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('nav__item--open');
      closeAllSubmenus();

      if (!isOpen) {
        item.classList.add('nav__item--open');
        parentBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Close navigation after selecting a direct link or submenu link
  document.querySelectorAll('.nav__link:not(.nav__link--parent), .nav__sublink').forEach((link) => {
    link.addEventListener('click', () => {
      setNavState(false);
    });
  });

  // Close navigation and submenus on outside click
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Node)) return;

    const clickedInNav = navMenu?.contains(event.target);
    const clickedToggle = navToggle?.contains(event.target);

    if (!clickedInNav && !clickedToggle) {
      setNavState(false);
      closeAllSubmenus();
    }
  });

  // Close nav with Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setNavState(false);
      closeAllSubmenus();
    }
  });

  // Reset nav and submenus when crossing breakpoints
  const handleBreakpointChange = () => {
    if (!mobileQuery.matches) {
      setNavState(false);
      closeAllSubmenus();
    }
  };

  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', handleBreakpointChange);
  } else if (typeof mobileQuery.addListener === 'function') {
    mobileQuery.addListener(handleBreakpointChange);
  }

  // Sticky header state
  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };

  window.addEventListener('scroll', setHeaderState);
  setHeaderState();

  // Smooth in-page navigation
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Animate counters when visible
  const counters = document.querySelectorAll('.stat__number[data-target]');
  const animateCounter = (el) => {
    const target = Number(el.dataset.target || 0);
    const suffix = el.dataset.suffix || '';
    const duration = Number(el.dataset.duration || 1600);
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.floor(progress * target);
      el.textContent = value.toLocaleString('fr-FR') + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window && counters.length) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    counters.forEach((counter) => observer.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }

  // Show current month in French
  const monthText = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const formattedMonth = monthText.charAt(0).toUpperCase() + monthText.slice(1);
  document.querySelectorAll('[data-current-month-fr]').forEach((element) => {
    element.textContent = formattedMonth;
  });

  const currentYear = String(new Date().getFullYear());
  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = currentYear;
  });

  // Seamless partners marquee
  const partnersTrack = document.querySelector('.partners__track');
  if (partnersTrack && partnersTrack.dataset.cloned !== 'true') {
    const partnerItems = Array.from(partnersTrack.querySelectorAll('.partner'));

    partnerItems.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('role');

      const cloneImg = clone.querySelector('img');
      if (cloneImg) {
        cloneImg.alt = '';
      }

      partnersTrack.appendChild(clone);
    });

    partnersTrack.dataset.cloned = 'true';
  }

  // Hero image autoplay
  const heroImage = document.querySelector('[data-hero-image]');
  const heroSlides = [
    {
      src: '../assets/images/community-health.jpg',
      alt: 'Volontaires Youth Foundation Haiti en activite communautaire',
    },
    {
      src: '../assets/images/hero-community.jpg',
      alt: 'Communaute mobilisee autour des actions de la fondation',
    },
    {
      src: '../assets/images/program-education.jpg',
      alt: 'Distribution de soutien educatif aux enfants',
    },
  ];

  let heroSlideIndex = 0;
  let heroAutoplayTimer = null;
  const heroAutoplayDelay = 4500;

  const renderHeroSlide = () => {
    if (!heroImage || !heroSlides.length) return;
    const currentSlide = heroSlides[heroSlideIndex];
    heroImage.style.setProperty('--hero-image-url', `url('${currentSlide.src}')`);
    heroImage.setAttribute('aria-label', currentSlide.alt);
  };

  const showNextHeroSlide = () => {
    if (!heroSlides.length) return;
    heroSlideIndex = (heroSlideIndex + 1) % heroSlides.length;
    renderHeroSlide();
  };

  const stopHeroAutoplay = () => {
    if (heroAutoplayTimer) {
      clearInterval(heroAutoplayTimer);
      heroAutoplayTimer = null;
    }
  };

  const startHeroAutoplay = () => {
    if (!heroImage || heroSlides.length < 2) return;
    if (heroAutoplayTimer) return;
    heroAutoplayTimer = setInterval(showNextHeroSlide, heroAutoplayDelay);
  };

  if (heroImage && heroSlides.length) {
    renderHeroSlide();
    startHeroAutoplay();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopHeroAutoplay();
      return;
    }

    startHeroAutoplay();
  });

  // Horizontal carousel for autres_images
  const autresSlides = [
    { src: 'assets/images/autres_images/WhatsApp%20Image%202026-01-31%20at%202.33.52%20PM.jpeg', alt: 'Activite terrain Youth Foundation Haiti' },
    { src: 'assets/images/autres_images/WhatsApp%20Image%202026-01-31%20at%202.33.52%20PM%20%281%29.jpeg', alt: 'Moment de partage communautaire' },
    { src: 'assets/images/autres_images/WhatsApp%20Image%202026-01-31%20at%202.33.52%20PM%20%282%29.jpeg', alt: 'Mobilisation de volontaires' },
    { src: 'assets/images/autres_images/WhatsApp%20Image%202026-01-31%20at%202.33.53%20PM%20%281%29.jpeg', alt: 'Jeunes engages dans une activite' },
    { src: 'assets/images/autres_images/WhatsApp%20Image%202026-01-31%20at%202.33.54%20PM%20%281%29.jpeg', alt: 'Intervention communautaire Youth Foundation Haiti' },
    { src: 'assets/images/autres_images/WhatsApp%20Image%202026-01-31%20at%202.33.54%20PM%20%282%29.jpeg', alt: 'Accompagnement des enfants sur le terrain' },
    { src: 'assets/images/autres_images/WhatsApp%20Image%202026-01-31%20at%202.33.54%20PM%20%283%29.jpeg', alt: 'Action collective et entraide locale' },
    { src: 'assets/images/autres_images/WhatsApp%20Image%202026-01-31%20at%202.33.55%20PM%20%281%29.jpeg', alt: 'Equipe Youth Foundation Haiti en mission' },
  ];

  const carousels = Array.from(document.querySelectorAll('[data-media-carousel]'));
  const carouselAutoplayDelay = 4200;

  const mountCarouselSlides = (track) => {
    if (!track) return;
    track.innerHTML = autresSlides.map((slide) => (
      `<div class="media-carousel__slide"><img src="${slide.src}" alt="${slide.alt}" loading="lazy" /></div>`
    )).join('');
  };

  const initCarousel = (carousel) => {
    const track = carousel.querySelector('[data-carousel-track]');
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    if (!track || !prevBtn || !nextBtn || !autresSlides.length) return null;

    mountCarouselSlides(track);

    let index = 0;
    let touchStartX = 0;
    let touchEndX = 0;

    const render = () => {
      track.style.transform = `translateX(-${index * 100}%)`;
    };

    const goNext = () => {
      index = (index + 1) % autresSlides.length;
      render();
    };

    const goPrev = () => {
      index = (index - 1 + autresSlides.length) % autresSlides.length;
      render();
    };

    prevBtn.addEventListener('click', goPrev);
    nextBtn.addEventListener('click', goNext);

    track.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', (event) => {
      touchEndX = event.changedTouches[0].clientX;
      const delta = touchEndX - touchStartX;
      if (Math.abs(delta) < 40) return;
      if (delta < 0) goNext();
      if (delta > 0) goPrev();
    }, { passive: true });

    track.addEventListener('pointerdown', (event) => {
      touchStartX = event.clientX;
    });

    track.addEventListener('pointerup', (event) => {
      touchEndX = event.clientX;
      const delta = touchEndX - touchStartX;
      if (Math.abs(delta) < 40) return;
      if (delta < 0) goNext();
      if (delta > 0) goPrev();
    });

    render();
    setInterval(goNext, carouselAutoplayDelay);
  };

  carousels.forEach((carousel) => {
    initCarousel(carousel);
  });

  // Contact form handling
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('form-feedback');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form || !feedback) return;

    const requiredFields = ['name', 'email', 'topic', 'message'];
    let hasError = false;

    requiredFields.forEach((fieldName) => {
      const field = form.elements[fieldName];
      if (field && !String(field.value).trim()) {
        field.classList.add('has-error');
        hasError = true;
      } else {
        field?.classList.remove('has-error');
      }
    });

    if (hasError) {
      feedback.textContent = 'Veuillez remplir tous les champs obligatoires.';
      feedback.className = 'form__feedback form__feedback--error';
      return;
    }

    feedback.textContent = 'Merci. Votre message a bien ete enregistre. Notre equipe vous recontactera rapidement.';
    feedback.className = 'form__feedback form__feedback--success';
    form.reset();
  });

  closeAllSubmenus();
  setNavState(false);
});

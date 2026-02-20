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
      src: '../assets/images/autres_images/YTH/6.jpeg',
      alt: 'Photo YTH 6',
    },
    {
      src: '../assets/images/autres_images/YTH/46.jpeg',
      alt: 'Photo YTH 46',
    },
    {
      src: '../assets/images/autres_images/YTH/83.jpeg',
      alt: 'Photo YTH 83',
    },
    {
      src: '../assets/images/autres_images/YTH/94.jpeg',
      alt: 'Photo YTH 94',
    },
    {
      src: '../assets/images/autres_images/YTH/114.jpeg',
      alt: 'Photo YTH 114',
    },
    {
      src: '../assets/images/autres_images/YTH/188.jpeg',
      alt: 'Photo YTH 188',
    },
    {
      src: '../assets/images/gallery/11.jpeg',
      alt: 'Photo gallery 11',
    },
    {
      src: '../assets/images/autres_images/enfant.jpeg',
      alt: 'Photo enfant',
    },
    {
      src: '../assets/images/autres_images/enfant3.jpeg',
      alt: 'Photo enfant 3',
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

  // Volunteer hero image autoplay (nos-volontaires page)
  const volunteerHeroImage = document.querySelector('[data-volunteer-hero-image]');
  const volunteerSlides = [
    {
      src: '../assets/images/volontaires/Temoignage/239.jpeg',
      alt: 'Volontaires Youth Foundation Haiti en action communautaire',
    },
    {
      src: '../assets/images/volontaires/Temoignage/244.jpeg',
      alt: 'Equipe de volontaires Youth Foundation Haiti',
    },
    {
      src: '../assets/images/volontaires/Temoignage/250.jpeg',
      alt: 'Volontaires engages pendant une activite de terrain',
    },
    {
      src: '../assets/images/volontaires/Temoignage/258.jpeg',
      alt: 'Mobilisation des volontaires avec les jeunes',
    },
    {
      src: '../assets/images/volontaires/Temoignage/270.jpeg',
      alt: 'Volontaires en accompagnement communautaire',
    },
  ];

  let volunteerSlideIndex = 0;
  let volunteerAutoplayTimer = null;
  const volunteerAutoplayDelay = 3600;

  const renderVolunteerSlide = () => {
    if (!volunteerHeroImage || !volunteerSlides.length) return;
    const currentSlide = volunteerSlides[volunteerSlideIndex];
    volunteerHeroImage.style.setProperty('--hero-image-url', `url('${currentSlide.src}')`);
    volunteerHeroImage.setAttribute('aria-label', currentSlide.alt);
  };

  const showNextVolunteerSlide = () => {
    if (!volunteerSlides.length) return;
    volunteerSlideIndex = (volunteerSlideIndex + 1) % volunteerSlides.length;
    renderVolunteerSlide();
  };

  const stopVolunteerAutoplay = () => {
    if (volunteerAutoplayTimer) {
      clearInterval(volunteerAutoplayTimer);
      volunteerAutoplayTimer = null;
    }
  };

  const startVolunteerAutoplay = () => {
    if (!volunteerHeroImage || volunteerSlides.length < 2) return;
    if (volunteerAutoplayTimer) return;
    volunteerAutoplayTimer = setInterval(showNextVolunteerSlide, volunteerAutoplayDelay);
  };

  if (volunteerHeroImage && volunteerSlides.length) {
    renderVolunteerSlide();
    startVolunteerAutoplay();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopVolunteerAutoplay();
      return;
    }

    startVolunteerAutoplay();
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
  const submitBtn = document.getElementById('contact-submit-btn');
  const openContactFormBtn = document.querySelector('[data-open-contact-form]');
  const contactModal = document.getElementById('contact-form-modal');
  const closeContactFormBtns = Array.from(document.querySelectorAll('[data-close-contact-form]'));
  const stepPanels = form ? Array.from(form.querySelectorAll('.form-step-panel')) : [];
  const stepIndicators = form ? Array.from(form.querySelectorAll('[data-step-indicator]')) : [];
  const stepButtonsNext = form ? Array.from(form.querySelectorAll('[data-next-step]')) : [];
  const stepButtonsPrev = form ? Array.from(form.querySelectorAll('[data-prev-step]')) : [];
  let lastFocusedElement = null;

  const setActiveStep = (stepNumber) => {
    stepPanels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.stepPanel === String(stepNumber));
    });
    stepIndicators.forEach((indicator) => {
      indicator.classList.toggle('is-active', indicator.dataset.stepIndicator === String(stepNumber));
    });
  };

  const validateStep = (stepNumber) => {
    const panel = form?.querySelector(`.form-step-panel[data-step-panel="${stepNumber}"]`);
    if (!panel) return true;
    const candidates = Array.from(panel.querySelectorAll('input, select, textarea'));
    for (const field of candidates) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  };

  const openContactModal = () => {
    if (!contactModal) return;
    lastFocusedElement = document.activeElement;
    contactModal.classList.add('is-open');
    contactModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    const firstInput = form?.querySelector('input, select, textarea');
    firstInput?.focus();
  };

  const closeContactModal = () => {
    if (!contactModal) return;
    contactModal.classList.remove('is-open');
    contactModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  };

  openContactFormBtn?.addEventListener('click', openContactModal);
  closeContactFormBtns.forEach((btn) => btn.addEventListener('click', closeContactModal));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && contactModal?.classList.contains('is-open')) {
      closeContactModal();
    }
  });

  stepButtonsNext.forEach((btn) => {
    btn.addEventListener('click', () => {
      const current = Number(btn.closest('.form-step-panel')?.dataset.stepPanel || 1);
      if (!validateStep(current)) return;
      setActiveStep(btn.dataset.nextStep);
    });
  });

  stepButtonsPrev.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveStep(btn.dataset.prevStep);
    });
  });

  const getSelectedValue = (fieldName) => {
    if (!form) return '';
    const checked = form.querySelector(`input[name="${fieldName}"]:checked`);
    if (checked) return String(checked.value || '').trim();
    const select = form.querySelector(`select[name="${fieldName}"]`);
    if (select) return String(select.value || '').trim();
    const input = form.querySelector(`[name="${fieldName}"]`);
    return input ? String(input.value || '').trim() : '';
  };

  const bindOtherToggle = (select) => {
    if (!(select instanceof HTMLSelectElement)) return;
    const targetId = select.dataset.toggleOther;
    if (!targetId) return;
    const wrap = form?.querySelector(`#${targetId}`);
    const input = wrap?.querySelector('input');
    if (!wrap || !input) return;

    const refresh = () => {
      const isOther = select.value === 'Autre';
      wrap.classList.toggle('is-hidden', !isOther);
      input.toggleAttribute('required', isOther);
      if (!isOther) input.value = '';
    };

    select.addEventListener('change', refresh);
    refresh();
  };

  form?.querySelectorAll('select[data-toggle-other]').forEach((select) => bindOtherToggle(select));

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form || !feedback) return;

    // Custom conditional required fields
    const genderOther = form.querySelector('#gender_other');
    const educationOther = form.querySelector('#education_other');
    const selectedGender = getSelectedValue('gender');
    const selectedEducation = getSelectedValue('education_level');

    if (genderOther) {
      const mustFill = selectedGender === 'Autre';
      genderOther.toggleAttribute('required', Boolean(mustFill));
    }

    if (educationOther) {
      const mustFill = selectedEducation === 'Autre';
      educationOther.toggleAttribute('required', Boolean(mustFill));
    }

    const firstInvalid = form.querySelector(':invalid');
    if (firstInvalid) {
      const invalidStep = firstInvalid.closest('.form-step-panel')?.dataset.stepPanel;
      if (invalidStep) setActiveStep(invalidStep);
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      feedback.textContent = 'Veuillez remplir tous les champs obligatoires.';
      feedback.className = 'form__feedback form__feedback--error';
      feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    const formAction = form.dataset.endpoint || form.getAttribute('action') || '/api/contact';
    const isRunningFromNodeOrigin = window.location.origin.includes('localhost:3000') || window.location.origin.includes('127.0.0.1:3000');
    const endpoint = isRunningFromNodeOrigin
      ? new URL(formAction, window.location.origin).toString()
      : 'http://localhost:3000/api/contact';

    feedback.textContent = 'Envoi en cours...';
    feedback.className = 'form__feedback form__feedback--success';
    submitBtn?.setAttribute('disabled', 'true');
    if (submitBtn) submitBtn.textContent = 'Envoi...';

    const formData = new FormData(form);
    const payload = new URLSearchParams();
    formData.forEach((value, key) => {
      payload.append(key, String(value));
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: payload.toString(),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Echec de l'envoi.");
      }

      feedback.textContent = 'Merci. Votre inscription a ete envoyee.';
      feedback.className = 'form__feedback form__feedback--success';
      form.reset();
      window.alert('Formulaire envoye avec succes.');
      feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setActiveStep(1);
      closeContactModal();
    } catch (error) {
      feedback.textContent = error.message || "Echec d'envoi. Veuillez reessayer.";
      feedback.className = 'form__feedback form__feedback--error';
      feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } finally {
      submitBtn?.removeAttribute('disabled');
      if (submitBtn) submitBtn.textContent = "Envoyer l'inscription";
    }
  });

  closeAllSubmenus();
  setNavState(false);
});

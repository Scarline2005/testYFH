(function () {
  var STORAGE_KEY = 'yfh_site_lang';
  var SUPPORTED_LANGS = ['fr', 'ht', 'en'];
  var LABELS = { fr: 'FR', ht: 'HT', en: 'EN' };
  var LOCAL_TRANSLATIONS = {
    ht: {
      'Qui nous sommes': 'Kiyes nou ye',
      'Ce que nous faisons': 'Sa nou fe',
      'Recherche et rapports': 'Rechech ak rapo',
      'Recits et temps forts': 'Temwayaj ak gwo moman',
      'Temoignages': 'Temwayaj',
      'Contact': 'Kontak',
      'Faire un don': 'Fè yon don',
      "Envoyer l'inscription": 'Voye enskripsyon an',
      'Envoi...': 'Anvojman...',
      'Envoi en cours...': 'Anvojman an ap fet...',
      'Merci. Votre inscription a ete envoyee.': 'Mesi. Enskripsyon ou byen voye.',
      'Veuillez remplir tous les champs obligatoires.': 'Tanpri ranpli tout chan obligatwa yo.',
      'Soutenir nos actions': 'Sipote aksyon nou yo',
      'Toutes les photos': 'Tout foto yo',
      'Nos volontaires': 'Volonte nou yo',
      'Nos volontaires en action': 'Volonte nou yo an aksyon',
      'Galerie': 'Galri'
    },
    en: {
      'Qui nous sommes': 'Who we are',
      'Ce que nous faisons': 'What we do',
      'Recherche et rapports': 'Research and reports',
      'Recits et temps forts': 'Stories and highlights',
      'Temoignages': 'Testimonials',
      'Contact': 'Contact',
      'Faire un don': 'Donate',
      "Envoyer l'inscription": 'Submit registration',
      'Envoi...': 'Sending...',
      'Envoi en cours...': 'Sending...',
      'Merci. Votre inscription a ete envoyee.': 'Thank you. Your registration has been sent.',
      'Veuillez remplir tous les champs obligatoires.': 'Please fill in all required fields.',
      'Soutenir nos actions': 'Support our actions',
      'Toutes les photos': 'All photos',
      'Nos volontaires': 'Our volunteers',
      'Nos volontaires en action': 'Our volunteers in action',
      'Galerie': 'Gallery'
    }
  };

  function getSavedLang() {
    var saved = localStorage.getItem(STORAGE_KEY) || 'fr';
    return SUPPORTED_LANGS.indexOf(saved) >= 0 ? saved : 'fr';
  }

  function setGoogTransCookie(lang) {
    var safeLang = SUPPORTED_LANGS.indexOf(lang) >= 0 ? lang : 'fr';
    var value = safeLang === 'fr' ? '/fr/fr' : '/fr/' + safeLang;
    var expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();

    document.cookie = 'googtrans=' + value + '; expires=' + expires + '; path=/';
    if (window.location.hostname) {
      document.cookie = 'googtrans=' + value + '; expires=' + expires + '; path=/; domain=' + window.location.hostname;
    }
  }

  function ensureTranslateContainer() {
    if (document.getElementById('google_translate_element')) return;
    var el = document.createElement('div');
    el.id = 'google_translate_element';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }

  function syncSwitchers(lang) {
    var selects = document.querySelectorAll('.lang-switcher__select');
    selects.forEach(function (select) {
      if (select.value !== lang) {
        select.value = lang;
      }
    });
  }

  function captureOriginalText(node) {
    if (!node || node.nodeType !== 1) return;
    var text = (node.textContent || '').trim();
    if (!text || text.length > 140) return;
    if (!node.dataset.i18nOriginal) {
      node.dataset.i18nOriginal = text;
    }
  }

  function applyLocalTranslations(lang) {
    var map = LOCAL_TRANSLATIONS[lang] || {};
    var elements = document.querySelectorAll('a, button, label, h1, h2, h3, h4, p, span, strong, option');

    elements.forEach(function (el) {
      // Keep structure intact for elements containing icons or nested markup.
      if (el.childElementCount > 0) return;
      captureOriginalText(el);
      var original = el.dataset.i18nOriginal;
      if (!original) return;
      if (lang === 'fr') {
        el.textContent = original;
        return;
      }
      if (map[original]) {
        el.textContent = map[original];
      }
    });
  }

  function triggerGoogleTranslate(lang) {
    var target = SUPPORTED_LANGS.indexOf(lang) >= 0 ? lang : 'fr';
    var combo = document.querySelector('.goog-te-combo');
    if (!combo) return false;

    if (combo.value !== target) {
      combo.value = target;
      combo.dispatchEvent(new Event('change'));
    }
    return true;
  }

  function applyLanguage(lang) {
    var attempts = 0;
    var maxAttempts = 20;
    var timer = setInterval(function () {
      attempts += 1;
      if (triggerGoogleTranslate(lang)) {
        clearInterval(timer);
        return;
      }
      if (attempts >= maxAttempts) {
        clearInterval(timer);
        applyLocalTranslations(lang);
      }
    }, 250);
  }

  function handleLangChange(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    setGoogTransCookie(lang);
    applyLocalTranslations(lang);
    if (!triggerGoogleTranslate(lang)) {
      // Fallback when the Google widget is not ready yet.
      window.location.reload();
      return;
    }
    syncSwitchers(lang);
  }

  function buildSwitcher() {
    var wrapper = document.createElement('div');
    wrapper.className = 'lang-switcher notranslate';
    wrapper.setAttribute('aria-label', 'Choisir la langue');

    var icon = document.createElement('span');
    icon.className = 'lang-switcher__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<i class="ri-earth-line"></i>';

    var select = document.createElement('select');
    select.className = 'lang-switcher__select notranslate';
    select.setAttribute('aria-label', 'Choisir la langue');

    SUPPORTED_LANGS.forEach(function (langCode) {
      var option = document.createElement('option');
      option.value = langCode;
      option.textContent = LABELS[langCode];
      select.appendChild(option);
    });

    select.addEventListener('change', function () {
      handleLangChange(select.value);
    });

    wrapper.appendChild(icon);
    wrapper.appendChild(select);

    return wrapper;
  }

  function mountDesktopSwitcher(lang) {
    var actions = document.querySelector('.header__actions');
    if (!actions || actions.querySelector('.lang-switcher')) return;
    var switcher = buildSwitcher();
    actions.appendChild(switcher);
    syncSwitchers(lang);
  }

  function mountMobileSwitcher(lang) {
    var navList = document.getElementById('nav-menu');
    if (!navList || navList.querySelector('.nav__item--lang')) return;

    var item = document.createElement('li');
    item.className = 'nav__item nav__item--lang';

    var switcher = buildSwitcher();
    switcher.classList.add('lang-switcher--mobile');
    item.appendChild(switcher);
    navList.appendChild(item);
    syncSwitchers(lang);
  }

  function removeGoogleTopBar() {
    var selectors = [
      '.goog-te-banner-frame',
      'iframe.goog-te-banner-frame',
      '.skiptranslate iframe',
      '.goog-te-balloon-frame',
      '#goog-gt-tt',
    ];

    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (node) {
        node.style.display = 'none';
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
    });

    if (document.body) {
      document.body.style.top = '0px';
      document.body.style.position = 'static';
      document.body.classList.remove('translated-ltr', 'translated-rtl');
    }
    if (document.documentElement) {
      document.documentElement.style.marginTop = '0px';
    }
  }

  function loadGoogleTranslateScript() {
    if (document.querySelector('script[data-google-translate]')) return;
    var script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.setAttribute('data-google-translate', 'true');
    document.head.appendChild(script);
  }

  window.googleTranslateElementInit = function () {
    if (!window.google || !window.google.translate || !window.google.translate.TranslateElement) return;
    new window.google.translate.TranslateElement({
      pageLanguage: 'fr',
      includedLanguages: 'fr,ht,en',
      autoDisplay: false,
      layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
    }, 'google_translate_element');

    applyLanguage(getSavedLang());
  };

  document.addEventListener('DOMContentLoaded', function () {
    var lang = getSavedLang();
    setGoogTransCookie(lang);
    mountDesktopSwitcher(lang);
    applyLocalTranslations(lang);
    removeGoogleTopBar();
    ensureTranslateContainer();
    loadGoogleTranslateScript();
    applyLanguage(lang);

    var observer = new MutationObserver(function () {
      removeGoogleTopBar();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });
}());

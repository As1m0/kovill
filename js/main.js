/* KOVILL – site behaviour: navigation, header state, scroll reveal, enquiry form. */
(() => {
  'use strict';

  /* ---------- Header shadow on scroll ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');

  const setNavOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => setNavOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setNavOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setNavOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('is-open') && !header.contains(e.target)) setNavOpen(false);
  });
  window.matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) setNavOpen(false); });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    }, { rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Enquiry form ---------- */
  const form = document.getElementById('enquiry-form');
  if (!form) return;

  const statusEl = document.getElementById('form-status');
  const submitBtn = form.querySelector('[type="submit"]');
  const submitLabel = submitBtn.querySelector('.btn-label');
  const fields = [...form.querySelectorAll('input, select, textarea')].filter((f) => f.name !== 'website');
  const loadedAt = Date.now();

  // "Make an enquiry" / "Discuss a similar project" links pre-select the matching service.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-service]');
    if (link) {
      form.elements.service.value = link.dataset.service;
      validateField(form.elements.service, false);
    }
  });

  // UI strings per page language (<html lang>). Hungarian is the default.
  const strings = {
    hu: {
      fields: {
        name: { valueMissing: 'Kérjük, adja meg a nevét.' },
        company: { valueMissing: 'Kérjük, adja meg a cég nevét.' },
        email: {
          valueMissing: 'Kérjük, adja meg az e-mail-címét.',
          typeMismatch: 'Kérjük, érvényes e-mail-címet adjon meg, például nev@ceg.hu.',
          patternMismatch: 'Kérjük, érvényes e-mail-címet adjon meg, például nev@ceg.hu.',
        },
        phone: { patternMismatch: 'Kérjük, érvényes telefonszámot adjon meg (számjegyek, szóköz, +, - vagy zárójel).' },
        service: { valueMissing: 'Kérjük, válassza ki, melyik szolgáltatás érdekli.' },
        message: {
          valueMissing: 'Kérjük, írja le röviden a projektjét.',
          tooShort: 'Kérjük, adjon meg néhány további részletet (legalább 20 karakter).',
        },
      },
      checkField: 'Kérjük, ellenőrizze ezt a mezőt.',
      fixOne: 'Kérjük, javítsa a megjelölt mezőt.',
      fixMany: (n) => `Kérjük, javítsa a megjelölt ${n} mezőt.`,
      spam: 'Az üzenetet nem sikerült elküldeni. Kérjük, várjon egy pillanatot, majd próbálja újra.',
      notConfigured: 'Az online üzenetküldés még nincs bekapcsolva, ezért üzenetét nem küldtük el. A megadott adatok az űrlapon maradtak. Addig is kérjük, vegye fel a kapcsolatot közvetlenül a KOVILL Kft.-vel.',
      sending: 'Küldés…',
      success: 'Köszönjük! Üzenetét elküldtük, munkatársaink hamarosan felveszik Önnel a kapcsolatot.',
      failure: 'Sajnáljuk, az üzenetet nem sikerült elküldeni. Kérjük, próbálja újra később.',
    },
    en: {
      fields: {
        name: { valueMissing: 'Please enter your name.' },
        company: { valueMissing: 'Please enter your company name.' },
        email: {
          valueMissing: 'Please enter your email address.',
          typeMismatch: 'Please enter a valid email address, for example name@company.com.',
          patternMismatch: 'Please enter a valid email address, for example name@company.com.',
        },
        phone: { patternMismatch: 'Please enter a valid phone number using digits, spaces, +, - or brackets.' },
        service: { valueMissing: 'Please choose the service you are interested in.' },
        message: {
          valueMissing: 'Please tell us about your project.',
          tooShort: 'Please add a little more detail (at least 20 characters).',
        },
      },
      checkField: 'Please check this field.',
      fixOne: 'Please correct the highlighted field.',
      fixMany: (n) => `Please correct the ${n} highlighted fields.`,
      spam: 'Your enquiry could not be sent. Please wait a moment and try again.',
      notConfigured: 'Online enquiries are not connected yet, so your message has not been sent. Your details are still in the form. Please contact KOVILL directly in the meantime.',
      sending: 'Sending…',
      success: 'Thank you. Your enquiry has been sent and our team will get back to you.',
      failure: 'Sorry, your enquiry could not be sent. Please try again later.',
    },
  };
  const t = strings[document.documentElement.lang.slice(0, 2)] || strings.hu;
  const messages = t.fields;
  const idleLabel = submitLabel.textContent;

  // Returns true when valid. `show` = false only clears errors, never adds them.
  function validateField(field, show = true) {
    if (field.value.trim() === '' && field.value !== '') field.value = '';
    let message = '';
    // Native tooShort only fires after user edits; check minlength explicitly as well.
    const min = Number(field.getAttribute('minlength')) || 0;
    if (min && field.value && field.value.trim().length < min) {
      message = messages[field.name].tooShort;
    } else if (!field.validity.valid) {
      const key = ['valueMissing', 'typeMismatch', 'patternMismatch', 'tooShort', 'tooLong'].find((k) => field.validity[k]);
      message = (messages[field.name] && messages[field.name][key]) || t.checkField;
    }
    if (message && !show) return false;
    field.setAttribute('aria-invalid', String(Boolean(message)));
    document.getElementById(`${field.id}-error`).textContent = message;
    return !message;
  }

  fields.forEach((field) => {
    field.addEventListener('blur', () => { if (field.value || field.getAttribute('aria-invalid') === 'true') validateField(field); });
    field.addEventListener('input', () => { if (field.getAttribute('aria-invalid') === 'true') validateField(field); });
    field.addEventListener('change', () => { if (field.tagName === 'SELECT') validateField(field); });
  });

  const setStatus = (state, text) => {
    statusEl.dataset.state = state;
    statusEl.textContent = text;
  };

  const setBusy = (busy) => {
    submitBtn.disabled = busy;
    submitBtn.setAttribute('aria-busy', String(busy));
    submitLabel.textContent = busy ? t.sending : idleLabel;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', '');

    const invalid = fields.filter((f) => !validateField(f));
    if (invalid.length) {
      setStatus('error', invalid.length === 1 ? t.fixOne : t.fixMany(invalid.length));
      invalid[0].focus();
      return;
    }

    // ponytail: client-side spam checks only (honeypot + minimum fill time). The receiving
    // server must still validate input and add rate limiting / CAPTCHA.
    if (form.elements.website.value || Date.now() - loadedAt < 3000) {
      setStatus('error', t.spam);
      return;
    }

    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      // No backend or email service is configured yet: say so honestly instead of faking success.
      setStatus('info', t.notConfigured);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      fields.forEach((f) => f.removeAttribute('aria-invalid'));
      setStatus('success', t.success);
    } catch (err) {
      setStatus('error', t.failure);
    } finally {
      setBusy(false);
    }
  });
})();

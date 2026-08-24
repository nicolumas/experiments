/* ===========================================================================
   LUMAS nav kit — behaviour. Load after the markup (or defer).
   Three parts: the custom elements from site-header.js, the widget wiring the
   production bundle does in another chunk, and the mobile WhatsApp override.
   =========================================================================== */

/*
 * LUMAS top navigation — behaviour layer.
 *
 * A faithful, readable reimplementation of cdn.lumas.com/assets/white/header/site-header.js
 * (a minified webpack chunk that cannot run standalone). Every trigger, threshold, class
 * name and timing below is taken from that bundle.
 */
(() => {
  'use strict';

  const DESKTOP = '(min-width: 1025px)';

  /* The production page injects the mega-menu with an inline script directly after
     <template id="main-navigation">. Same thing, before the element upgrades. */
  const nav = document.querySelector('site-header nav');
  const template = document.querySelector('template#main-navigation');
  if (nav && template && !nav.children.length) {
    nav.appendChild(template.content.cloneNode(true));
  }

  /* ------------------------------------------------------------------ counters */
  customElements.define('header-counter', class extends HTMLElement {
    connectedCallback() {
      this.hidden = Number(this.innerText) === 0;

      this.addEventListener('increase', () => {
        this.innerText = Number(this.textContent) + 1;
        this.hidden = Number(this.textContent) === 0;
        this.classList.toggle('added', Number(this.textContent) !== 0);
        this.addEventListener('animationend', () => this.classList.remove('added'));
      });

      this.addEventListener('decrease', () => {
        this.innerText = Number(this.textContent) - 1;
        this.hidden = Number(this.textContent) === 0;
      });

      this.addEventListener('set', event => {
        this.innerText = parseInt(event.detail?.count || 0, 10);
        this.hidden = Number(this.innerText) === 0;
      });
    }
  });

  /* --------------------------------------------------------------- search bar */
  customElements.define('search-focus', class extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('input');
      this.form = this.querySelector('form');
      this.clearButton = this.querySelector('.clear-search');
      this.dropdown = document.querySelector('.search-dropdown');

      this.input.addEventListener('focus', this);
      this.input.addEventListener('blur', this);
      this.clearButton.addEventListener('click', () => this.clearQuery());

      document.querySelectorAll('.search-dropdown button').forEach(button => {
        button.addEventListener('click', () => {
          this.dropdown.hidden = true;
          this.scrollAllow();
        });
      });

      matchMedia(DESKTOP).addEventListener('change', () => {
        this.dropdown.hidden = true;
        this.scrollAllow();
      });
    }

    handleEvent(event) {
      switch (event.type) {
        case 'focus':
          this.dropdown.hidden = false;
          this.dropdown.querySelector('.search-dropdown-content').hidden = false;
          this.dropdown.scrollTop = 0;
          // below 1025px the bar is always on screen, so the page is left scrollable
          if (!this.isPersistentBar()) this.scrollLock();
          break;
        case 'blur':
          // delayed so a click on a suggestion still registers
          setTimeout(() => {
            this.dropdown.hidden = true;
            if (!this.isPersistentBar()) this.scrollAllow();
          }, 250);
          break;
      }
    }

    /* the mobile layout gives search its own permanent row; only the desktop
       overlay is transient, and only that one locks the page behind it */
    isPersistentBar() {
      return !matchMedia(DESKTOP).matches;
    }

    clearQuery() {
      this.input.value = '';
      this.querySelector('.autocomplete-container').hidden = true;
      this.input.focus();
    }

    scrollLock() {
      document.querySelectorAll('html, body, #app, footer').forEach(el => el.classList.add('disable-overflow'));
    }

    scrollAllow() {
      document.querySelectorAll('html, body, #app, footer').forEach(el => el.classList.remove('disable-overflow'));
    }
  });

  /* -------------------------------------------------------------- site header */
  customElements.define('site-header', class extends HTMLElement {
    constructor() {
      super();
      this.resizeObserver = null;

      this.toggleClasses();
      this.addDetailsInteractivity();
      this.observeHeaderHeight();

      matchMedia(DESKTOP).addListener(() => this.addDetailsInteractivity());

      this.querySelectorAll('.navigation-mobile-toggle').forEach(button => {
        button.addEventListener('click', () => this.toggleMobileNavigation());
      });

      // a non-sticky desktop header must not leave a menu hanging open while scrolling
      window.addEventListener('scroll', () => {
        const desktopHeader = document.querySelector('site-header.desktop');
        if (desktopHeader && getComputedStyle(desktopHeader).position === 'static') {
          this.querySelectorAll('details[open]').forEach(d => (d.open = false));
        }
      });

      this.classList.toggle('ios', !!navigator.platform.match(/iPhone|iPod|iPad/));
    }

    toggleClasses() {
      const query = matchMedia(DESKTOP);
      const apply = matches => {
        this.classList.toggle('desktop', matches);
        this.classList.toggle('mobile', !matches);
      };
      apply(query.matches);
      query.addListener(event => {
        apply(event.matches);
        if (event.matches) this.closeMobileNavigation();
      });
    }

    addDetailsInteractivity() {
      const isTouch = 'ontouchstart' in document.documentElement;
      document.body.classList.toggle('touch', isTouch);

      const details = this.querySelectorAll(':not(.mobile) details');

      if (isTouch) {
        details.forEach(detail => {
          detail.addEventListener('click', event => {
            [...details]
              .filter(other => other.open && other !== event.currentTarget)
              .forEach(other => (other.open = false));
          });
        });
        return;
      }

      this.querySelectorAll(':not(.mobile) details:not(.agent-menu)').forEach(detail => {
        if (detail.dataset.hoverBound) return;
        detail.dataset.hoverBound = '1';

        detail.addEventListener('mouseenter', () => {
          // never open behind the search overlay
          detail.open = document.querySelectorAll(
            '.search-dropdown:not([hidden]), .autocomplete-container:not([hidden])'
          ).length === 0;
        });
        detail.addEventListener('mouseleave', () => (detail.open = false));

        if (detail.querySelector('summary > a') === null) {
          detail.querySelector('summary').addEventListener('click', e => e.preventDefault());
        }
      });
    }

    /* body --top-offset always equals the live header height */
    observeHeaderHeight() {
      const update = () => document.body.style.setProperty('--top-offset', this.offsetHeight + 'px');
      update();
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(update);
      this.resizeObserver.observe(this);
    }

    toggleMobileNavigation() {
      const container = this.querySelector('.nav-container');
      const isOpen = container.classList.contains('mobile-nav-open');

      container.classList.toggle('mobile-nav-open', !isOpen);
      this.allowScroll(!isOpen);
      this.appendSecondaryElements();
      this.addMobileInteractivity();
    }

    closeMobileNavigation() {
      this.allowScroll(false);
      const container = this.querySelector('.nav-container');
      container.classList.remove('mobile-nav-open');
      container
        .querySelectorAll('details.contact, .language-switcher-mobile')
        .forEach(el => el.remove());
    }

    /* contact + language switcher are cloned into the drawer, after Galleries */
    appendSecondaryElements() {
      this.querySelectorAll('nav > details.contact, nav > .language-switcher-mobile')
        .forEach(el => el.remove());

      const navEl = this.querySelector('nav');
      const contact = this.querySelector('details.contact');
      const language = this.querySelector('.language-switcher-mobile');

      if (contact) {
        const clone = contact.cloneNode(true);
        const galleries = this.querySelector('nav .galleries')?.closest('details');
        if (galleries) galleries.insertAdjacentElement('afterend', clone);
        else navEl.appendChild(clone);
      }
      if (language) navEl.appendChild(language.cloneNode(true));
    }

    addMobileInteractivity() {
      if (matchMedia(DESKTOP).matches) return;

      const details = this.querySelectorAll(':not(.mobile) details');
      details.forEach(detail => {
        if (detail.dataset.mobileBound) return;
        detail.dataset.mobileBound = '1';

        detail.addEventListener('click', event => {
          if (event.target.nodeName === 'SUMMARY') {
            setTimeout(() => detail.scrollIntoView({ block: 'start', behavior: 'smooth' }), 200);
          }
          [...details]
            .filter(other => other.open && other !== event.currentTarget)
            .forEach(other => (other.open = false));
        });
      });

      // the artworks mega-menu collapses to an accordion on mobile
      document.querySelectorAll('.menu.artworks dt').forEach(term => {
        if (term.dataset.accordionBound) return;
        term.dataset.accordionBound = '1';

        term.addEventListener('click', event => {
          const wasOpen = event.currentTarget.parentNode.classList.contains('open');
          document.querySelector('.menu.artworks dl.open')?.classList.remove('open');
          event.currentTarget.parentNode.classList.toggle('open', !wasOpen);

          if (event.target.nodeName === 'HEADER') {
            const target = event.target;
            setTimeout(() => target.scrollIntoView({ block: 'start', behavior: 'smooth' }), 200);
          }
        });
      });
    }

    allowScroll(lock) {
      document.querySelectorAll('html, body').forEach(el => el.classList.toggle('disable-overflow', lock));
    }
  });

  /* --------------------------------------------------------- promotion banner */
  customElements.define('promotion-banner', class extends HTMLElement {
    connectedCallback() {
      this.querySelector('button.close')?.addEventListener('click', () => {
        sessionStorage.setItem('hide-promotion-banner', '1');
        this.remove();
      });
    }
  });

  if (sessionStorage.getItem('hide-promotion-banner') !== null) {
    document.querySelector('promotion-banner')?.remove();
  }

  /* WhatsApp contact.
   *
   * The element stays hidden until it gains data-css-ready — the inline rule
   * `whats-app-contact:not([data-css-ready]){visibility:hidden}` gates it — and production
   * sets that once it has lazily fetched the stylesheet in its data-css-path. Here the
   * stylesheet is already linked in the head, so the attribute is set directly. */
  customElements.define('whats-app-contact', class extends HTMLElement {
    connectedCallback() {
      this.setAttribute('data-css-ready', '');
      const dialog = this.querySelector('dialog');
      this.querySelector('button.contact')?.addEventListener('click', () => dialog?.showModal());
    }
  });
})();

/* The site ships these as web components in a bundle that cannot run standalone.
   Same triggers, same markup, reimplemented for this static page. */
(() => {
  document.querySelectorAll('whats-app-contact').forEach(el => {
    const open = el.querySelector('button.contact'), dlg = el.querySelector('dialog');
    if (open && dlg) open.addEventListener('click', () => dlg.showModal());
  });
  const dd = document.querySelector('site-header .search-dropdown');
  const input = document.querySelector('site-header search-focus input[type=search]');
  if (dd && input) {
    const show = () => dd.hidden = false, hide = () => dd.hidden = true;
    input.addEventListener('focus', show);
    input.addEventListener('input', show);
    dd.querySelector('.close button')?.addEventListener('click', hide);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
    document.addEventListener('pointerdown', e => {
      if (!dd.hidden && !dd.contains(e.target) && !e.target.closest('search-focus')) hide();
    });
    /* an empty query still resolves: the form posts to the shop's own search page */
    input.form?.addEventListener('submit', () => hide());
  }
})();

/* The QR dialog assumes the phone is a second device. On a phone it is the device, so the
   icon goes straight to the app. Capture phase, so it pre-empts the widget's own
   showModal binding without editing it. */
(() => {
  document.querySelectorAll('whats-app-contact').forEach(el => {
    const btn = el.querySelector('button.contact'), phone = el.getAttribute('data-phone');
    if (!btn || !phone) return;
    btn.addEventListener('click', e => {
      if (!matchMedia('(max-width:820px)').matches) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const w = window.open('https://wa.me/' + phone, '_blank', 'noopener');
      if (!w) location.href = 'https://wa.me/' + phone;
    }, true);
  });
})();

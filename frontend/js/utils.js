(function () {
  const MAX_VISIBLE = 3;
  const DISMISS_MS = 3000;
  let cachedAudio = null;
  let loaderInterval = null;
  let loaderTimeout = null;
  let loaderListenerAdded = false;

  function getToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      // Append to <html> instead of <body> so that body.is-small-ui
      // transform: scale(...) doesn't break position: fixed
      document.documentElement.appendChild(container);
    }
    return container;
  }

  function getAudio() {
    if (cachedAudio) return cachedAudio;
    cachedAudio = {
      success: new Audio('/assets/sounds/ding.mp3'),
      penalty: new Audio('/assets/sounds/buzz.mp3')
    };
    cachedAudio.success.preload = 'auto';
    cachedAudio.penalty.preload = 'auto';
    return cachedAudio;
  }

  function playToastSound(type) {
    const isMuted = localStorage.getItem('isMuted') === 'true';
    if (isMuted) return;

    try {
      const audio = getAudio();
      if (type === 'achievement') {
        audio.success.currentTime = 0;
        audio.success.play();
      } else if (type === 'penalty') {
        audio.penalty.currentTime = 0;
        audio.penalty.play();
      }
    } catch (_) {
      // Silently ignore audio errors
    }
  }

  function getIconClass(type) {
    if (type === 'achievement') return 'ph-trophy';
    if (type === 'penalty') return 'ph-warning-circle';
    return 'ph-info';
  }

  function enforceMaxVisible(container) {
    const toasts = container.querySelectorAll('.toast');
    if (toasts.length <= MAX_VISIBLE) return;
    const overflow = toasts.length - MAX_VISIBLE;
    for (let i = 0; i < overflow; i++) {
      const toast = toasts[i];
      if (toast) {
        toast.classList.add('toast-hide');
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 200);
      }
    }
  }

  function getLoaderOverlay() {
    let overlay = document.getElementById('loader-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loader-overlay';
      overlay.setAttribute('role', 'status');
      overlay.setAttribute('aria-live', 'polite');
      overlay.setAttribute('aria-hidden', 'false');

      const loader = document.createElement('div');
      loader.id = 'letter-leap-loader';
      loader.setAttribute('aria-label', 'Loading LETTER-LEAP');

      const letters = 'LETTER-LEAP'.split('');
      letters.forEach((ch) => {
        const span = document.createElement('span');
        span.className = 'letter';
        span.textContent = ch;
        loader.appendChild(span);
      });

      overlay.appendChild(loader);
      document.documentElement.appendChild(overlay);
    }

    return overlay;
  }

  function clearLoaderTimers() {
    if (loaderInterval) {
      clearInterval(loaderInterval);
      loaderInterval = null;
    }
    if (loaderTimeout) {
      clearTimeout(loaderTimeout);
      loaderTimeout = null;
    }
  }

  function startLoaderAnimation(overlay) {
    const letters = overlay.querySelectorAll('.letter');
    if (!letters.length) return;
    let index = 0;

    const tick = () => {
      const current = letters[index];
      if (current) {
        current.classList.add('jump');
        setTimeout(() => current.classList.remove('jump'), 600);
      }
      index = (index + 1) % letters.length;
    };

    tick();
    loaderInterval = setInterval(tick, 300);
  }

  window.showGameLoader = function showGameLoader(destinationUrl, delay = 3000) {
    if (!destinationUrl) return;
    const overlay = getLoaderOverlay();
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');

    clearLoaderTimers();
    startLoaderAnimation(overlay);
    loaderTimeout = setTimeout(() => {
      window.location.href = destinationUrl;
    }, delay);

    if (!loaderListenerAdded) {
      window.addEventListener('beforeunload', clearLoaderTimers);
      loaderListenerAdded = true;
    }
  };

  window.showToast = function showToast(message, type = 'info') {
    const container = getToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = document.createElement('i');
    icon.className = `ph ${getIconClass(type)} toast-icon`;

    const text = document.createElement('span');
    text.className = 'toast-text';
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });

    // Auto-dismiss
    setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }, DISMISS_MS);

    enforceMaxVisible(container);
    playToastSound(type);
  };
})();

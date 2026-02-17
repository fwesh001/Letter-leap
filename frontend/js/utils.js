(function () {
  const MAX_VISIBLE = 3;
  const DISMISS_MS = 3000;
  let cachedAudio = null;
  let loaderInterval = null;
  let loaderTimeout = null;
  let loaderListenerAdded = false;
  const containedLoaders = new Map();

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

  function createLoaderOverlay(message = 'LETTER-LEAP', contained = false) {
    const overlay = document.createElement('div');
    overlay.className = contained ? 'letter-leap-loader-overlay contained' : 'letter-leap-loader-overlay fullscreen';
    if (!contained) {
      overlay.id = 'loader-overlay';
    }
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-hidden', 'false');

    const loader = document.createElement('div');
    loader.className = 'letter-leap-loader';
    loader.setAttribute('aria-label', `Loading ${message}`);

    const letters = String(message || 'LETTER-LEAP').split('');
    letters.forEach((ch) => {
      const span = document.createElement('span');
      span.className = 'letter';
      span.textContent = ch;
      loader.appendChild(span);
    });

    overlay.appendChild(loader);
    return overlay;
  }

  function getFullscreenLoaderOverlay(message = 'LETTER-LEAP') {
    let overlay = document.getElementById('loader-overlay');
    if (!overlay) {
      overlay = createLoaderOverlay(message, false);
      document.documentElement.appendChild(overlay);
    } else {
      const loader = overlay.querySelector('.letter-leap-loader');
      if (loader) {
        loader.innerHTML = '';
        String(message || 'LETTER-LEAP').split('').forEach((ch) => {
          const span = document.createElement('span');
          span.className = 'letter';
          span.textContent = ch;
          loader.appendChild(span);
        });
      }
    }
    return overlay;
  }

  function getContainedLoaderOverlay(targetSelector, message = 'SCANNING...') {
    const target = document.querySelector(targetSelector);
    if (!target) return null;

    if (window.getComputedStyle(target).position === 'static') {
      target.style.position = 'relative';
    }

    let overlay = containedLoaders.get(targetSelector);
    if (!overlay || !overlay.isConnected) {
      overlay = createLoaderOverlay(message, true);
      target.appendChild(overlay);
      containedLoaders.set(targetSelector, overlay);
    } else {
      const loader = overlay.querySelector('.letter-leap-loader');
      if (loader) {
        loader.innerHTML = '';
        String(message || 'SCANNING...').split('').forEach((ch) => {
          const span = document.createElement('span');
          span.className = 'letter';
          span.textContent = ch;
          loader.appendChild(span);
        });
      }
      overlay.style.display = 'flex';
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

  window.showGameLoader = function showGameLoader(destinationOrMessage, delayOrOptions = 3000) {
    if (!destinationOrMessage) return;

    if (typeof delayOrOptions === 'object' && delayOrOptions !== null) {
      const options = delayOrOptions;
      const targetSelector = options.target || 'body';
      const message = String(destinationOrMessage || options.message || 'SCANNING...');
      const overlay = getContainedLoaderOverlay(targetSelector, message);
      if (!overlay) return;
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');

      clearLoaderTimers();
      startLoaderAnimation(overlay);
      return;
    }

    const destinationUrl = destinationOrMessage;
    const delay = typeof delayOrOptions === 'number' ? delayOrOptions : 3000;
    const overlay = getFullscreenLoaderOverlay('LETTER-LEAP');
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

  window.hideGameLoader = function hideGameLoader(targetSelector = null) {
    clearLoaderTimers();
    if (targetSelector) {
      const overlay = containedLoaders.get(targetSelector);
      if (overlay) {
        overlay.remove();
        containedLoaders.delete(targetSelector);
      }
      return;
    }

    const fullscreen = document.getElementById('loader-overlay');
    if (fullscreen) {
      fullscreen.style.display = 'none';
      fullscreen.setAttribute('aria-hidden', 'true');
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

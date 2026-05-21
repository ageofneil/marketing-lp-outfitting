/**
 * Landing Page Factory — main.js
 * Minimal JavaScript: smooth scroll for anchor links only.
 * No frameworks, no dependencies.
 */

(function () {
  'use strict';

  /**
   * Smooth-scroll to the target element when an anchor link is clicked.
   * Respects the user's prefers-reduced-motion setting.
   */
  function initSmoothScroll() {
    var prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    document.addEventListener('click', function (event) {
      var target = event.target.closest('a[href^="#"]');
      if (!target) return;

      var hash = target.getAttribute('href');
      if (!hash || hash === '#') return;

      var destination = document.querySelector(hash);
      if (!destination) return;

      event.preventDefault();

      if (prefersReducedMotion) {
        destination.scrollIntoView();
      } else {
        destination.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Update URL hash without triggering a jump
      if (history.pushState) {
        history.pushState(null, '', hash);
      }

      // Move focus to the destination for accessibility
      if (!destination.hasAttribute('tabindex')) {
        destination.setAttribute('tabindex', '-1');
      }
      destination.focus({ preventScroll: true });
    });
  }

  /**
   * Toggle video mute state when the unmute button is clicked.
   */
  function initVideoUnmute() {
    var video = document.getElementById('hero-video');
    var btn = document.getElementById('unmute-btn');
    if (!video || !btn) return;

    var iconMuted = btn.querySelector('.icon-muted');
    var iconUnmuted = btn.querySelector('.icon-unmuted');

    btn.addEventListener('click', function() {
      if (video.muted) {
        video.muted = false;
        iconMuted.style.display = 'none';
        iconUnmuted.style.display = 'block';
      } else {
        video.muted = true;
        iconMuted.style.display = 'block';
        iconUnmuted.style.display = 'none';
      }
    });
  }

  // Run after the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initSmoothScroll();
      initVideoUnmute();
    });
  } else {
    initSmoothScroll();
    initVideoUnmute();
  }
})();

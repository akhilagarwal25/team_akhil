/**
 * CRO Experiment 1: Urgency & Scarcity
 * Product: Amla (Amlaki) Whole (stock=16)
 * Week: 2026-W21
 *
 * Theme: Shopify Oxygen (React-based) - content renders client-side
 * Fix: Use MutationObserver to watch for h1, poll for elements, check URL
 */

(function() {
  'use strict';

  // Detect product page via URL
  var isAmlaWhole = window.location.pathname.indexOf('amla-amlaki-whole') !== -1;
  if (!isAmlaWhole) return;

  var MAX_WAIT = 8000; // 8 seconds max
  var tried = 0;

  function tryInject() {
    tried++;

    // The h1 has NO class - just <h1>Product Name</h1>
    // Find it by text content instead
    var h1 = document.querySelector('h1');
    if (!h1) return false;

    var h1Text = (h1.textContent || h1.innerText || '').toLowerCase();
    if (!h1Text.includes('amla')) return false;

    // Price - look for price div anywhere on page
    var priceEl = document.querySelector('.price') || document.querySelector('[class*="price"]');
    if (!priceEl) return false;

    // Add to cart form
    var form = document.querySelector('form[action*="cart/add"]') || document.querySelector('form');
    if (!form) return false;

    // Submit button
    var btn = document.querySelector('button[type="submit"]') || form.querySelector('button');

    // ── 1. "Only 16 left" badge inside price area ─────────────────────────
    if (!document.getElementById('cro-badge-16')) {
      var badge = document.createElement('span');
      badge.id = 'cro-badge-16';
      badge.style.cssText = 'display:inline-block;background:#d63031;color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;margin-left:8px;vertical-align:middle;animation:cro-pulse 2s ease-in-out infinite;cursor:default;white-space:nowrap';
      badge.textContent = 'Only 16 left!';
      priceEl.style.position = 'relative';
      priceEl.appendChild(badge);
    }

    // ── 2. "Selling fast" bar above the form ────────────────────────────────
    if (!document.getElementById('cro-selling-fast')) {
      var bar = document.createElement('div');
      bar.id = 'cro-selling-fast';
      bar.style.cssText = 'background:linear-gradient(90deg,#d63031,#e17055);color:#fff;text-align:center;padding:9px 14px;font-size:13px;font-weight:600;border-radius:6px;margin-bottom:10px;letter-spacing:0.3px;font-family:inherit';
      bar.textContent = '12 people bought this in the last 24 hours';
      form.insertBefore(bar, form.firstChild);
    }

    // ── 3. Same-day dispatch below submit button ────────────────────────────
    if (!document.getElementById('cro-dispatch') && btn) {
      var dispatch = document.createElement('div');
      dispatch.id = 'cro-dispatch';
      dispatch.style.cssText = 'background:#e8f8f0;border:1px solid #27ae60;color:#1e8449;padding:7px 12px;border-radius:6px;font-size:12px;font-weight:600;margin-top:8px;text-align:center;font-family:inherit';
      dispatch.textContent = 'Order in next 2 hours for same-day dispatch from Agra';
      btn.parentNode.insertBefore(dispatch, btn.nextSibling);
    }

    // ── 4. Pulse animation ─────────────────────────────────────────────────
    if (!document.getElementById('cro-style')) {
      var style = document.createElement('style');
      style.id = 'cro-style';
      style.textContent = '@keyframes cro-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.85;transform:scale(1.03)}}';
      document.head.appendChild(style);
    }

    console.log('[CRO-EXP1] Urgency applied for Amla Whole');
    return true;
  }

  // Try immediately
  if (tryInject()) return;

  // For Oxygen (React) themes - watch for h1 to appear
  var observer = new MutationObserver(function(mutations) {
    if (tryInject()) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Also poll every 500ms as backup
  var poll = setInterval(function() {
    if (tryInject()) {
      clearInterval(poll);
      observer.disconnect();
    } else if (tried > (MAX_WAIT / 500)) {
      clearInterval(poll);
      observer.disconnect();
      console.log('[CRO-EXP1] Elements not found, giving up');
    }
  }, 500);

  // Clean up after max wait
  setTimeout(function() {
    clearInterval(poll);
    observer.disconnect();
  }, MAX_WAIT);

})();

/**
 * CRO Experiment 1: Urgency & Scarcity
 * Product: Amla (Amlaki) Whole (stock=16)
 * Week: 2026-W21
 *
 * Theme: Shopify Oxygen (React-based) - content renders client-side
 * Fix: Fire on window.load + 2s delay to ensure React hydration complete
 */

(function() {
  'use strict';

  var INJECTED = false;

  function doInject() {
    if (INJECTED) return;
    INJECTED = true;

    // Check URL
    var path = window.location.pathname;
    if (path.indexOf('amla-amlaki-whole') === -1) return;

    // Find h1 by text
    var allH1 = document.querySelectorAll('h1');
    var h1 = null;
    for (var i = 0; i < allH1.length; i++) {
      var t = (allH1[i].textContent || allH1[i].innerText || '').toLowerCase();
      if (t.indexOf('amla') !== -1) {
        h1 = allH1[i];
        break;
      }
    }
    if (!h1) {
      console.log('[CRO-EXP1] h1 not found, path=' + path);
      return;
    }

    console.log('[CRO-EXP1] Injecting for: ' + h1.textContent.trim().substring(0, 40));

    // Find form (Add to Cart)
    var form = null;
    var forms = document.querySelectorAll('form');
    for (var j = 0; j < forms.length; j++) {
      var action = forms[j].getAttribute('action') || '';
      if (action.indexOf('cart') !== -1) {
        form = forms[j];
        break;
      }
    }
    if (!form) {
      console.log('[CRO-EXP1] cart form not found');
      return;
    }

    // Find submit button
    var btn = form.querySelector('button[type="submit"]') || form.querySelector('button');
    if (!btn) {
      console.log('[CRO-EXP1] submit button not found');
      return;
    }

    // Find price
    var priceEl = document.querySelector('.price') || form.parentElement.querySelector('.price');

    // ── 1. "Only 16 left" badge ───────────────────────────────────────────
    if (!document.getElementById('cro-badge-16') && priceEl) {
      var badge = document.createElement('span');
      badge.id = 'cro-badge-16';
      badge.style.cssText = 'display:inline-block;background:#d63031;color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;margin-left:8px;vertical-align:middle;animation:cro-pulse 2s ease-in-out infinite;white-space:nowrap;font-family:inherit';
      badge.textContent = 'Only 16 left!';
      priceEl.style.position = 'relative';
      priceEl.appendChild(badge);
    }

    // ── 2. "Selling fast" bar above form ──────────────────────────────────
    if (!document.getElementById('cro-selling-fast')) {
      var bar = document.createElement('div');
      bar.id = 'cro-selling-fast';
      bar.style.cssText = 'background:linear-gradient(90deg,#d63031,#e17055);color:#fff;text-align:center;padding:9px 14px;font-size:13px;font-weight:600;border-radius:6px;margin-bottom:10px;letter-spacing:0.3px;font-family:inherit';
      bar.textContent = '12 people bought this in the last 24 hours';
      form.insertBefore(bar, form.firstChild);
    }

    // ── 3. Same-day dispatch below button ─────────────────────────────────
    if (!document.getElementById('cro-dispatch')) {
      var dispatch = document.createElement('div');
      dispatch.id = 'cro-dispatch';
      dispatch.style.cssText = 'background:#e8f8f0;border:1px solid #27ae60;color:#1e8449;padding:7px 12px;border-radius:6px;font-size:12px;font-weight:600;margin-top:8px;font-family:inherit';
      dispatch.textContent = 'Order in next 2 hours for same-day dispatch from Agra';
      btn.parentNode.insertBefore(dispatch, btn.nextSibling);
    }

    // ── 4. Pulse animation ────────────────────────────────────────────────
    if (!document.getElementById('cro-style')) {
      var style = document.createElement('style');
      style.id = 'cro-style';
      style.textContent = '@keyframes cro-pulse{0%,100%{opacity:1}50%{opacity:0.85}}';
      document.head.appendChild(style);
    }

    console.log('[CRO-EXP1] Done - elements injected');
  }

  // Fire on window.load + 2s extra for React hydration
  window.addEventListener('load', function() {
    console.log('[CRO-EXP1] window.load fired');
    setTimeout(doInject, 2000);
  });

  // Also try MutationObserver as backup
  var observer = new MutationObserver(function() {
    var form = document.querySelector('form[action*="cart"]');
    if (form && !INJECTED) {
      console.log('[CRO-EXP1] MutationObserver triggered');
      doInject();
    }
  });
  try {
    observer.observe(document.body, { childList: true, subtree: true });
  } catch(e) {}

})();

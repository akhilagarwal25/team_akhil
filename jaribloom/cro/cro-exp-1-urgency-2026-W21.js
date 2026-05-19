/**
 * CRO Experiment 1: Urgency & Scarcity
 * Product: Amla (Amlaki) Whole (handle: amla-amlaki-whole, stock=16)
 * Week: 2026-W21
 * Maya's hypothesis: Low stock + urgency = +23% conversion
 *
 * Changes:
 * 1. "Only 16 left" badge after price
 * 2. "Selling fast" bar above Add to Cart
 * 3. "Order within 2 hours for same-day dispatch" below button
 *
 * Theme selectors (Dawn 11+):
 *   Title:   h1.product__title
 *   Price:   div.price.price--large
 *   Form:    form[action*="cart/add"]
 *   Button:  button.product-form__submit
 */

(function() {
  'use strict';

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function() {

    var title = document.querySelector('h1.product__title');
    if (!title) return;

    var titleText = (title.textContent || title.innerText || '').toLowerCase();
    if (!titleText.includes('amla')) return;

    // ── 1. "Only 16 left" badge after price ───────────────────────────────
    var priceEl = document.querySelector('div.price.price--large');
    if (priceEl) {
      var badge = document.createElement('div');
      badge.style.cssText = 'display:inline-block;background:#d63031;color:#fff;padding:5px 12px;border-radius:20px;font-size:13px;font-weight:700;margin-left:10px;vertical-align:middle;animation:cro-pulse 2s ease-in-out infinite;cursor:default';
      badge.textContent = 'Only 16 left!';
      priceEl.appendChild(badge);
    }

    // ── 2. "Selling fast" bar above Add to Cart ────────────────────────────
    var form = document.querySelector('form[action*="cart/add"]');
    if (form) {
      var bar = document.createElement('div');
      bar.style.cssText = 'background:linear-gradient(90deg,#d63031,#e17055);color:#fff;text-align:center;padding:9px 14px;font-size:13px;font-weight:600;border-radius:6px;margin-bottom:10px;letter-spacing:0.3px';
      bar.textContent = '12 people bought this in the last 24 hours';
      form.insertBefore(bar, form.firstChild);
    }

    // ── 3. Same-day dispatch below Add to Cart button ─────────────────────
    var submitBtn = document.querySelector('button.product-form__submit');
    if (submitBtn) {
      var dispatch = document.createElement('div');
      dispatch.style.cssText = 'background:#e8f8f0;border:1px solid #27ae60;color:#1e8449;padding:7px 12px;border-radius:6px;font-size:12px;font-weight:600;margin-top:8px;text-align:center';
      dispatch.textContent = 'Order in next 2 hours for same-day dispatch from Agra';
      var parent = submitBtn.parentNode;
      if (parent) {
        parent.insertBefore(dispatch, submitBtn.nextSibling);
      }
    }

    // ── 4. Pulsing animation ───────────────────────────────────────────────
    var style = document.createElement('style');
    style.textContent = '@keyframes cro-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.85;transform:scale(1.03)}}';
    document.head.appendChild(style);

    console.log('[CRO-EXP1] Urgency applied for Amla Whole');
  });
})();

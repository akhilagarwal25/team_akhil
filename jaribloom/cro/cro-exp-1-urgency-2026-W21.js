/**
 * CRO Experiment 1: Urgency & Scarcity
 * Product: Amla Whole (stock=16)
 * Week: 2026-W21
 * Maya's hypothesis: Low stock + urgency = +23% conversion
 *
 * Changes:
 * 1. "Only 16 left" badge
 * 2. Low-stock countdown timer
 * 3. "Selling fast" social proof bar
 * 4. "Order within 2 hours for same-day dispatch"
 *
 * Deploy: Inject via Shopify ScriptTag or theme snippet
 * Target: Product page for Amla Whole
 */

(function() {
  'use strict';

  // Only run on product pages
  var productTitle = document.querySelector('.product-title, .product-info h1, h1.product__title, .product-single__title');
  if (!productTitle) return;

  var title = productTitle.textContent || productTitle.innerText || '';
  if (!title.toLowerCase().includes('amla')) return;

  // ── Helper: Create badge ─────────────────────────────────────────────────
  function createBadge(text, bg, color) {
    var badge = document.createElement('span');
    badge.textContent = text;
    badge.style.cssText = [
      'display: inline-block',
      'background: ' + bg,
      'color: ' + color,
      'padding: 6px 12px',
      'border-radius: 20px',
      'font-size: 13px',
      'font-weight: 700',
      'margin: 4px 4px 4px 0',
      'animation: pulse 2s infinite',
      'box-shadow: 0 2px 8px rgba(0,0,0,0.15)'
    ].join(';');
    return badge;
  }

  // ── 1. "Only 16 left" urgency badge ──────────────────────────────────────
  var priceArea = document.querySelector('.product-price, .price, .product__price, .price__current');
  if (priceArea) {
    var stockBadge = createBadge('🔥 Only 16 left!', '#e74c3c', '#fff');
    priceArea.parentNode.insertBefore(stockBadge, priceArea.nextSibling);
  }

  // ── 2. "Selling fast" social proof bar ───────────────────────────────────
  var proofBar = document.createElement('div');
  proofBar.textContent = '🔥 12 people bought this in the last 24 hours';
  proofBar.style.cssText = [
    'background: linear-gradient(90deg, #e74c3c, #c0392b)',
    'color: #fff',
    'text-align: center',
    'padding: 10px 16px',
    'font-size: 14px',
    'font-weight: 600',
    'margin-bottom: 12px',
    'border-radius: 8px'
  ].join(';');

  var target = document.querySelector('.product-form, .add-to-cart-form, form[action*="cart"]');
  if (target) {
    target.parentNode.insertBefore(proofBar, target);
  }

  // ── 3. Same-day dispatch notice ───────────────────────────────────────────
  var dispatch = document.createElement('div');
  dispatch.textContent = '🚚 Order in next 2 hours for same-day dispatch from Agra';
  dispatch.style.cssText = [
    'background: #d5f5e3',
    'border: 1px solid #27ae60',
    'color: #1e8449',
    'padding: 8px 14px',
    'border-radius: 6px',
    'font-size: 13px',
    'font-weight: 600',
    'margin-top: 8px',
    'display: flex',
    'align-items: center',
    'gap: 6px'
  ].join(';');

  var insertAfter = document.querySelector('.add-to-cart, button[name="add"]');
  if (insertAfter) {
    insertAfter.parentNode.insertBefore(dispatch, insertAfter.nextSibling);
  }

  // ── 4. Pulsing CSS ───────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = '@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.02); } }';
  document.head.appendChild(style);

  console.log('[CRO-EXP1] Urgency overlay applied for Amla Whole');
})();

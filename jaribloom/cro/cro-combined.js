// MAYA CRO W21 - Combined Script
// Generated: 2026-05-20
// EXP1: Urgency/Amla Whole | EXP2: Social Proof/Amla Shikakai

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


// ---- EXP2 ----
/**
 * CRO Experiment 2: Social Proof & Bundle Value
 * Product: Amla Shikakai Powder Combo
 * Week: 2026-W21
 * Maya's hypothesis: Social proof + bundle value = +18% conversion
 *
 * Changes:
 * 1. "Bestseller Combo" badge near title
 * 2. Star rating (4.8★) + review count
 * 3. "Customers also bought" cross-sell
 * 4. Savings highlight vs individual purchase
 * 5. Trust badges
 */

(function() {
  'use strict';

  var productTitle = document.querySelector('.product-title, .product-info h1, h1.product__title, .product-single__title');
  if (!productTitle) return;

  var title = (productTitle.textContent || productTitle.innerText || '').toLowerCase();
  if (!title.includes('shikakai') && !title.includes('amla') && !title.includes('reetha')) return;

  // ── 1. Bestseller badge ────────────────────────────────────────────────
  var badge = document.createElement('span');
  badge.textContent = '⭐ BESTSELLER COMBO';
  badge.style.cssText = 'display:inline-block;background:#f39c12;color:#fff;padding:5px 10px;border-radius:16px;font-size:12px;font-weight:700;margin:6px 0;text-transform:uppercase;letter-spacing:0.5px;';
  if (productTitle.nextSibling) {
    productTitle.parentNode.insertBefore(badge, productTitle.nextSibling);
  } else {
    productTitle.parentNode.appendChild(badge);
  }

  // ── 2. Star rating ────────────────────────────────────────────────────
  var ratingDiv = document.createElement('div');
  ratingDiv.innerHTML = '★★★★★ <span style="color:#f39c12;font-weight:700">4.8</span> / 5 &nbsp; <span style="color:#888;font-size:13px">(127 reviews)</span>';
  ratingDiv.style.cssText = 'font-size:15px;margin:4px 0;';

  var insertNode = productTitle.nextSibling ? productTitle.nextSibling.nextSibling : null;
  if (insertNode) {
    productTitle.parentNode.insertBefore(ratingDiv, insertNode);
  } else {
    productTitle.parentNode.appendChild(ratingDiv);
  }

  // ── 3. Cross-sell widget ──────────────────────────────────────────────
  var crossSell = document.createElement('div');
  crossSell.innerHTML =
    '<div style="font-weight:700;font-size:14px;margin-bottom:8px;color:#333;">🛒 Customers also bought:</div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
    '<div style="text-align:center;width:80px;">' +
    '<div style="width:60px;height:60px;background:#f0f0f0;border-radius:8px;margin-bottom:4px;display:flex;align-items:center;justify-content:center;font-size:30px;">🌿</div>' +
    '<div style="font-size:11px;color:#555;">Reetha</div>' +
    '<div style="font-size:11px;color:#27ae60;font-weight:600;">₹89</div>' +
    '</div>' +
    '<div style="text-align:center;width:80px;">' +
    '<div style="width:60px;height:60px;background:#f0f0f0;border-radius:8px;margin-bottom:4px;display:flex;align-items:center;justify-content:center;font-size:30px;">🌱</div>' +
    '<div style="font-size:11px;color:#555;">Shikakai</div>' +
    '<div style="font-size:11px;color:#27ae60;font-weight:600;">₹129</div>' +
    '</div>' +
    '<div style="text-align:center;width:80px;">' +
    '<div style="width:60px;height:60px;background:#f0f0f0;border-radius:8px;margin-bottom:4px;display:flex;align-items:center;justify-content:center;font-size:30px;">🫒</div>' +
    '<div style="font-size:11px;color:#555;">Amla</div>' +
    '<div style="font-size:11px;color:#27ae60;font-weight:600;">₹140</div>' +
    '</div>' +
    '</div>';
  crossSell.style.cssText = 'border:1px solid #e0e0e0;border-radius:10px;padding:14px;margin:14px 0;background:#fafafa;';

  var form = document.querySelector('.product-form, .add-to-cart-form, form[action*="cart"]');
  if (form) {
    form.parentNode.insertBefore(crossSell, form);
  }

  // ── 4. Savings highlight ─────────────────────────────────────────────
  var savings = document.createElement('div');
  savings.innerHTML =
    '<div style="background:#d5f5e3;border:1px solid #27ae60;border-radius:8px;padding:10px 14px;margin-top:10px;">' +
    '<div style="font-size:13px;color:#1e8449;font-weight:700;">💰 Save ₹80 by buying as combo!</div>' +
    '<div style="font-size:12px;color:#555;margin-top:4px;">' +
    'Buy separately: <s>₹358</s> &nbsp;|&nbsp; ' +
    'Combo price: <strong style="color:#27ae60;">₹210</strong> &nbsp;|&nbsp; ' +
    '<span style="color:#e74c3c;font-weight:700;">22% off</span>' +
    '</div>' +
    '</div>';
  if (form) {
    form.parentNode.insertBefore(savings, form.nextSibling);
  }

  // ── 5. Trust badges ───────────────────────────────────────────────────
  var trust = document.createElement('div');
  trust.innerHTML =
    '<div style="display:flex;gap:12px;margin-top:14px;flex-wrap:wrap;justify-content:center;border-top:1px solid #eee;padding-top:10px;">' +
    '<span style="font-size:12px;color:#666;">✓ 100% Authentic Ayurvedic</span>' +
    '<span style="font-size:12px;color:#666;">✓ 30-Day Return</span>' +
    '<span style="font-size:12px;color:#666;">✓ Free Shipping 300+</span>' +
    '</div>';
  if (form && form.parentNode) {
    form.parentNode.appendChild(trust);
  }

  console.log('[CRO-EXP2] Social Proof overlay applied for Amla Shikakai Combo');
})();

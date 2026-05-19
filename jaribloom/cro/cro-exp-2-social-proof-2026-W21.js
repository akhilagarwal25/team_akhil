/**
 * CRO Experiment 2: Social Proof & Bundle Value
 * Product: Amla Reetha & Shikakai Powder Combo (handle contains 'shikakai')
 * Week: 2026-W21
 * Maya's hypothesis: Social proof + bundle value = +18% conversion
 *
 * Theme: Shopify Oxygen (React-based) - same fix as EXP1
 */

(function() {
  'use strict';

  var INJECTED = false;

  function doInject() {
    if (INJECTED) return;

    var path = window.location.pathname;
    // Match Amla Shikakai Combo page
    if (path.indexOf('shikakai') === -1) return;

    // Find h1 by text
    var allH1 = document.querySelectorAll('h1');
    var h1 = null;
    for (var i = 0; i < allH1.length; i++) {
      var t = (allH1[i].textContent || allH1[i].innerText || '').toLowerCase();
      if (t.indexOf('shikakai') !== -1 || t.indexOf('reetha') !== -1) {
        h1 = allH1[i];
        break;
      }
    }
    if (!h1) return;

    var form = null;
    var forms = document.querySelectorAll('form');
    for (var j = 0; j < forms.length; j++) {
      var action = forms[j].getAttribute('action') || '';
      if (action.indexOf('cart') !== -1) {
        form = forms[j];
        break;
      }
    }
    if (!form) return;

    var btn = form.querySelector('button[type="submit"]') || form.querySelector('button');
    var parent = form.parentNode;
    if (!parent) return;

    INJECTED = true;

    // ── 1. Bestseller badge below h1 ──────────────────────────────────────
    if (!document.getElementById('cro-bestseller')) {
      var badge = document.createElement('div');
      badge.id = 'cro-bestseller';
      badge.style.cssText = 'background:#f39c12;color:#fff;padding:5px 12px;border-radius:16px;font-size:12px;font-weight:700;display:inline-block;margin:8px 0;letter-spacing:0.5px;font-family:inherit';
      badge.textContent = 'BESTSELLER COMBO';
      h1.parentNode.insertBefore(badge, h1.nextSibling);
    }

    // ── 2. Star rating below badge ───────────────────────────────────────
    if (!document.getElementById('cro-rating')) {
      var ratingDiv = document.createElement('div');
      ratingDiv.id = 'cro-rating';
      ratingDiv.style.cssText = 'font-size:15px;margin:4px 0 10px;font-family:inherit';
      ratingDiv.innerHTML = '<span style="color:#f39c12;">★★★★★</span> <span style="color:#f39c12;font-weight:700;">4.8</span> / 5 &nbsp; <span style="color:#888;font-size:13px;">(127 reviews)</span>';
      h1.parentNode.insertBefore(ratingDiv, badge.nextSibling);
    }

    // ── 3. Cross-sell widget above form ──────────────────────────────────
    if (!document.getElementById('cro-crosssell')) {
      var crossSell = document.createElement('div');
      crossSell.id = 'cro-crosssell';
      crossSell.style.cssText = 'border:1px solid #e0e0e0;border-radius:10px;padding:14px;margin-bottom:12px;background:#fafafa;font-family:inherit';
      crossSell.innerHTML =
        '<div style="font-weight:700;font-size:14px;margin-bottom:10px;color:#333;">Customers also bought with this combo:</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        '<div style="text-align:center;width:80px;">' +
        '<div style="width:60px;height:60px;background:#f0f0f0;border-radius:8px;margin-bottom:4px;display:flex;align-items:center;justify-content:center;font-size:28px;">🌿</div>' +
        '<div style="font-size:11px;color:#555;">Reetha Whole</div>' +
        '<div style="font-size:11px;color:#27ae60;font-weight:600;">₹89</div>' +
        '</div>' +
        '<div style="text-align:center;width:80px;">' +
        '<div style="width:60px;height:60px;background:#f0f0f0;border-radius:8px;margin-bottom:4px;display:flex;align-items:center;justify-content:center;font-size:28px;">🌱</div>' +
        '<div style="font-size:11px;color:#555;">Shikakai Powder</div>' +
        '<div style="font-size:11px;color:#27ae60;font-weight:600;">₹129</div>' +
        '</div>' +
        '<div style="text-align:center;width:80px;">' +
        '<div style="width:60px;height:60px;background:#f0f0f0;border-radius:8px;margin-bottom:4px;display:flex;align-items:center;justify-content:center;font-size:28px;">🫒</div>' +
        '<div style="font-size:11px;color:#555;">Amla Powder</div>' +
        '<div style="font-size:11px;color:#27ae60;font-weight:600;">₹140</div>' +
        '</div>' +
        '</div>';
      parent.insertBefore(crossSell, form);
    }

    // ── 4. Savings highlight ─────────────────────────────────────────────
    if (!document.getElementById('cro-savings')) {
      var savings = document.createElement('div');
      savings.id = 'cro-savings';
      savings.style.cssText = 'background:#d5f5e3;border:1px solid #27ae60;border-radius:8px;padding:10px 14px;margin-top:10px;font-family:inherit';
      savings.innerHTML =
        '<div style="font-size:14px;color:#1e8449;font-weight:700;">Save ₹80 by buying as combo!</div>' +
        '<div style="font-size:12px;color:#555;margin-top:4px;">' +
        'Buy separately: <s>₹358</s> &nbsp;|&nbsp; ' +
        'Combo: <strong style="color:#27ae60;">₹210</strong> &nbsp;|&nbsp; ' +
        '<span style="color:#e74c3c;font-weight:700;">22% off</span>' +
        '</div>';
      parent.insertBefore(savings, form.nextSibling);
    }

    // ── 5. Trust badges ─────────────────────────────────────────────────
    if (!document.getElementById('cro-trust')) {
      var trust = document.createElement('div');
      trust.id = 'cro-trust';
      trust.style.cssText = 'display:flex;gap:12px;margin-top:14px;flex-wrap:wrap;justify-content:flex-start;border-top:1px solid #eee;padding-top:10px;font-family:inherit';
      trust.innerHTML =
        '<span style="font-size:12px;color:#666;">✓ 100% Authentic Ayurvedic</span>' +
        '<span style="font-size:12px;color:#666;">✓ 30-Day Return</span>' +
        '<span style="font-size:12px;color:#666;">✓ Free Shipping 300+</span>';
      if (btn) {
        btn.parentNode.insertBefore(trust, btn.nextSibling);
      }
    }

    console.log('[CRO-EXP2] Social proof injected');
  }

  window.addEventListener('load', function() {
    setTimeout(doInject, 2000);
  });

  var observer = new MutationObserver(function() {
    if (!INJECTED && document.querySelector('form[action*="cart"]')) {
      doInject();
    }
  });
  try { observer.observe(document.body, { childList: true, subtree: true }); } catch(e) {}

})();

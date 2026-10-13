/**
 * 统一导航栏 - 所有页面自动注入
 * 依赖: site-config.js (需先加载)
 */
(function () {
  'use strict';

  function renderNav() {
    if (typeof SITE_CONFIG === 'undefined') return;

    const nav = document.createElement('nav');
    nav.className = 'nav-menu';
    nav.setAttribute('aria-label', '主导航');

    const path = window.location.pathname;

    SITE_CONFIG.nav.forEach(item => {
      const a = document.createElement('a');
      a.href = item.href;
      a.className = 'nav-link';
      a.textContent = item.label;

      // 高亮当前页
      const isHome = item.href === '/' && (path === '/' || path === '/index.html');
      const isCurrent = item.href !== '/' && !item.href.includes('#') && path.endsWith(item.href);
      if (isHome || isCurrent) a.classList.add('active');

      nav.appendChild(a);
    });

    document.body.prepend(nav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNav);
  } else {
    renderNav();
  }
})();

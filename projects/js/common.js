/**
 * 共享脚本 - 粒子背景 + 页脚渲染
 * 依赖: site-config.js (需先加载)
 */
(function () {
  'use strict';

  /* ---------- SVG 图标 ---------- */
  var ICONS = {
    email: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    twitter: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    telegram: 'M9.04 15.31l-.38 5.66c.55 0 .79-.24 1.08-.52l2.59-2.48 5.37 3.93c.98.55 1.69.26 1.99-.9L24.8 4.2c.36-1.44-.52-2-1.5-1.66L1.7 9.54c-1.4.55-1.38 1.34-.24 1.7l5.7 1.78L20.4 6.6c.62-.41 1.19-.18.72.23z'
  };

  /* ---------- 页脚渲染 ---------- */
  function renderFooter() {
    if (typeof SITE_CONFIG === 'undefined') return;

    var footer = document.getElementById('site-footer');
    if (!footer) {
      footer = document.createElement('footer');
      footer.className = 'footer';
      footer.id = 'site-footer';
      document.body.appendChild(footer);
    }

    var labels = { email: 'Email', youtube: 'YouTube', twitter: 'Twitter', telegram: 'Telegram' };
    var linksHtml = Object.keys(SITE_CONFIG.social).map(function (key) {
      var external = SITE_CONFIG.social[key].indexOf('mailto:') !== 0;
      return '<a href="' + SITE_CONFIG.social[key] + '" class="social-link"' +
        (external ? ' target="_blank" rel="noopener noreferrer"' : '') +
        ' aria-label="' + labels[key] + '" title="' + labels[key] + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICONS[key] + '"/></svg></a>';
    }).join('');

    footer.innerHTML =
      '<div class="social-links">' + linksHtml + '</div>' +
      '<p>© ' + new Date().getFullYear() + ' ' + SITE_CONFIG.name + ' | Made with ❤️ by 飞飞</p>';
  }

  /* ---------- 粒子背景（页面隐藏时自动暂停，尊重减少动效偏好） ---------- */
  function initParticles() {
    var canvas = document.getElementById('particles');
    if (!canvas) return;

    // 用户偏好减少动效时不启动
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ctx = canvas.getContext('2d');
    var particles = [];
    var PARTICLE_COUNT = 100;
    var rafId = null;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        color: Math.random() > 0.5 ? '#00f5ff' : '#ff00ff'
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      rafId = requestAnimationFrame(animate);
    }

    function start() { if (rafId === null) rafId = requestAnimationFrame(animate); }
    function stop() { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    window.addEventListener('resize', resize);
    resize();
    start();
  }

  /* ---------- 初始化 ---------- */
  function init() {
    renderFooter();
    initParticles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

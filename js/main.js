(function () {
  var reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return document.querySelector(s); };

  /* ---------- dados do config ---------- */
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    a.href = linkWA(a.dataset.msg);
    a.target = '_blank'; a.rel = 'noopener';
  });
  if (CONFIG.crn) {
    document.querySelectorAll('[data-crn] span, [data-crn-rodape]').forEach(function (el) { el.textContent = CONFIG.crn; });
  }
  $('#ano').textContent = new Date().getFullYear();

  /* ---------- ramos floridos ---------- */
  var T = window.Trepadeira;

  var hero = new T($('#vinhaHero'), {
    semente: 40, cresce: 0, flores: 0.3, alvoClique: $('#inicio'), evitar: [.24, .08, .78, .52],
    guias: [
      { pts: [[.07, 1], [.12, .86], [.09, .66], [.13, .46], [.1, .27], [.16, .1], [.32, .055], [.5, .08], [.68, .05], [.84, .1], [.91, .23], [.88, .36]], l: 3 },
      { pts: [[.96, 1], [.9, .9], [.94, .79], [.89, .7]], s0: 40, l: 2.2 }
    ]
  });

  new T($('#vinhaManifesto'), {
    semente: 12, tema: 'escuro', flores: 0.34, abertas: 0.4, alvoClique: $('#manifesto'),
    guias: function () {
      if (innerWidth > 960) return [
        { pts: [[.25, 1.02], [.4, .82], [.22, .62], [.42, .43], [.24, .24], [.44, .04], [.62, -.02]], l: 3 },
        { pts: [[.62, 1.02], [.7, .86], [.56, .72], [.66, .6]], s0: 80, l: 2 }
      ];
      return [{ pts: [[-.02, .5], [.2, .3], [.42, .55], [.62, .3], [.84, .5], [1.02, .28]], l: 2.6 }];
    }
  });

  new T($('#vinhaEstante'), {
    semente: 77, tema: 'escuro', flores: 0.26, ramos: 0.25, gavinhas: 0.2, abertas: 0.5, alvoClique: $('#guias'),
    guias: [
      { pts: [[-.01, .44], [.14, .36], [.3, .46], [.5, .36], [.7, .45], [.86, .35], [1.01, .43]], l: 2.6 },
      { pts: [[.3, .46], [.31, .64], [.29, .8]], s0: 120, l: 1.4 },
      { pts: [[.7, .45], [.71, .62], [.69, .78]], s0: 260, l: 1.4 }
    ]
  });

  new T($('#vinhaContato'), {
    semente: 5, tema: 'escuro', flores: 0.32, alvoClique: $('#contato'),
    guias: function (w) {
      if (w > 760) return [
        { pts: [[.03, 1.02], [.09, .78], [.04, .55], [.11, .32], [.06, .08], [.14, -.02]], l: 3 },
        { pts: [[.97, 1.02], [.91, .78], [.96, .55], [.89, .32], [.94, .08], [.86, -.02]], s0: 30, l: 3 }
      ];
      return [
        { pts: [[-.02, .3], [.08, .18], [.04, .08], [.14, -.02]], l: 2.2 },
        { pts: [[1.02, .8], [.92, .9], [.97, .96], [.86, 1.02]], s0: 20, l: 2.2 }
      ];
    }
  });

  /* acompanhamento: a planta cresce mês a mês e só floresce no 4º */
  var acomp = new T($('#vinhaAcomp'), {
    semente: 23, cresce: 0, flores: 0.3, ramos: 0.3, abertas: 0, fecha: false, brotos: false,
    guias: [
      { pts: [[.5, 1.01], [.42, .86], [.58, .71], [.42, .56], [.58, .41], [.44, .26], [.55, .12], [.5, .02]], l: 3.2 },
      { pts: [[.52, 1.01], [.62, .9], [.56, .8]], s0: 30, l: 1.8 }
    ]
  });
  var NIVEL = [0.42, 0.64, 0.84, 1];
  var tabs = [].slice.call(document.querySelectorAll('.meses [role=tab]'));
  function mes(n, foco) {
    tabs.forEach(function (b, i) {
      var sim = i === n - 1;
      b.setAttribute('aria-selected', sim); b.tabIndex = sim ? 0 : -1;
      document.getElementById(b.getAttribute('aria-controls')).hidden = !sim;
      if (sim && foco) b.focus();
    });
    acomp.crescer(NIVEL[n - 1]);
    acomp.florir(n === 4);
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { mes(i + 1); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (e.key === 'Home') mes(1, true); else if (e.key === 'End') mes(4, true);
      else if (d) { mes((i + d + 4) % 4 + 1, true); e.preventDefault(); }
    });
  });
  new IntersectionObserver(function (es, ob) {
    if (es[0].isIntersecting) { mes(1); ob.disconnect(); }
  }, { threshold: 0.35 }).observe($('#vinhaAcomp'));

  /* ---------- abertura: os ramos floridos sobem de 0 a 100% ---------- */
  var abertura = $('#abertura'), num = $('#pct');
  function revelarSite() {
    document.documentElement.classList.remove('carregando');
    hero.crescer(1);
  }
  if (reduz) {
    abertura.remove(); revelarSite();
  } else {
    document.documentElement.classList.add('carregando');
    var vinhaA = new T($('#vinhaAbertura'), {
      semente: 3, tema: 'escuro', cresce: 0, flores: 0.34, abertas: 0, fecha: false, brotos: false, ramos: 0.24,
      guias: [
        { pts: [[.5, 1.01], [.44, .84], [.56, .68], [.45, .5], [.55, .33], [.47, .17], [.52, .03]], l: 3.4 },
        { pts: [[.52, 1.01], [.62, .88], [.54, .76], [.64, .62], [.6, .5]], s0: 70, l: 2.2 },
        { pts: [[.48, 1.01], [.38, .9], [.44, .8], [.35, .7]], s0: 120, l: 1.8 }
      ]
    });
    var DUR = 2900, ini = performance.now();
    (function q(t) {
      var u = Math.min(1, (t - ini) / DUR), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      num.textContent = Math.round(e * 100);
      vinhaA.crescer(e, true);
      if (u < 1) return requestAnimationFrame(q);
      vinhaA.florir(true);
      setTimeout(function () {
        abertura.classList.add('sai'); revelarSite();
        setTimeout(function () { abertura.remove(); }, 1100);
      }, 900);
    })(ini);
  }

  /* ---------- topo, menu e seção atual ---------- */
  var topo = $('#topo'), menu = $('#menu'), btn = $('#menuBtn'), flut = $('.flutuante');
  addEventListener('scroll', function () {
    topo.classList.toggle('rolou', scrollY > 10);
    flut.classList.toggle('ver', scrollY > innerHeight * 0.7);
  }, { passive: true });
  function fecharMenu() { menu.classList.remove('aberto'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Abrir menu'); }
  btn.addEventListener('click', function () {
    var abrir = !menu.classList.contains('aberto');
    menu.classList.toggle('aberto', abrir); btn.setAttribute('aria-expanded', abrir); btn.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) fecharMenu(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('aberto')) { fecharMenu(); btn.focus(); } });

  var links = [].slice.call(menu.querySelectorAll('a'));
  var obSecao = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) {
        if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['cuidado', 'acompanhamento', 'guias', 'sobre', 'avaliacoes', 'duvidas'].forEach(function (id) { obSecao.observe(document.getElementById(id)); });

  /* ---------- revelação suave no scroll ---------- */
  if (!reduz) {
    var obRev = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('ok'); obRev.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.cab, .area, .acomp__cab, .guia, .sobre__foto, .sobre__texto, .aval__nota, .aval, .faq, .contato__in, .manifesto blockquote').forEach(function (el) {
      el.classList.add('revela'); obRev.observe(el);
    });
  }
})();

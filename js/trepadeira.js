/* Trepadeira de jasmim-estrela em canvas.
   - cresce ao longo de "guias" (pontos relativos 0–1 do canvas);
   - botões de flor desabrocham quando o mouse passa perto;
   - gavinhas se esticam na direção do cursor, como quem procura apoio;
   - folhas balançam ao serem "roçadas";
   - um clique faz nascer um broto novo em direção ao ponto clicado. */
(function () {
  var TAU = Math.PI * 2;
  var reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ponteiro = { x: -9999, y: -9999, vx: 0, ativo: false, t: 0 };

  addEventListener('pointermove', function (e) {
    ponteiro.vx = Math.min(60, Math.hypot(e.clientX - ponteiro.x, e.clientY - ponteiro.y));
    ponteiro.x = e.clientX; ponteiro.y = e.clientY; ponteiro.ativo = true; ponteiro.t = performance.now();
  }, { passive: true });
  addEventListener('pointerdown', function (e) {
    ponteiro.x = e.clientX; ponteiro.y = e.clientY; ponteiro.ativo = true; ponteiro.t = performance.now();
  }, { passive: true });
  document.addEventListener('pointerleave', function () { ponteiro.ativo = false; });

  function rng(seed) {
    return function () {
      seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function difAng(a, b) { var d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function catmull(p, passo) {
    var out = [];
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      var n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / passo));
      for (var j = 0; j < n; j++) {
        var t = j / n, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(p[p.length - 1]);
    return out;
  }

  var CORES = {
    claro: { caule: '#6F5B44', folhas: ['#56613F', '#6B7260', '#46512F', '#7A845F'], nervura: 'rgba(245,241,234,.45)', petala: '#FFFDF8', contorno: 'rgba(140,115,85,.55)', miolo: '#E3C989', botao: '#E2A3B5', gavinha: '#7C8668' },
    escuro: { caule: '#A88C69', folhas: ['#7D8A66', '#93A07B', '#6A7856', '#A9B28E'], nervura: 'rgba(28,26,23,.35)', petala: '#FBF7EE', contorno: 'rgba(28,26,23,0)', miolo: '#E8CF8E', botao: '#E7AFC0', gavinha: '#A9B28E' }
  };

  function Trepadeira(canvas, o) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.o = Object.assign({ guias: [], semente: 7, flores: 0.3, gavinhas: 0.14, ramos: 0.18, escala: 1, abertas: 0.55, tema: 'claro', brotos: true, cresce: 1, alvoClique: null }, o);
    this.cor = CORES[this.o.tema];
    this.G = 0; this.Galvo = 0; this.frac = this.o.cresce; this.brotos = []; this.visivel = false; this.t0 = performance.now(); this.ultimoFecha = 0;
    this.medir();
    var self = this;
    new ResizeObserver(function () { self.medir(); }).observe(canvas);
    new IntersectionObserver(function (es) { self.visivel = es[0].isIntersecting; if (self.visivel) self.rodar(); }, { rootMargin: '80px' }).observe(canvas);
    if (this.o.brotos && this.o.alvoClique && !reduz) {
      this.o.alvoClique.addEventListener('click', function (e) {
        if (e.target.closest('a,button,input,label,summary,select,textarea')) return;
        self.brotar(e.clientX, e.clientY);
      });
    }
  }

  Trepadeira.prototype.medir = function () {
    var r = this.c.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if (Math.abs(r.width - this.w) < 2 && Math.abs(r.height - this.h) < 2) return;
    var dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = r.width; this.h = r.height; this.dpr = dpr;
    this.c.width = Math.round(r.width * dpr); this.c.height = Math.round(r.height * dpr);
    var cheio = this.total && this.G >= this.total - 1;
    this.construir();
    this.Galvo = this.frac * this.total;
    this.G = (cheio || reduz) ? this.Galvo : Math.min(this.G, this.Galvo);
    this.desenhar(performance.now());
  };

  Trepadeira.prototype.construir = function () {
    this.R = rng(this.o.semente);
    this.caules = []; this.itens = []; this.brotos = [];
    var esc = this.o.escala * clamp(Math.min(this.w, this.h) / 420, 0.7, 1.15);
    this.esc = esc;
    var self = this;
    var guias = typeof this.o.guias === 'function' ? this.o.guias(this.w, this.h) : this.o.guias;
    guias.forEach(function (g) {
      var pts = g.pts.map(function (p) { return [p[0] * self.w, p[1] * self.h]; });
      self.caule(pts, (g.s0 || 0) * esc, (g.l || 2.6) * esc, 0);
    });
    this.total = 0;
    this.caules.forEach(function (c) { self.total = Math.max(self.total, c.s0 + c.L); });
    this.itens.forEach(function (it) { self.total = Math.max(self.total, it.s + 20); });
  };

  Trepadeira.prototype.caule = function (guia, s0, larg, prof) {
    var R = this.R, esc = this.esc;
    var d = catmull(guia, 4), cum = [0];
    for (var i = 1; i < d.length; i++) cum.push(cum[i - 1] + Math.hypot(d[i][0] - d[i - 1][0], d[i][1] - d[i - 1][1]));
    // ondulação natural ao longo do caule
    var amp = (prof ? 2 : 4.5) * esc, fr = 0.02 + R() * 0.012, fase = R() * TAU;
    var ond = d.map(function (p, i) {
      var a = d[Math.max(0, i - 1)], b = d[Math.min(d.length - 1, i + 1)];
      var tx = b[0] - a[0], ty = b[1] - a[1], m = Math.hypot(tx, ty) || 1;
      var k = Math.sin(cum[i] * fr + fase) * amp * Math.min(1, cum[i] / 30);
      return [p[0] - ty / m * k, p[1] + tx / m * k];
    });
    var c = { p: ond, cum: cum, L: cum[cum.length - 1], s0: s0, larg: larg, prof: prof };
    this.caules.push(c);

    var lado = R() < 0.5 ? 1 : -1, gap = 22 * esc;
    for (var s = 8 + R() * 10; s < c.L - 3; s += gap * (0.7 + R() * 0.6)) {
      var k = this.indice(c, s), ang = this.tangente(c, k);
      lado = -lado;
      this.itens.push({ t: 'folha', c: c, k: k, s: s0 + s, ang: ang + lado * (0.75 + R() * 0.55), tam: (10 + R() * 9) * esc * (prof ? 0.8 : 1), cor: this.cor.folhas[(R() * 4) | 0], off: 0, vel: 0, fase: R() * TAU });
      var r = R();
      if (r < this.o.flores) this.cacho(c, k, s0 + s, ang - lado * 0.9);
      else if (r < this.o.flores + this.o.gavinhas) this.itens.push({ t: 'gav', c: c, k: k, s: s0 + s, ang: ang - lado * 0.7, comp: (16 + R() * 14) * esc, giro: lado, alc: 0, fase: R() * TAU });
      if (prof === 0 && R() < this.o.ramos && s < c.L - 50 * esc) {
        var p = c.p[k], l = (45 + R() * 70) * esc, ab = 0.45 + R() * 0.5, cv = 0.3 + R() * 0.5;
        // tenta um lado; se o ramo invadir a área protegida (ex.: o rosto na foto), tenta o outro
        for (var tent = 0; tent < 2; tent++) {
          var ld = tent ? -lado : lado, a = ang + ld * ab, a2 = a + ld * cv;
          var q1 = [p[0] + Math.cos(a) * l * 0.5, p[1] + Math.sin(a) * l * 0.5];
          var q2 = [q1[0] + Math.cos(a2) * l * 0.5, q1[1] + Math.sin(a2) * l * 0.5];
          if (this.protegido(q1) || this.protegido(q2)) continue;
          this.caule([p, this.dentro(q1), this.dentro(q2)], s0 + s, larg * 0.55, 1);
          break;
        }
      }
    }
    if (prof > 0 && R() < 0.7) this.cacho(c, c.p.length - 1, s0 + c.L, this.tangente(c, c.p.length - 1));
    return c;
  };

  Trepadeira.prototype.cacho = function (c, k, s, ang) {
    var R = this.R, n = 1 + ((R() * 3) | 0), esc = this.esc;
    for (var i = 0; i < n; i++) {
      var a = ang + (i - (n - 1) / 2) * 0.75 + (R() - 0.5) * 0.3, ped = (5 + R() * 9) * esc;
      var aberta = R() < this.o.abertas ? 1 : 0;
      this.itens.push({ t: 'flor', c: c, k: k, s: s + 6 + i * 4, ang: a, ped: ped, r: (6.5 + R() * 3) * esc, abre: aberta, alvo: aberta, giro: R() * TAU, fase: R() * TAU });
    }
  };

  Trepadeira.prototype.protegido = function (p) {
    var z = this.o.evitar;
    return !!z && p[0] > z[0] * this.w && p[0] < z[2] * this.w && p[1] > z[1] * this.h && p[1] < z[3] * this.h;
  };
  Trepadeira.prototype.dentro = function (p) { return [clamp(p[0], 6, this.w - 6), clamp(p[1], 6, this.h - 6)]; };
  Trepadeira.prototype.indice = function (c, s) { var i = 0; while (i < c.cum.length - 1 && c.cum[i] < s) i++; return i; };
  Trepadeira.prototype.tangente = function (c, k) {
    var a = c.p[Math.max(0, k - 2)], b = c.p[Math.min(c.p.length - 1, k + 2)];
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  };

  /* grow: 0–1. "ja" pula a animação de crescimento. */
  Trepadeira.prototype.crescer = function (f, ja) {
    this.frac = f; this.Galvo = f * this.total;
    if (ja || reduz) this.G = this.Galvo;
    this.rodar();
  };
  Trepadeira.prototype.florir = function (sim) {
    this.itens.forEach(function (it) { if (it.t === 'flor') it.alvo = sim ? 1 : 0; });
    this.rodar();
  };

  Trepadeira.prototype.brotar = function (cx, cy) {
    var r = this.c.getBoundingClientRect(), x = cx - r.left, y = cy - r.top;
    if (x < -40 || y < -40 || x > this.w + 40 || y > this.h + 40) return;
    var melhor = null, dm = 280 * 280;
    for (var i = 0; i < this.caules.length; i++) {
      var c = this.caules[i];
      for (var k = 0; k < c.p.length; k += 3) {
        if (c.s0 + c.cum[k] > this.G) break;
        var dx = c.p[k][0] - x, dy = c.p[k][1] - y, d = dx * dx + dy * dy;
        if (d < dm) { dm = d; melhor = [c, k]; }
      }
    }
    if (!melhor) return;
    var p = melhor[0].p[melhor[1]], alvo = this.dentro([x, y]);
    var mx = (p[0] + alvo[0]) / 2, my = (p[1] + alvo[1]) / 2, nx = -(alvo[1] - p[1]) * 0.25, ny = (alvo[0] - p[0]) * 0.25;
    var antes = this.itens.length, s0 = this.G;
    this.R = rng((x * 31 + y * 17) | 0);
    var c = this.caule([p, this.dentro([mx + nx, my + ny]), alvo], s0, 1.5 * this.esc, 2);
    if (this.itens[this.itens.length - 1].t !== 'flor') this.cacho(c, c.p.length - 1, s0 + c.L, this.tangente(c, c.p.length - 1));
    this.itens.slice(antes).forEach(function (it) { if (it.t === 'flor') { it.abre = 0; it.alvo = 1; } });
    this.brotos.push({ c: c, itens: this.itens.slice(antes) });
    if (this.brotos.length > 6) {
      var velho = this.brotos.shift();
      this.caules.splice(this.caules.indexOf(velho.c), 1);
      this.itens = this.itens.filter(function (it) { return velho.itens.indexOf(it) < 0; });
    }
    this.total = Math.max(this.total, s0 + c.L + 30);
    this.Galvo = this.total; this.frac = 1;
    this.rodar();
  };

  Trepadeira.prototype.rodar = function () {
    if (this.loop || !this.visivel) { if (reduz) this.desenhar(performance.now()); return; }
    if (reduz) { this.desenhar(performance.now()); return; }
    var self = this;
    this.loop = true;
    (function q(t) {
      if (!self.visivel) { self.loop = false; return; }
      self.passo(t); self.desenhar(t);
      requestAnimationFrame(q);
    })(performance.now());
  };

  Trepadeira.prototype.passo = function (t) {
    var dif = this.Galvo - this.G;
    if (Math.abs(dif) > 0.5) this.G += clamp(dif * 0.06, -14, 14) + (dif > 0 ? 0.6 : -0.6);
    else this.G = this.Galvo;

    var r = this.c.getBoundingClientRect(), ativo = ponteiro.ativo && t - ponteiro.t < 4000;
    var mx = ponteiro.x - r.left, my = ponteiro.y - r.top, forca = 0.45 + ponteiro.vx / 50;
    ponteiro.vx *= 0.92;

    // de tempos em tempos uma flor volta a ser botão, para sempre haver o que desabrochar
    if (t - this.ultimoFecha > 2600) {
      this.ultimoFecha = t;
      var abertas = this.itens.filter(function (it) { return it.t === 'flor' && it.alvo === 1; });
      if (abertas.length > 3 && this.o.fecha !== false) abertas[(Math.random() * abertas.length) | 0].alvo = 0;
    }

    for (var i = 0; i < this.itens.length; i++) {
      var it = this.itens[i], p = it.c.p[it.k], dx = p[0] - mx, dy = p[1] - my, d = Math.hypot(dx, dy);
      if (it.t === 'folha') {
        var alvo = 0;
        if (ativo && d < 120) {
          var cruz = Math.cos(it.ang) * dy - Math.sin(it.ang) * dx;
          alvo = (cruz > 0 ? -1 : 1) * Math.pow(1 - d / 120, 1.5) * forca;
        }
        it.vel += (alvo - it.off) * 0.07; it.vel *= 0.86; it.off += it.vel;
      } else if (it.t === 'flor') {
        if (ativo && d < 85) it.alvo = 1;
        it.abre += (it.alvo - it.abre) * (it.alvo > it.abre ? 0.07 : 0.025);
      } else {
        it.alc += ((ativo && d < 170 ? 1 : 0) - it.alc) * 0.05;
        it.mira = Math.atan2(my - p[1], mx - p[0]);
      }
    }
  };

  Trepadeira.prototype.desenhar = function (t) {
    var x = this.ctx, G = this.G, cor = this.cor;
    x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    x.clearRect(0, 0, this.w, this.h);
    x.lineCap = 'round'; x.lineJoin = 'round';

    for (var i = 0; i < this.caules.length; i++) {
      var c = this.caules[i];
      if (G <= c.s0) continue;
      var vis = G - c.s0, n = c.p.length;
      x.strokeStyle = cor.caule;
      for (var k = 0; k < n - 1; k += 3) {
        if (c.cum[k] > vis) break;
        var fim = Math.min(n - 1, k + 3);
        var u = c.cum[k] / c.L, ponta = clamp((vis - c.cum[k]) / 26, 0.25, 1);
        x.lineWidth = Math.max(0.6, c.larg * (1 - u * 0.55) * ponta);
        x.beginPath(); x.moveTo(c.p[k][0], c.p[k][1]);
        for (var j = k + 1; j <= fim && c.cum[j] <= vis; j++) x.lineTo(c.p[j][0], c.p[j][1]);
        x.stroke();
      }
    }

    for (var m = 0; m < this.itens.length; m++) {
      var it = this.itens[m];
      if (G < it.s) continue;
      var g = clamp((G - it.s) / 28, 0, 1), e = 1 - Math.pow(1 - g, 3), p = it.c.p[it.k];
      if (it.t === 'folha') this.folha(p[0], p[1], it.ang + Math.sin(t * 0.0011 + it.fase) * 0.06 + it.off, it.tam * e, it.cor);
      else if (it.t === 'flor') {
        var a = it.ang + Math.sin(t * 0.0009 + it.fase) * 0.05;
        var fx = p[0] + Math.cos(a) * it.ped * e, fy = p[1] + Math.sin(a) * it.ped * e;
        x.strokeStyle = cor.gavinha; x.lineWidth = 0.8;
        x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(fx, fy); x.stroke();
        this.flor(fx, fy, a, it.r * e, it.abre, it.giro + t * 0.00004);
      } else this.gavinha(p[0], p[1], it, e);
    }
  };

  Trepadeira.prototype.folha = function (px, py, a, L, cor) {
    if (L < 0.5) return;
    var x = this.ctx, W = L * 0.4;
    x.save(); x.translate(px, py); x.rotate(a);
    x.strokeStyle = this.cor.caule; x.lineWidth = 0.8;
    x.beginPath(); x.moveTo(0, 0); x.lineTo(L * 0.2, 0); x.stroke();
    x.translate(L * 0.2, 0);
    x.beginPath(); x.moveTo(0, 0);
    x.bezierCurveTo(L * 0.25, -W, L * 0.72, -W * 0.85, L, 0);
    x.bezierCurveTo(L * 0.72, W * 0.85, L * 0.25, W, 0, 0);
    x.fillStyle = cor; x.fill();
    x.strokeStyle = this.cor.nervura; x.lineWidth = 0.6;
    x.beginPath(); x.moveTo(L * 0.05, 0); x.lineTo(L * 0.82, 0); x.stroke();
    x.restore();
  };

  /* jasmim-estrela: cinco pétalas torcidas em cata-vento; fechado é um botão rosado */
  Trepadeira.prototype.flor = function (px, py, a, r, abre, giro) {
    if (r < 0.5) return;
    var x = this.ctx, cor = this.cor;
    x.save(); x.translate(px, py);
    if (abre < 0.3) {
      var L = r * 1.35, W = r * 0.3, gr;
      x.rotate(a);
      gr = x.createLinearGradient(0, 0, L, 0); gr.addColorStop(0, cor.petala); gr.addColorStop(1, cor.botao);
      x.beginPath(); x.moveTo(0, 0);
      x.bezierCurveTo(L * 0.3, -W, L * 0.75, -W * 1.2, L, 0);
      x.bezierCurveTo(L * 0.75, W * 1.2, L * 0.3, W, 0, 0);
      x.fillStyle = gr; x.fill();
      x.strokeStyle = cor.contorno; x.lineWidth = 0.6; x.stroke();
      x.restore(); return;
    }
    var k = (abre - 0.3) / 0.7, s = r * (0.45 + 0.55 * k);
    x.rotate(giro + (1 - k) * 0.8);
    x.fillStyle = cor.petala; x.strokeStyle = cor.contorno; x.lineWidth = 0.6;
    for (var i = 0; i < 5; i++) {
      x.save(); x.rotate(i * TAU / 5);
      x.beginPath(); x.moveTo(0, 0);
      x.bezierCurveTo(s * 0.25, -s * 0.42, s * 0.85, -s * 0.5, s, -s * 0.1);
      x.bezierCurveTo(s * 0.85, s * 0.16, s * 0.4, s * 0.14, 0, 0);
      x.fill(); x.stroke();
      x.restore();
    }
    x.fillStyle = cor.miolo;
    x.beginPath(); x.arc(0, 0, Math.max(0.8, s * 0.16), 0, TAU); x.fill();
    x.restore();
  };

  /* gavinha: espiral que se desenrola e mira o cursor quando ele chega perto */
  Trepadeira.prototype.gavinha = function (px, py, it, e) {
    var x = this.ctx, n = 22, comp = it.comp * e * (1 + it.alc * 0.7), passo = comp / n, a = it.ang, cx = px, cy = py;
    x.strokeStyle = this.cor.gavinha; x.lineWidth = 0.9;
    x.beginPath(); x.moveTo(cx, cy);
    for (var i = 1; i <= n; i++) {
      var u = i / n;
      a += it.giro * (1 - it.alc) * u * 0.62;
      if (it.alc > 0.01) a += difAng(it.mira, a) * it.alc * 0.22;
      cx += Math.cos(a) * passo; cy += Math.sin(a) * passo;
      x.lineTo(cx, cy);
    }
    x.stroke();
  };

  window.Trepadeira = Trepadeira;
})();

/* HBR AX Summit 부스 설문 v3 - 외부 JS (CMS의 External JS URL에 이 파일의 URL 입력) */
(function () {
  'use strict';
  function init() {
    var root = document.getElementById('hbr');
    if (!root || root.getAttribute('data-ready')) return;
    root.setAttribute('data-ready', '1');

    var $ = function (id) { return document.getElementById(id); };
    var all = function (sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };
    var endpoint = root.getAttribute('data-endpoint') || '';
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    var TOTAL = 9; // 필수 단계: Q1~Q7, 기본정보, 동의

    function val(n) { var e = root.querySelector('input[name="' + n + '"]:checked'); return e ? e.value : ''; }
    function vals(n) { return all('input[name="' + n + '"]:checked').map(function (e) { return e.value; }); }
    function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    /* ================= 사원증 진자 물리 ================= */
    var pends = [];
    function addPend(el, opt) {
      var p = { el: el, th: 0, w: 0, drag: false, tgt: 0, ph: Math.random() * 6.28, amp: (opt && opt.amp) || 0.018 };
      pends.push(p);
      return p;
    }
    var running = false;
    function loop(t) {
      if (document.hidden) { running = false; return; }
      for (var i = 0; i < pends.length; i++) {
        var p = pends[i];
        if (!p.el.offsetParent) continue; // 숨겨진 요소는 건너뜀
        if (p.drag) {
          var prev = p.th;
          p.th += (p.tgt - p.th) * 0.45;
          p.w = p.th - prev;
        } else {
          p.w += -0.0078 * p.th;   // 복원력 (주기 약 1.2초)
          p.w *= 0.968;            // 감쇠
          p.th += p.w;
        }
        var idle = reduce ? 0 : p.amp * Math.sin(t * 0.0017 + p.ph);
        p.el.style.transform = 'rotate(' + (p.th + idle).toFixed(4) + 'rad)';
      }
      requestAnimationFrame(loop);
    }
    function start() { if (!running && !reduce) { running = true; requestAnimationFrame(loop); } }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });

    var suppressClick = false;
    function bindDrag(target, p, len) {
      var s = null;
      target.addEventListener('pointerdown', function (e) {
        if (reduce || (e.button && e.button > 0)) return;
        s = { x: e.clientX, y: e.clientY, th: p.th, id: e.pointerId, moved: false };
      });
      target.addEventListener('pointermove', function (e) {
        if (!s || e.pointerId !== s.id) return;
        var dx = e.clientX - s.x, dy = e.clientY - s.y;
        if (!s.moved) {
          if (Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy)) {
            s.moved = true; p.drag = true; target.classList.add('grab');
            try { target.setPointerCapture(s.id); } catch (err) {}
          } else if (Math.abs(dy) > 10) { s = null; return; }
        }
        if (s.moved) { p.tgt = clamp(s.th + dx / len, -0.8, 0.8); if (e.cancelable) e.preventDefault(); }
      });
      function end() {
        if (s && s.moved) {
          p.drag = false; target.classList.remove('grab');
          suppressClick = true; setTimeout(function () { suppressClick = false; }, 300);
          buzz(6);
        }
        s = null;
      }
      target.addEventListener('pointerup', end);
      target.addEventListener('pointercancel', end);
      target.addEventListener('click', function (e) {
        if (suppressClick) { e.preventDefault(); e.stopPropagation(); }
      }, true);
    }

    /* ================= Q1: 사원증 선택 ================= */
    var cardsWrap = $('hbr-q1');
    var cards = all('#hbr-q1 .card');
    var cardPend = [];
    cards.forEach(function (c, i) {
      var p = addPend(c.querySelector('.hang'), { amp: 0.02 });
      cardPend[i] = p;
      bindDrag(c, p, 190);
    });
    start();

    function burst(host) {
      if (reduce) return;
      var ac = getComputedStyle(host).getPropertyValue('--ac') || '#0B5CD5';
      var cols = [ac, '#FFC84A', '#ffffff', ac];
      for (var i = 0; i < 14; i++) {
        var sp = document.createElement('span');
        var a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
        var d = 44 + Math.random() * 40;
        sp.className = 'hbr-burst';
        sp.style.setProperty('--bx', (Math.cos(a) * d).toFixed(1) + 'px');
        sp.style.setProperty('--by', (Math.sin(a) * d).toFixed(1) + 'px');
        sp.style.background = cols[i % cols.length];
        host.appendChild(sp);
        (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 820); })(sp);
      }
    }

    var steps = all('#hbr-steps li');
    function setSteps(stage) { // 0: 선택 전, 1: 설문 중, 2: 모두 완료
      steps[0].className = stage >= 1 ? 'ok' : 'on';
      steps[1].className = stage >= 2 ? 'ok' : (stage === 1 ? 'on' : '');
      steps[2].className = stage >= 2 ? 'on' : '';
    }

    all('#hbr-q1 input').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var card = inp.closest('.card');
        var idx = cards.indexOf(card);
        cards.forEach(function (x, i) {
          x.classList.remove('on');
          if (i !== idx) cardPend[i].w += (i < idx ? -1 : 1) * 0.03; // 옆 사원증도 살짝 흔들림
        });
        void card.offsetWidth;
        card.classList.add('on');
        cardsWrap.classList.add('has-pick');
        cardPend[idx].w += (Math.random() < 0.5 ? -1 : 1) * 0.1;
        var h = $('hbr-q1msg');
        h.classList.remove('err');
        h.innerHTML = '<b>' + (card.getAttribute('data-name') || '') + '</b>, 영입 후보로 확정!';
        var go = $('hbr-go');
        go.classList.add('ready');
        go.textContent = '설문 이어가기';
        burst(card.querySelector('.badge'));
        buzz([12, 30, 12]);
        progress();
      });
    });

    $('hbr-go').addEventListener('click', function () {
      if (!val('q1')) {
        var h = $('hbr-q1msg');
        h.classList.remove('err'); void h.offsetWidth; h.classList.add('err');
        h.textContent = '먼저 영입하고 싶은 AI 팀원의 사원증을 골라 주세요';
        cardPend.forEach(function (p, i) { p.w += (i - 1 || 0.5) * 0.05; });
        buzz([20, 40, 20]);
        return;
      }
      root.querySelector('[data-q="q2"]').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /* ================= Q3 / Q4 보조 동작 ================= */
    var q3 = all('#hbr-q3 input');
    q3.forEach(function (i) {
      i.addEventListener('change', function () {
        if (!i.checked) return;
        if (i.getAttribute('data-excl')) q3.forEach(function (x) { if (x !== i) x.checked = false; });
        else q3.forEach(function (x) { if (x.getAttribute('data-excl')) x.checked = false; });
      });
    });
    var oth = $('hbr-q4other');
    oth.addEventListener('change', function () {
      $('hbr-q4etcWrap').hidden = !oth.checked;
      if (oth.checked) $('hbr-q4etc').focus();
    });

    /* ================= 진행률 ================= */
    function answered(q) {
      var el = root.querySelector('input[name="' + q + '"]:checked');
      if (q === 'q4' && el && oth.checked && !$('hbr-q4etc').value.trim()) return false;
      return !!el;
    }
    function infoOk() { return !!($('hbr-nm').value.trim() && $('hbr-org').value.trim() && EMAIL.test($('hbr-em').value.trim())); }
    var bar = $('hbr-prog'), hero = $('hbr-hero');
    function progress() {
      var n = val('q1') ? 1 : 0;
      ['q2', 'q3', 'q4', 'q5', 'q6', 'q7'].forEach(function (q) {
        var ok = answered(q), el = root.querySelector('[data-q="' + q + '"]');
        if (ok) { n++; el.classList.remove('err'); }
        el.classList.toggle('done', ok);
      });
      var iok = infoOk(), cok = $('hbr-c1').checked;
      if (iok) n++;
      if (cok) n++;
      root.querySelector('[data-q="info"]').classList.toggle('done', iok);
      root.querySelector('[data-q="consent"]').classList.toggle('done', cok);
      root.querySelector('[data-q="q8"]').classList.toggle('done', !!$('hbr-q8').value.trim());
      $('hbr-progbar').style.width = (n / TOTAL * 100) + '%';
      $('hbr-progtxt').textContent = n + '/' + TOTAL;
      bar.classList.toggle('full', n === TOTAL);
      $('hbr-submit').textContent = n === TOTAL ? '사원증 발급받기' : '제출하기';
      setSteps(n === TOTAL ? 2 : (val('q1') ? 1 : 0));
    }
    function onScroll() {
      bar.classList.toggle('show', hero.getBoundingClientRect().bottom < 120 && !$('hbr-survey').hidden);
    }
    root.addEventListener('change', progress);
    root.addEventListener('input', progress);
    window.addEventListener('scroll', onScroll, { passive: true });
    progress(); onScroll();

    /* 단일 선택 → 다음 미응답 문항으로 */
    ['q2', 'q5', 'q6', 'q7'].forEach(function (q) {
      all('input[name="' + q + '"]').forEach(function (i) {
        i.addEventListener('change', function () {
          buzz(8);
          var nx = root.querySelector('[data-q="' + q + '"]').nextElementSibling;
          if (!nx || !nx.classList.contains('q') || nx.querySelector('input:checked')) return;
          setTimeout(function () { nx.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 320);
        });
      });
    });

    /* ================= 제출 ================= */
    var sending = false;
    $('hbr-submit').addEventListener('click', function () {
      if (sending) return;
      var ok = true, first = null;
      function mark(sel, bad) {
        var el = root.querySelector(sel);
        el.classList.remove('err');
        if (bad) { void el.offsetWidth; el.classList.add('err'); ok = false; first = first || el; }
      }
      var q1 = val('q1');
      if (!q1) {
        ok = false;
        var h = $('hbr-q1msg');
        h.classList.remove('err'); void h.offsetWidth; h.classList.add('err');
        h.textContent = '먼저 영입하고 싶은 AI 팀원의 사원증을 골라 주세요';
        first = hero;
      }
      ['q2', 'q5', 'q6', 'q7'].forEach(function (q) { mark('[data-q="' + q + '"]', !val(q)); });
      mark('[data-q="q3"]', !vals('q3').length);
      var etc = $('hbr-q4etc').value.trim();
      mark('[data-q="q4"]', !vals('q4').length || (oth.checked && !etc));
      var nm = $('hbr-nm').value.trim(), org = $('hbr-org').value.trim(), em = $('hbr-em').value.trim();
      mark('[data-q="info"]', !nm || !org || !EMAIL.test(em));
      mark('[data-q="consent"]', !$('hbr-c1').checked);
      if (!ok) { buzz([20, 40, 20]); first.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }

      var data = {
        submitted_at: new Date().toISOString(),
        q1_ai_member: q1,
        q2_employees: val('q2'),
        q3_current_ai: vals('q3').join(', '),
        q4_tasks: vals('q4').join(', '),
        q4_other: oth.checked ? etc : '',
        q5_data_state: val('q5'),
        q6_agent_plan: val('q6'),
        q7_next_step: val('q7'),
        q8_comment: $('hbr-q8').value.trim(),
        name: nm,
        company: org,
        email: em,
        consent_privacy: 'Y',
        consent_marketing: $('hbr-c2').checked ? 'Y' : 'N'
      };

      sending = true;
      $('hbr-submit').disabled = true;
      if (endpoint) {
        try {
          var body = new URLSearchParams();
          Object.keys(data).forEach(function (k) { body.append(k, data[k]); });
          fetch(endpoint, { method: 'POST', body: body, mode: 'no-cors', keepalive: true }).catch(function () {});
        } catch (e) { /* 전송 실패해도 결과 화면은 표시 */ }
      } else if (window.console) {
        console.log('[HBR survey] data-endpoint 미설정 - 미전송', data);
      }
      showResult(q1);
    });

    /* ================= 결과: 사원증 발급 ================= */
    function confetti() {
      if (reduce) return;
      var wrap = document.createElement('div');
      wrap.className = 'hbr-confetti';
      var cols = ['#FFC84A', '#0B5CD5', '#F2672F', '#6D4AFF', '#C2185B', '#12A36B', '#ffffff'];
      for (var i = 0; i < 70; i++) {
        var c = document.createElement('i');
        c.style.left = (Math.random() * 100).toFixed(1) + '%';
        c.style.background = cols[i % cols.length];
        c.style.setProperty('--x', (Math.random() * 140 - 70).toFixed(0) + 'px');
        c.style.setProperty('--r', (360 + Math.random() * 720).toFixed(0) + 'deg');
        c.style.setProperty('--d', (1.8 + Math.random() * 1.5).toFixed(2) + 's');
        c.style.setProperty('--w', (Math.random() * 0.6).toFixed(2) + 's');
        wrap.appendChild(c);
      }
      document.body.appendChild(wrap);
      setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 4200);
    }
    function pad(n) { return ('0' + n).slice(-2); }
    function showResult(k) {
      var t = new Date();
      var ds = t.getFullYear() + '.' + pad(t.getMonth() + 1) + '.' + pad(t.getDate());
      all('.js-date').forEach(function (el) { el.textContent = ds; });
      all('.js-id').forEach(function (el) {
        el.textContent = 'AX-' + (el.getAttribute('data-code') || 'AI') + '-' + String(t.getFullYear()).slice(-2) + pad(t.getMonth() + 1) + '-' + (100 + Math.floor(Math.random() * 900));
      });
      $('hbr-survey').hidden = true;
      bar.classList.remove('show');
      $('hbr-result').hidden = false;
      $('hbr-issuing').hidden = false;
      all('#hbr-result .res').forEach(function (r) { r.hidden = true; });
      $('hbr-booth').hidden = true;
      window.scrollTo(0, 0);

      setTimeout(function () {
        $('hbr-issuing').hidden = true;
        var res = null;
        all('#hbr-result .res').forEach(function (r) {
          var on = r.getAttribute('data-k') === k;
          r.hidden = !on;
          if (on) res = r;
        });
        $('hbr-booth').hidden = false;
        window.scrollTo(0, 0);
        if (res) {
          var sw = res.querySelector('.r-swing');
          var p = addPend(sw, { amp: 0.012 });
          setTimeout(function () { p.w += 0.07; }, 650); // 떨어진 뒤 흔들림
          bindDrag(sw, p, 320);
          start();
          setTimeout(function () { buzz([30, 60, 30]); confetti(); }, 1050); // 합격 도장 타이밍
        }
      }, reduce ? 200 : 1350);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

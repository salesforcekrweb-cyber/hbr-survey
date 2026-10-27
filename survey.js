/* HBR AX Summit 부스 설문 - 외부 JS (CMS의 External JS URL에 이 파일의 URL 입력) */
(function () {
  'use strict';
  function init() {
    var root = document.getElementById('hbr');
    if (!root || root.getAttribute('data-ready')) return;
    root.setAttribute('data-ready', '1');

    var $ = function (id) { return document.getElementById(id); };
    var all = function (sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };
    var endpoint = root.getAttribute('data-endpoint') || '';

    // Q1 카드 선택
    var cards = all('#hbr-q1 .card');
    cards.forEach(function (c) {
      c.addEventListener('click', function () {
        cards.forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on');
        c.querySelector('input').checked = true;
        var h = $('hbr-q1msg');
        h.classList.remove('err');
        h.innerHTML = '선택 완료! 아래로 스크롤해 설문을 이어가 주세요';
      });
    });

    // Q3: '아직 없어요'는 단독 선택
    var q3 = all('#hbr-q3 input');
    q3.forEach(function (i) {
      i.addEventListener('change', function () {
        if (!i.checked) return;
        if (i.getAttribute('data-excl')) {
          q3.forEach(function (x) { if (x !== i) x.checked = false; });
        } else {
          q3.forEach(function (x) { if (x.getAttribute('data-excl')) x.checked = false; });
        }
      });
    });

    // Q4 '기타' 입력창 토글
    var oth = $('hbr-q4other');
    oth.addEventListener('change', function () {
      $('hbr-q4etcWrap').hidden = !oth.checked;
      if (oth.checked) $('hbr-q4etc').focus();
    });

    function val(n) {
      var e = root.querySelector('input[name="' + n + '"]:checked');
      return e ? e.value : '';
    }
    function vals(n) {
      return all('input[name="' + n + '"]:checked').map(function (e) { return e.value; });
    }

    // 진행률 (필수 9단계: Q1~Q7, 기본정보, 동의)
    var TOTAL = 9;
    function done() {
      var n = 0;
      if (val('q1')) n++;
      ['q2', 'q3', 'q4', 'q5', 'q6', 'q7'].forEach(function (q) {
        var el = root.querySelector('input[name="' + q + '"]:checked');
        if (q === 'q4' && el && oth.checked && !$('hbr-q4etc').value.trim()) el = null;
        if (el) n++;
      });
      if ($('hbr-nm').value.trim() && $('hbr-org').value.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test($('hbr-em').value.trim())) n++;
      if ($('hbr-c1').checked) n++;
      return n;
    }
    function progress() {
      var n = done();
      $('hbr-progbar').style.width = (n / TOTAL * 100) + '%';
      $('hbr-progtxt').textContent = n + '/' + TOTAL;
    }
    root.addEventListener('change', progress);
    root.addEventListener('input', progress);
    var prog = $('hbr-prog'), hero = $('hbr-hero');
    function onScroll() {
      prog.classList.toggle('show', hero.getBoundingClientRect().bottom < 40 && !$('hbr-survey').hidden);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    progress(); onScroll();

    // 단일 선택 후 다음 미응답 문항으로 자동 이동
    function nextQ(from) {
      var el = from.nextElementSibling;
      return el && el.classList.contains('q') ? el : null;
    }
    function autoNext(fromEl) {
      var nx = nextQ(fromEl);
      if (!nx || nx.querySelector('input:checked')) return;
      setTimeout(function () { nx.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 280);
    }
    ['q2', 'q5', 'q6', 'q7'].forEach(function (q) {
      all('input[name="' + q + '"]').forEach(function (i) {
        i.addEventListener('change', function () { autoNext(root.querySelector('[data-q="' + q + '"]')); });
      });
    });
    cards.forEach(function (c) {
      c.addEventListener('click', function () {
        var q2 = root.querySelector('[data-q="q2"]');
        if (q2 && !q2.querySelector('input:checked')) {
          setTimeout(function () { q2.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 450);
        }
      });
    });

    var sending = false;
    $('hbr-submit').addEventListener('click', function () {
      if (sending) return;
      var ok = true, first = null;
      function mark(sel, bad) {
        var el = root.querySelector(sel);
        el.classList.toggle('err', bad);
        if (bad) { ok = false; first = first || el; }
      }
      var q1 = val('q1');
      if (!q1) {
        ok = false;
        var h = $('hbr-q1msg');
        h.classList.add('err');
        h.textContent = '먼저 영입하고 싶은 AI 팀원을 골라 주세요';
        first = root.querySelector('.hero');
      }
      ['q2', 'q5', 'q6', 'q7'].forEach(function (q) { mark('[data-q="' + q + '"]', !val(q)); });
      mark('[data-q="q3"]', !vals('q3').length);
      var etc = $('hbr-q4etc').value.trim();
      mark('[data-q="q4"]', !vals('q4').length || (oth.checked && !etc));
      var nm = $('hbr-nm').value.trim(), org = $('hbr-org').value.trim(), em = $('hbr-em').value.trim();
      mark('[data-q="info"]', !nm || !org || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em));
      mark('[data-q="consent"]', !$('hbr-c1').checked);
      if (!ok) {
        first.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

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
          fetch(endpoint, { method: 'POST', body: body, mode: 'no-cors', keepalive: true })
            .catch(function () {});
        } catch (e) { /* 전송 실패해도 결과 화면은 표시 */ }
      } else if (window.console) {
        console.log('[HBR survey] data-endpoint 미설정 - 미전송', data);
      }
      showResult(q1);
    });

    function showResult(k) {
      all('#hbr-result .res').forEach(function (r) { r.hidden = r.getAttribute('data-k') !== k; });
      $('hbr-survey').hidden = true;
      $('hbr-result').hidden = false;
      prog.classList.remove('show');
      window.scrollTo(0, 0);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

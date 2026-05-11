/* ═══ CORNERS ═══ */
const tpl = document.getElementById('corner-tpl');
document.querySelectorAll('.corn').forEach(e => e.appendChild(tpl.content.cloneNode(true)));

/* ═══ STARS (decorative constellation) ═══ */
const _fillSVG = (() => {
  const S = [[18,28,1.1],[45,14,.75],[72,35,.95],[38,52,.55],[95,18,1.3],[120,42,.75],[155,22,.9],[180,48,.65],[210,30,1.1],[228,55,.85],[25,78,.75],[60,90,1.],[88,75,.65],[115,95,1.2],[140,70,.85],[170,85,.65],[200,72,1.],[222,95,.75],[10,125,.9],[40,140,.65],[75,115,1.1],[100,145,.75],[130,120,.9],[160,140,.65],[195,118,1.2],[218,142,.85],[12,175,.75],[50,195,1.],[82,170,.85],[110,190,.65],[145,175,1.1],[175,198,.75],[205,180,.9],[232,200,.65],[30,240,1.],[68,225,.75],[95,248,.85],[125,230,.65],[155,255,.9],[185,235,.75],[215,255,1.],[242,242,.65],[20,285,.85],[55,300,1.1],[85,278,.65],[115,295,.9],[148,280,.75],[178,305,.65],[208,285,1.1],[233,300,.85],[12,335,.75],[45,352,.9],[78,330,.65],[108,355,.85],[140,338,1.],[170,360,.65],[200,342,.85],[228,365,.75],[242,350,.9],[35,395,.75]];
  const L = [[0,1],[1,2],[2,4],[4,5],[7,8],[8,9],[10,11],[11,12],[12,13],[13,14],[15,16],[18,20],[20,21],[22,23],[24,25],[26,28],[28,29],[30,31],[34,35],[35,36],[38,39],[39,40],[42,43],[43,44],[45,46],[50,51],[51,52],[53,54],[57,58]];
  const NS = 'http://www.w3.org/2000/svg';
  return function (svg) {
    L.forEach(([a, b]) => {
      if (!S[a] || !S[b]) return;
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', S[a][0]);
      l.setAttribute('y1', S[a][1]);
      l.setAttribute('x2', S[b][0]);
      l.setAttribute('y2', S[b][1]);
      l.setAttribute('stroke', '#c9a84c');
      l.setAttribute('stroke-width', '.3');
      l.setAttribute('opacity', '.4');
      svg.appendChild(l);
    });
    S.forEach(([x, y, r]) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', x);
      c.setAttribute('cy', y);
      c.setAttribute('r', r);
      c.setAttribute('fill', '#c9a84c');
      svg.appendChild(c);
    });
  };
})();
document.querySelectorAll('.sf').forEach(_fillSVG);

/* ═══ STATE ═══ */
const TARGET_TOTAL = 30;
const TIMER_SECONDS = 30;
let POOL = [];
let TROLL = [];
let Q = [];
let TOTAL = 0;
let score = 0;
let qIdx = 0;
let answered = false;
let timerInterval = null;
let timeLeft = TIMER_SECONDS;

/* ═══ ELEMENTS ═══ */
const lobby = document.getElementById('lobby');
const dim = document.getElementById('dim');
const smodal = document.getElementById('smodal');
const quizScreen = document.getElementById('quizScreen');
const endScreen = document.getElementById('endScreen');
const spop = document.getElementById('spop');

/* ═══ QUESTION SELECTION ═══ */
function pickQuestions() {
  const shuffled = [...POOL].sort(() => Math.random() - .5);
  const troll = TROLL[Math.floor(Math.random() * TROLL.length)];
  // Deep-copy picked questions so pts can be re-balanced per round without mutating source data
  Q = [...shuffled.slice(0, 9), troll]
    .sort(() => Math.random() - .5)
    .map(q => ({ ...q, pts: q.pts }));
  normalizeToTarget();
  TOTAL = Q.reduce((s, q) => s + q.pts, 0);
}

// Adjust per-question pts so the round sum equals TARGET_TOTAL (30).
// Add +1 to random questions if short, subtract from highest-pts (>=2) if over.
function normalizeToTarget() {
  let sum = Q.reduce((s, q) => s + q.pts, 0);
  let guard = 200;
  while (sum !== TARGET_TOTAL && guard-- > 0) {
    if (sum < TARGET_TOTAL) {
      Q[Math.floor(Math.random() * Q.length)].pts += 1;
      sum++;
    } else {
      const candidates = Q.filter(q => q.pts > 1);
      if (!candidates.length) break;
      candidates.sort((a, b) => b.pts - a.pts);
      candidates[0].pts -= 1;
      sum--;
    }
  }
}

/* ═══ TIMER ═══ */
function startTimer() {
  stopTimer();
  timeLeft = TIMER_SECONDS;
  updateTimerUI();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI();
    if (timeLeft <= 0) {
      stopTimer();
      handleTimeout();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerUI() {
  const text = document.getElementById('qTimerText');
  const fill = document.getElementById('qTimerFill');
  if (text) {
    text.textContent = `${timeLeft}s`;
    text.classList.toggle('danger', timeLeft <= 10);
  }
  if (fill) {
    fill.style.width = `${(timeLeft / TIMER_SECONDS) * 100}%`;
    fill.classList.toggle('danger', timeLeft <= 10);
  }
}

function handleTimeout() {
  if (answered) return;
  answered = true;
  const q = Q[qIdx];
  document.querySelectorAll('.qopt').forEach(b => {
    b.disabled = true;
    if (b.dataset.val === q.answer) b.classList.add('correct');
    else b.classList.add('dimmed');
  });
  document.getElementById('qRevSilh').innerHTML = q.silh;
  document.getElementById('qRevName').textContent = q.answer;
  document.getElementById('qRevFacts').innerHTML = q.facts
    .map(([k, v]) => `<div class="q-reveal-fact">${k}: <span>${v}</span></div>`)
    .join('');
  document.getElementById('qRevPts').textContent = '⏱ Süre Doldu';
  document.getElementById('qRevPts').style.color = 'rgba(200,80,80,0.7)';
  document.getElementById('qReveal').classList.add('on');
  setTimeout(() => document.getElementById('btnNext').classList.add('on'), 400);
}

/* ═══ LOBBY → MODAL ═══ */
document.querySelectorAll('.hand-card').forEach(c =>
  c.addEventListener('click', () => {
    dim.classList.add('on');
    smodal.classList.add('on');
  })
);
document.getElementById('btnNo').addEventListener('click', () => {
  smodal.classList.remove('on');
  dim.classList.remove('on');
});
document.getElementById('btnYes').addEventListener('click', () => {
  smodal.classList.remove('on');
  dim.classList.remove('on');
  lobby.style.transition = 'opacity .45s';
  lobby.style.opacity = '0';
  setTimeout(() => {
    lobby.style.display = 'none';
    startQuiz();
  }, 450);
});

/* ═══ QUIZ ═══ */
function startQuiz() {
  score = 0;
  qIdx = 0;
  pickQuestions();
  quizScreen.classList.add('on');
  loadQ(0);
}

function loadQ(i) {
  answered = false;
  const q = Q[i];
  document.getElementById('qNum').textContent = `${i + 1} / ${Q.length}`;
  document.getElementById('qFill').style.width = `${(i / Q.length) * 100}%`;
  document.getElementById('qScore').textContent = score;
  document.getElementById('qCat').textContent = q.cat;
  document.getElementById('qPts').textContent = `+${q.pts} puan`;
  document.getElementById('qTitle').textContent = q.title;
  document.getElementById('qClue').textContent = q.clue;
  document.getElementById('qPrompt').textContent = q.prompt;

  // Shuffle options
  const opts = [...q.options];
  for (let j = opts.length - 1; j > 0; j--) {
    const k = Math.floor(Math.random() * (j + 1));
    [opts[j], opts[k]] = [opts[k], opts[j]];
  }
  const letters = ['A', 'B', 'C', 'D'];
  document.querySelectorAll('.qopt').forEach((btn, idx) => {
    btn.className = 'qopt';
    btn.disabled = false;
    btn.querySelector('.qopt-letter').textContent = letters[idx];
    btn.querySelector('.qopt-text').textContent = opts[idx];
    btn.dataset.val = opts[idx];
  });

  // Hide reveal + next
  document.getElementById('qReveal').classList.remove('on');
  document.getElementById('btnNext').classList.remove('on');

  // Refill panel stars
  const pStars = document.querySelector('.qpanel-stars');
  pStars.innerHTML = '';
  _fillSVG(pStars);

  startTimer();
}

document.querySelectorAll('.qopt').forEach(btn => {
  btn.addEventListener('click', () => {
    if (answered) return;
    answered = true;
    stopTimer();
    const q = Q[qIdx];
    const chosen = btn.dataset.val;
    const correct = chosen === q.answer;

    document.querySelectorAll('.qopt').forEach(b => {
      b.disabled = true;
      if (b.dataset.val === q.answer) b.classList.add('correct');
      else if (b === btn && !correct) b.classList.add('wrong');
      else b.classList.add('dimmed');
    });

    if (correct) {
      score += q.pts;
      const sv = document.getElementById('qScore');
      sv.textContent = score;
      sv.classList.add('bump');
      setTimeout(() => sv.classList.remove('bump'), 300);
      showPop(`+${q.pts}`);
    }

    document.getElementById('qRevSilh').innerHTML = q.silh;
    document.getElementById('qRevName').textContent = q.answer;
    document.getElementById('qRevFacts').innerHTML = q.facts
      .map(([k, v]) => `<div class="q-reveal-fact">${k}: <span>${v}</span></div>`)
      .join('');
    document.getElementById('qRevPts').textContent = correct ? `+${q.pts} ✓` : '0';
    document.getElementById('qRevPts').style.color = correct ? 'var(--gold)' : 'rgba(200,80,80,0.7)';
    document.getElementById('qReveal').classList.add('on');

    setTimeout(() => document.getElementById('btnNext').classList.add('on'), 400);
  });
});

document.getElementById('btnNext').addEventListener('click', () => {
  stopTimer();
  qIdx++;
  if (qIdx >= Q.length) {
    setTimeout(showEnd, 300);
  } else {
    document.getElementById('qReveal').classList.remove('on');
    document.getElementById('btnNext').classList.remove('on');
    setTimeout(() => loadQ(qIdx), 200);
  }
});

function showPop(txt) {
  spop.textContent = txt;
  spop.classList.remove('go');
  void spop.offsetWidth;
  spop.classList.add('go');
}

function showEnd() {
  quizScreen.classList.remove('on');
  endScreen.classList.add('on');
  document.getElementById('endScore').textContent = score;
  document.getElementById('endOf').textContent = `/ ${TOTAL} üzerinden`;
  const p = score / TOTAL;
  document.getElementById('endMsg').textContent =
    p >= 0.9 ? 'Muhteşem! Gerçek bir dünya kâşifi. 🌍' :
    p >= 0.7 ? 'Çok iyi! Dünya sana yabancı değil. 🗺' :
    p >= 0.5 ? 'Fena değil! Biraz daha keşfeyle zirveye çıkarsın.' :
               'Dünya büyük, keşfedilecek çok şey var. Tekrar dene!';
}

document.getElementById('btnRestart').addEventListener('click', () => {
  endScreen.classList.remove('on');
  score = 0;
  qIdx = 0;
  pickQuestions();
  lobby.style.display = '';
  setTimeout(() => { lobby.style.opacity = '1'; }, 50);
});

/* ═══ BOOTSTRAP ═══ */
fetch('./questions.json')
  .then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then(data => {
    POOL = data.pool;
    TROLL = data.troll;
    pickQuestions();
  })
  .catch(err => {
    console.error('questions.json yüklenemedi:', err);
    const hint = document.querySelector('.l-hint');
    if (hint) {
      hint.textContent = 'questions.json yüklenemedi — local server üzerinden açın (README.md)';
      hint.style.color = 'rgba(220,80,80,.7)';
    }
  });

// ═══════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════
const CONFS = {
  EUR: {
    label:'EUR', color:'#4488ff', qual: 3,
    teams: ['França','Espanha','Inglaterra','Alemanha','Hungria','Portugal','Rússia','Itália','Suíça','Noruega','Escócia','Suécia'],
    flags: {'França':'🇫🇷','Espanha':'🇪🇸','Inglaterra':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Alemanha':'🇩🇪','Hungria':'🇭🇺','Portugal':'🇵🇹','Rússia':'🇷🇺','Itália':'🇮🇹','Suíça':'🇨🇭','Noruega':'🇳🇴','Escócia':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Suécia':'🇸🇪'}
  },
  AME: {
    label:'AME', color:'#ff9944', qual: 3,
    teams: ['Brasil','Argentina','Uruguai','México','Estados Unidos','Canadá','Colômbia','Equador','Peru','Bolívia','Jamaica','Costa Rica'],
    flags: {'Brasil':'🇧🇷','Argentina':'🇦🇷','Uruguai':'🇺🇾','México':'🇲🇽','Estados Unidos':'🇺🇸','Canadá':'🇨🇦','Colômbia':'🇨🇴','Equador':'🇪🇨','Peru':'🇵🇪','Bolívia':'🇧🇴','Jamaica':'🇨🇷','Costa Rica':'🇨🇷'}
  },
  AAO: {
    label:'AAO', color:'#cc44ff', qual: 2,
    teams: ['Japão','Marrocos','África do Sul','Coreia do Sul','China','Austrália','Argélia','Nova Zelândia','Egito','Papua Nova Guiné','Nigéria','Singapura'],
    flags: {'Japão':'🇯🇵','Marrocos':'🇲🇦','África do Sul':'🇿🇦','Coreia do Sul':'🇰🇷','China':'🇨🇳','Austrália':'🇦🇺','Argélia':'🇩🇿','Nova Zelândia':'🇳🇿','Egito':'🇪🇬','Papua Nova Guiné':'🇵🇬','Nigéria':'🇳🇬','Singapura':'🇸🇬'}
  }
};

const LEAGUES = [
  {id:'EUR-A', conf:'EUR', sub:'A'},
  {id:'EUR-B', conf:'EUR', sub:'B'},
  {id:'AME-A', conf:'AME', sub:'A'},
  {id:'AME-B', conf:'AME', sub:'B'},
  {id:'AAO-A', conf:'AAO', sub:'A'},
  {id:'AAO-B', conf:'AAO', sub:'B'},
];

let state = {
  drawn: false,        // sorteio feito
  started: false,      // liga iniciada
  leagueTeams: {},     // {ligaId: ['Time1',...]}
  rounds: {},          // {ligaId: [{num, matches:[{home,away,sH,sA,played}]}]}
  activeFilter: 'EUR-A',
  activeRodFilter: 'EUR-A',
  hosts: [],           // países sede
};

// ═══════════════════════════════════════════
// HOST SELECTION
// ═══════════════════════════════════════════
function renderHostSelection() {
  const container = document.getElementById('hostSelection');
  const grid = document.getElementById('hostGrid');
  if (!container || !grid) return;

  if (state.drawn || state.started) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';

  let allTeams = [];
  Object.keys(CONFS).forEach(c => {
    CONFS[c].teams.forEach(t => allTeams.push({name:t, conf:c}));
  });
  allTeams.sort((a,b) => a.name.localeCompare(b.name));

  grid.innerHTML = allTeams.map(t => {
    const isSelected = state.hosts.includes(t.name);
    const flag = CONFS[t.conf].flags[t.name] || '🏳️';
    return `<div class="host-item ${isSelected?'selected':''}" onclick="toggleHost('${t.name}')">
      <span class="hflag">${flag}</span>
      <span>${t.name}</span>
    </div>`;
  }).join('');
}

function toggleHost(name) {
  if (state.hosts.includes(name)) {
    state.hosts = state.hosts.filter(h => h !== name);
  } else {
    if (state.hosts.length >= 3) {
      alert('Máximo de 3 países sede.');
      return;
    }
    state.hosts.push(name);
  }
  renderHostSelection();
  saveState();
}

// ═══════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════
function showTab(name) {
  document.querySelectorAll('.nav-tab').forEach((t,i)=>{
    t.classList.toggle('active',['sorteio','ligas','rodadas','regras'][i]===name);
  });
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
}

// ═══════════════════════════════════════════
// DRAW GRID INIT
// ═══════════════════════════════════════════
function initDrawGrid() {
  const grid = document.getElementById('drawGrid');
  if (!grid) return;
  grid.innerHTML = '';
  LEAGUES.forEach(lg => {
    const conf = CONFS[lg.conf];
    grid.innerHTML += `<div class="league-draw-card" id="card-${lg.id}">
      <div class="league-draw-header" style="border-bottom:1px solid ${conf.color}44">
        <span class="conf-dot" style="background:${conf.color}"></span>
        <span style="color:${conf.color}">${lg.id}</span>
      </div>
      <div class="league-draw-slots" id="slots-${lg.id}">
        ${Array(6).fill(0).map((_,i)=>`<div class="draw-slot empty" id="slot-${lg.id}-${i}"><span class="slot-num">${i+1}</span><span style="color:var(--muted);font-size:12px">—</span></div>`).join('')}
      </div>
    </div>`;
  });
}

// ═══════════════════════════════════════════
// DRAW ANIMATION
// ═══════════════════════════════════════════
let drawRunning = false;
async function startDraw() {
  if (drawRunning) return;
  if (state.hosts.length === 0) {
    alert('Selecione pelo menos 1 país sede.');
    return;
  }
  drawRunning = true;
  document.getElementById('btnDraw').disabled = true;
  document.getElementById('btnStartLeague').style.display = 'none';
  document.getElementById('hostSelection').style.display = 'none';

  // reset slots
  initDrawGrid();
  state.leagueTeams = {};
  LEAGUES.forEach(lg => state.leagueTeams[lg.id] = []);

  // shuffle each conf into A/B
  for (const confId of ['EUR','AME','AAO']) {
    const conf = CONFS[confId];
    let A, B;
    let attempts = 0;
    
    // Ensure no more than 2 hosts per group
    while (attempts < 100) {
      const shuffled = shuffle([...conf.teams]);
      A = shuffled.slice(0,6);
      B = shuffled.slice(6,12);
      
      const hostsA = A.filter(t => state.hosts.includes(t)).length;
      const hostsB = B.filter(t => state.hosts.includes(t)).length;
      
      if (hostsA <= 2 && hostsB <= 2) break;
      attempts++;
    }

    const leagueA = confId+'-A';
    const leagueB = confId+'-B';
    state.leagueTeams[leagueA] = A;
    state.leagueTeams[leagueB] = B;

    // animate A then B interleaved per round
    for (let i = 0; i < 6; i++) {
      await animateSlot(leagueA, i, A[i], conf);
      await animateSlot(leagueB, i, B[i], conf);
      await sleep(120);
    }
    await sleep(200);
  }

  // show start button
  state.drawn = true;
  document.getElementById('btnDraw').textContent = '🔀 Novo Sorteio';
  document.getElementById('btnDraw').disabled = false;
  const btnStart = document.getElementById('btnStartLeague');
  btnStart.style.display = 'flex';
  drawRunning = false;
  saveState();
}

async function animateSlot(ligaId, idx, team, conf) {
  const slot = document.getElementById(`slot-${ligaId}-${idx}`);
  if (!slot) return;
  slot.className = 'draw-slot incoming';
  const flag = conf.flags[team] || '🏳️';
  slot.innerHTML = `<span class="slot-num">${idx+1}</span><span class="slot-flag">${flag}</span><span class="draw-ball">${team}</span>`;
  await sleep(350);
  slot.className = 'draw-slot filled';
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function shuffle(arr) {
  for (let i = arr.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}

// ═══════════════════════════════════════════
// CONFIRM LEAGUE START
// ═══════════════════════════════════════════
function confirmLeagueStart() {
  // build rounds for each league
  LEAGUES.forEach(lg => {
    state.rounds[lg.id] = buildRounds(state.leagueTeams[lg.id]);
  });
  state.started = true;

  buildFilters();
  renderLigas();
  renderRodadas();
  showTab('ligas');
  document.getElementById('headerPhase').textContent = 'GRUPOS — EM ANDAMENTO';
  saveState();
}

// ═══════════════════════════════════════════
// ROUND ROBIN
// ═══════════════════════════════════════════
function buildRounds(teams) {
  let list = [...teams];
  if (list.length % 2 !== 0) list.push('__bye__');
  const n = list.length;
  const rotating = list.slice(1);
  const rounds = [];
  for (let r = 0; r < n-1; r++) {
    const cur = [list[0], ...rotating];
    const matches = [];
    for (let m = 0; m < n/2; m++) {
      const home = cur[m], away = cur[n-1-m];
      if (home !== '__bye__' && away !== '__bye__') {
        matches.push({home, away, sH:null, sA:null, played:false});
      }
    }
    rounds.push({num:r+1, matches});
    rotating.push(rotating.shift());
  }
  return rounds;
}

// ═══════════════════════════════════════════
// STANDINGS CALC
// ═══════════════════════════════════════════
function calcStandings(ligaId) {
  const teams = state.leagueTeams[ligaId];
  const stats = {};
  teams.forEach(t => stats[t] = {name:t,pts:0,pf:0,pa:0,w:0,d:0,l:0,played:0});
  state.rounds[ligaId].forEach(rd => {
    rd.matches.forEach(m => {
      if (!m.played) return;
      const h = stats[m.home], a = stats[m.away];
      h.pf+=m.sH; h.pa+=m.sA; h.played++;
      a.pf+=m.sA; a.pa+=m.sH; a.played++;
      if (m.sH>m.sA) { h.pts+=3;h.w++;a.l++; }
      else if (m.sH<m.sA) { a.pts+=3;a.w++;h.l++; }
      else { h.pts+=1;a.pts+=1;h.d++;a.d++; }
    });
  });
  const arr = Object.values(stats);
  arr.forEach(t => t.saldo = t.pf - t.pa);
  arr.sort((a,b) => b.pts-a.pts || b.saldo-a.saldo || b.pf-a.pf);
  return arr;
}

// ═══════════════════════════════════════════
// FILTERS
// ═══════════════════════════════════════════
function buildFilters() {
  ['ligaFilter','rodFilter'].forEach((fId, idx) => {
    const stateKey = idx===0 ? 'activeFilter' : 'activeRodFilter';
    const fn = idx===0 ? ()=>renderLigas() : ()=>renderRodadas();
    const el = document.getElementById(fId);
    if (!el) return;
    el.innerHTML = '';

    // conf groups
    ['EUR','AME','AAO'].forEach(conf => {
      ['A','B'].forEach(sub => {
        const id = conf+'-'+sub;
        const c = CONFS[conf].color;
        const chip = document.createElement('button');
        chip.className = 'fchip' + (state[stateKey]===id?' active':'');
        chip.textContent = id;
        chip.style.borderColor = state[stateKey]===id ? c : '';
        chip.style.color = state[stateKey]===id ? c : '';
        chip.onclick = () => {
          state[stateKey] = id;
          buildFilters();
          fn();
          saveState();
        };
        el.appendChild(chip);
      });
    });
  });
}

// ═══════════════════════════════════════════
// RENDER LIGAS
// ═══════════════════════════════════════════
function renderLigas() {
  const body = document.getElementById('ligasBody');
  if (!body) return;
  if (!state.started) { body.innerHTML = '<div class="empty-state"><div class="eicon">🎲</div><p>Faça o sorteio primeiro</p></div>'; return; }

  const ligaId = state.activeFilter;
  const lg = LEAGUES.find(l=>l.id===ligaId);
  const conf = CONFS[lg.conf];
  const qualN = conf.qual;
  const rows = calcStandings(ligaId);
  const totalMatches = state.rounds[ligaId].reduce((s,r)=>s+r.matches.length,0);
  const playedMatches = state.rounds[ligaId].reduce((s,r)=>s+r.matches.filter(m=>m.played).length,0);

  // Qualificação: Sede sempre passa + top não-sedes até completar qualN
  const hostsInLeague = rows.filter(t => state.hosts.includes(t.name));
  const nonHostsInLeague = rows.filter(t => !state.hosts.includes(t.name));
  const numNonHostQualifiers = Math.max(0, qualN - hostsInLeague.length);
  const nonHostQualifiersNames = nonHostsInLeague.slice(0, numNonHostQualifiers).map(t => t.name);
  const qualifierNames = [...hostsInLeague.map(t => t.name), ...nonHostQualifiersNames];

  let html = `<div class="qual-info">
    <div class="qi"><div class="qi-dot" style="background:var(--green)"></div>Classificado (${qualN} vagas)</div>
    <div class="qi"><div class="qi-dot" style="background:var(--red)"></div>Eliminado</div>
  </div>`;

  html += `<div class="liga-block">
    <div class="liga-block-header">
      <div class="liga-block-title">
        <span class="conf-dot" style="background:${conf.color}"></span>
        <span style="color:${conf.color}">${ligaId}</span>
        <span class="qual-badge" style="color:${conf.color};border-color:${conf.color}44">${qualN} vagas (incl. Sede)</span>
      </div>
      <span class="liga-progress">${playedMatches}/${totalMatches}</span>
    </div>
    <table class="std-table">
      <thead><tr>
        <th>#</th><th class="left">Time</th>
        <th>J</th><th>V</th><th>E</th><th>D</th>
        <th>PF</th><th>PA</th><th>SLD</th><th>PTS</th>
      </tr></thead>
      <tbody>`;

  rows.forEach((t,i) => {
    const isHost = state.hosts.includes(t.name);
    const isQual = qualifierNames.includes(t.name);
    const posClass = isQual ? (i === 0 ? 'pos-q1' : 'pos-q2') : 'pos-elim';
    const saldoC = t.saldo>0?'saldo-pos':t.saldo<0?'saldo-neg':'saldo-zero';
    const saldoS = t.saldo>0?`+${t.saldo}`:t.saldo;
    const flag = conf.flags[t.name]||'🏳️';
    const hostBadge = isHost ? '<span class="host-badge">Sede</span>' : '';
    html += `<tr>
      <td class="td-pos ${posClass}">${i+1}</td>
      <td class="td-name"><span style="margin-right:4px">${flag}</span>${esc(t.name)}${hostBadge}</td>
      <td class="td-num">${t.played}</td>
      <td class="td-num">${t.w}</td>
      <td class="td-num">${t.d}</td>
      <td class="td-num">${t.l}</td>
      <td class="td-num">${t.pf}</td>
      <td class="td-num">${t.pa}</td>
      <td class="td-num ${saldoC}">${saldoS}</td>
      <td class="td-pts">${t.pts}</td>
    </tr>`;
  });

  html += `</tbody></table></div>`;
  if (playedMatches===totalMatches && totalMatches>0) {
    const classificados = rows.filter(t => qualifierNames.includes(t.name));
    html = `<div class="alert">🏆 ${ligaId} encerrada! Classificados: <b>${classificados.map(t=>t.name).join(', ')}</b></div>` + html;
  }
  body.innerHTML = html;
}

// ═══════════════════════════════════════════
// RENDER RODADAS
// ═══════════════════════════════════════════
function renderRodadas() {
  const body = document.getElementById('rodadasBody');
  if (!body) return;
  if (!state.started) { body.innerHTML = '<div class="empty-state"><div class="eicon">🎲</div><p>Faça o sorteio primeiro</p></div>'; return; }

  const ligaId = state.activeRodFilter;
  const lg = LEAGUES.find(l=>l.id===ligaId);
  const conf = CONFS[lg.conf];
  const rounds = state.rounds[ligaId];
  const totalP = rounds.reduce((s,r)=>s+r.matches.filter(m=>m.played).length,0);
  const totalM = rounds.reduce((s,r)=>s+r.matches.length,0);

  let html = `<div class="alert" style="border-color:${conf.color};background:${conf.color}11;color:${conf.color}">${ligaId} — ${totalP}/${totalM} partidas disputadas</div>`;

  rounds.forEach((rd,ri) => {
    const allDone = rd.matches.every(m=>m.played);
    html += `<div class="round-block">
      <div class="round-hdr">
        <span>Rodada ${rd.num}</span>
        ${allDone?'<span class="done">✓ Concluída</span>':''}
      </div>`;
    rd.matches.forEach((m,mi) => {
      html += renderMatchRow(ligaId, ri, mi, m, conf);
    });
    html += `</div>`;
  });
  body.innerHTML = html;
}

function renderMatchRow(ligaId, ri, mi, m, conf) {
  const id = `m-${ligaId}-${ri}-${mi}`;
  if (m.played) {
    return `<div class="match-row" id="${id}">
      <div class="mteam home">${esc(m.home)}</div>
      <div class="mscore-area">
        <div class="mplayed"><span class="gs">${m.sH}</span><span class="sep">–</span><span class="gs">${m.sA}</span></div>
        <button class="btn-edit-sm" onclick="editMatch('${ligaId}',${ri},${mi})">editar</button>
      </div>
      <div class="mteam away">${esc(m.away)}</div>
    </div>`;
  }
  return `<div class="match-row" id="${id}">
    <div class="mteam home">${esc(m.home)}</div>
    <div class="mscore-area">
      <div class="mscore-inputs">
        <input class="sinput" type="number" min="0" id="sh_${ligaId}_${ri}_${mi}" placeholder="–" oninput="clearErr('${ligaId}',${ri},${mi})"/>
        <span class="ssep">–</span>
        <input class="sinput" type="number" min="0" id="sa_${ligaId}_${ri}_${mi}" placeholder="–" oninput="clearErr('${ligaId}',${ri},${mi})"/>
        <button class="btn-ok" onclick="confirmMatch('${ligaId}',${ri},${mi})">OK</button>
      </div>
      <div class="merr" id="err_${ligaId}_${ri}_${mi}"></div>
    </div>
    <div class="mteam away">${esc(m.away)}</div>
  </div>`;
}

function clearErr(ligaId,ri,mi) {
  const e = document.getElementById(`err_${ligaId}_${ri}_${mi}`);
  if(e) e.textContent='';
}

function confirmMatch(ligaId,ri,mi) {
  const sh = parseInt(document.getElementById(`sh_${ligaId}_${ri}_${mi}`).value);
  const sa = parseInt(document.getElementById(`sa_${ligaId}_${ri}_${mi}`).value);
  const err = document.getElementById(`err_${ligaId}_${ri}_${mi}`);
  if (isNaN(sh)||isNaN(sa)||sh<0||sa<0) { err.textContent='Placar inválido'; return; }
  state.rounds[ligaId][ri].matches[mi].sH = sh;
  state.rounds[ligaId][ri].matches[mi].sA = sa;
  state.rounds[ligaId][ri].matches[mi].played = true;
  renderRodadas();
  renderLigas();
  saveState();
}

function editMatch(ligaId,ri,mi) {
  const m = state.rounds[ligaId][ri].matches[mi];
  m.played=false; m.sH=null; m.sA=null;
  renderRodadas();
  renderLigas();
  saveState();
}

// ═══════════════════════════════════════════
// RESET
// ═══════════════════════════════════════════
function resetAll() {
  if (!confirm('Resetar tudo? O progresso será perdido.')) return;
  state = {drawn:false,started:false,leagueTeams:{},rounds:{},activeFilter:'EUR-A',activeRodFilter:'EUR-A',hosts:[]};
  localStorage.removeItem('litfut_v1_state');
  initDrawGrid();
  renderHostSelection();
  document.getElementById('btnDraw').textContent='⚽ Iniciar Sorteio';
  document.getElementById('btnDraw').disabled=false;
  document.getElementById('btnStartLeague').style.display='none';
  document.getElementById('ligasBody').innerHTML='';
  document.getElementById('rodadasBody').innerHTML='';
  document.getElementById('ligaFilter').innerHTML='';
  document.getElementById('rodFilter').innerHTML='';
  document.getElementById('headerPhase').textContent='FASE DE GRUPOS';
  showTab('sorteio');
}

// ═══════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════
const STORAGE_KEY = 'litfut_v1_state';
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    renderHostSelection();
    return;
  }
  try {
    const loaded = JSON.parse(saved);
    if (loaded) {
      state = loaded;
      if (!state.hosts) state.hosts = [];
      renderHostSelection();
      if (state.drawn) {
        document.getElementById('btnDraw').textContent = '🔀 Novo Sorteio';
        if (!state.started) {
          rebuildDrawGrid();
          document.getElementById('btnStartLeague').style.display = 'flex';
        }
      }
      if (state.started) {
        buildFilters();
        renderLigas();
        renderRodadas();
        document.getElementById('headerPhase').textContent = 'GRUPOS — EM ANDAMENTO';
        showTab('ligas');
      }
    }
  } catch(e) { console.error(e); }
}
function rebuildDrawGrid() {
  initDrawGrid();
  LEAGUES.forEach(lg => {
    const teams = state.leagueTeams[lg.id] || [];
    const conf = CONFS[lg.conf];
    teams.forEach((t, i) => {
      const slot = document.getElementById(`slot-${lg.id}-${i}`);
      if (slot) {
        slot.className = 'draw-slot filled';
        slot.innerHTML = `<span class="slot-num">${i+1}</span><span class="slot-flag">${conf.flags[t]||'🏳️'}</span><span>${t}</span>`;
      }
    });
  });
}

// ═══════════════════════════════════════════
// FILE BACKUP (CUSTOM FORMAT)
// ═══════════════════════════════════════════
function serializeState(obj) {
  let lines = ["LITFUT_SAVE_v1"];
  lines.push(`drawn:${obj.drawn}`);
  lines.push(`started:${obj.started}`);
  lines.push(`activeFilter:${obj.activeFilter}`);
  lines.push(`activeRodFilter:${obj.activeRodFilter}`);
  lines.push(`hosts:${(obj.hosts||[]).join(',')}`);
  
  for (let lg in obj.leagueTeams) {
    lines.push(`teams|${lg}:${obj.leagueTeams[lg].join(',')}`);
  }
  
  for (let lg in obj.rounds) {
    obj.rounds[lg].forEach(rd => {
      rd.matches.forEach(m => {
        lines.push(`match|${lg}|${rd.num}:${m.home}|${m.away}|${m.sH}|${m.sA}|${m.played}`);
      });
    });
  }
  return lines.join('\n');
}

function deserializeState(text) {
  const lines = text.trim().split('\n');
  if (lines[0] !== "LITFUT_SAVE_v1") throw new Error("Formato incompatível");
  
  let ns = { drawn:false, started:false, leagueTeams:{}, rounds:{}, activeFilter:'EUR-A', activeRodFilter:'EUR-A', hosts:[] };
  
  lines.forEach(line => {
    if (line.startsWith('drawn:')) ns.drawn = line.split(':')[1] === 'true';
    else if (line.startsWith('started:')) ns.started = line.split(':')[1] === 'true';
    else if (line.startsWith('activeFilter:')) ns.activeFilter = line.split(':')[1];
    else if (line.startsWith('activeRodFilter:')) ns.activeRodFilter = line.split(':')[1];
    else if (line.startsWith('hosts:')) {
      const hStr = line.split(':')[1];
      ns.hosts = hStr ? hStr.split(',') : [];
    }
    else if (line.startsWith('teams|')) {
      const [lg, teamsStr] = line.slice(6).split(':');
      ns.leagueTeams[lg] = teamsStr.split(',');
    }
    else if (line.startsWith('match|')) {
      const [meta, data] = line.slice(6).split(':');
      const [lg, rdNum] = meta.split('|');
      const [home, away, sH, sA, played] = data.split('|');
      if (!ns.rounds[lg]) ns.rounds[lg] = [];
      let round = ns.rounds[lg].find(r => r.num === parseInt(rdNum));
      if (!round) { round = { num: parseInt(rdNum), matches: [] }; ns.rounds[lg].push(round); }
      round.matches.push({
        home, away,
        sH: sH === 'null' ? null : parseInt(sH),
        sA: sA === 'null' ? null : parseInt(sA),
        played: played === 'true'
      });
    }
  });
  return ns;
}

function exportStateToFile() {
  const content = serializeState(state);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = `torneio_litfut_${date}.litfut`;
  a.click();
  URL.revokeObjectURL(url);
}

function importStateFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const loaded = deserializeState(e.target.result);
      if (confirm('Carregar este arquivo? O progresso atual será substituído.')) {
        state = loaded;
        saveState();
        location.reload();
      }
    } catch (err) {
      alert('Erro: Arquivo inválido ou corrompido.');
      console.error(err);
    }
  };
  reader.readAsText(file);
}

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initDrawGrid();
  loadState();
  if ("serviceWorker" in navigator) {  
    navigator.serviceWorker.register("./service-worker.js");  
  }
});

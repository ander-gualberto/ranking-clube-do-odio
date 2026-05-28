/* ============================================================
   CLUBE DO ÓDIO — Ranking Público
   Fonte: Google Sheets (gviz/tq CSV)
   Atualização automática: a cada 5 minutos
   ============================================================ */

const CONFIG = {
  sheetId:   '1pTjLgnEa52uS4ek4DjFHWQuV8vNgvo-rKrxJcOPnEEk',
  sheetName: 'Ranking',
  refreshMs: 5 * 60 * 1000, // 5 minutos
};

const DATA_URL =
  `https://docs.google.com/spreadsheets/d/${CONFIG.sheetId}` +
  `/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(CONFIG.sheetName)}`;

// Último fetch armazenado — usado pelo modal
let rankingData      = [];
let rankingFirstLoad = true;

// Média geral do grupo — atualizada em renderStats(), usada em generateBadges()
let rankingMediaGeral = 0;

// Membro atualmente aberto no modal — ponteiro para openShareCard()
let currentModalMember = null;

/* ============================================================
   FRASES ROTATIVAS — uma por carregamento (aleatória)
   ============================================================ */
const FRASES = [
  'Disciplina cria distância.',
  'O ranking não mente.',
  'Resultado deixa rastros.',
  'Consistência vence intensidade.',
  'Execução acima de motivação.',
];

/* ============================================================
   MESES EM PORTUGUÊS
   ============================================================ */
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/* ============================================================
   NÍVEIS DE PROGRESSÃO
   Baseado em total de pontos do membro
   ============================================================ */
const LEVELS = [
  { min: 0,        max: 5,        name: 'RECRUTA',   num: '01' },
  { min: 5,        max: 10,       name: 'SOLDADO',   num: '02' },
  { min: 10,       max: 15,       name: 'EXECUTOR',  num: '03' },
  { min: 15,       max: 20,       name: 'ELITE',     num: '04' },
  { min: 20,       max: Infinity, name: 'DOMINANTE', num: '05' },
];

/* ============================================================
   PARSE CSV
   Lida com campos entre aspas e vírgulas dentro de campos
   ============================================================ */
function parseCSVLine(line) {
  const fields = [];
  let cur = '';
  let inQ  = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      fields.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

function parseCSV(raw) {
  const lines   = raw.trim().split('\n');
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim().toUpperCase());

  return lines.slice(1)
    .map(line => {
      const vals = parseCSVLine(line);
      const obj  = {};
      headers.forEach((h, i) => {
        obj[h] = (vals[i] || '').replace(/"/g, '').trim();
      });
      return obj;
    })
    .filter(row => row['NOME'] && row['NOME'] !== '');
}

/* ============================================================
   FORMATAÇÃO DE NÚMEROS (vírgula BR)
   ============================================================ */
function toFloat(val) {
  if (!val) return NaN;
  return parseFloat(String(val).replace(',', '.'));
}

function formatDecimal(val, casas = 1) {
  const n = toFloat(val);
  if (isNaN(n)) return '—';
  return n.toFixed(casas).replace('.', ',');
}

function formatPontos(val) {
  const n = toFloat(val);
  if (isNaN(n)) return '—';
  return Number.isInteger(n)
    ? String(n)
    : n.toFixed(1).replace('.', ',');
}

/* ============================================================
   INICIAIS DO NOME
   ============================================================ */
function getInitials(nome) {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ============================================================
   NÍVEL DE PROGRESSÃO — baseado nos pontos do membro
   Retorna: { num, name, progress (0–100), isMax, nextName }
   ============================================================ */
function generateLevel(member) {
  const pontos = toFloat(member['PONTOS']) || 0;

  let level = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (pontos >= LEVELS[i].min) { level = LEVELS[i]; break; }
  }

  const isMax    = level.max === Infinity;
  const progress = isMax
    ? 100
    : Math.min(100, Math.round(((pontos - level.min) / (level.max - level.min)) * 100));

  const nextIdx  = LEVELS.indexOf(level) + 1;
  const nextName = isMax ? null : LEVELS[nextIdx].name;

  return { num: level.num, name: level.name, progress, isMax, nextName };
}

/* ============================================================
   STATUS OPERACIONAL — texto exibido sob o nome no modal
   ============================================================ */
function generateStatus(member) {
  const pos       = parseInt(member['POSIÇÃO'] || member['POSICAO'] || '', 10);
  const media     = toFloat(member['MÉDIA'] || member['MEDIA']) || 0;
  const respostas = parseInt(member['RESPOSTAS'], 10) || 0;

  if (media >= 7)                               return 'ACIMA DA MÉDIA DA TROPA';
  if (!isNaN(pos) && pos >= 1 && pos <= 5)      return 'OPERADOR DE ELITE';
  if (respostas >= 4)                           return 'ALTA PARTICIPAÇÃO';
  if (rankingMediaGeral > 0 && media < rankingMediaGeral) return 'EM DESENVOLVIMENTO';
  return 'OPERADOR ATIVO';
}

/* ============================================================
   BADGES REAIS — geradas a partir dos dados do membro
   Usa rankingMediaGeral (calculado em renderStats)
   ============================================================ */
function generateBadges(member) {
  const pos       = parseInt(member['POSIÇÃO'] || member['POSICAO'] || '', 10);
  const media     = toFloat(member['MÉDIA'] || member['MEDIA']) || 0;
  const respostas = parseInt(member['RESPOSTAS'], 10) || 0;

  const badges = [];

  // 🏆 CAMPEÃO — posição 1
  if (pos === 1) {
    badges.push({ icon: '🏆', label: 'CAMPEÃO', key: 'campeao' });
  }

  // 🥈 ELITE — média >= 7
  if (media >= 7) {
    badges.push({ icon: '🥈', label: 'ELITE', key: 'elite' });
  }

  // ⚔️ EXECUTOR — respostas >= 4
  if (respostas >= 4) {
    badges.push({ icon: '⚔️', label: 'EXECUTOR', key: 'executor' });
  }

  // 🔥 DESTAQUE — posição <= 5
  if (!isNaN(pos) && pos >= 1 && pos <= 5) {
    badges.push({ icon: '🔥', label: 'DESTAQUE', key: 'destaque' });
  }

  // 📈 EVOLUÇÃO — média individual acima da média geral do grupo
  if (media > rankingMediaGeral && rankingMediaGeral > 0) {
    badges.push({ icon: '📈', label: 'EVOLUÇÃO', key: 'evolucao' });
  }

  // 🧠 CONSISTENTE — respostas >= 3 E média >= 6
  if (respostas >= 3 && media >= 6) {
    badges.push({ icon: '🧠', label: 'CONSISTENTE', key: 'consistente' });
  }

  return badges;
}

/* ============================================================
   RENDER — BLOCO DA TEMPORADA
   ============================================================ */
function renderSeason() {
  const now    = new Date();
  const mes    = MESES[now.getMonth()];
  const ano    = now.getFullYear();
  const fimMes = new Date(ano, now.getMonth() + 1, 0);
  const dias   = fimMes.getDate() - now.getDate();
  const frase  = FRASES[Math.floor(Math.random() * FRASES.length)];

  document.getElementById('seasonNome').textContent      = `TEMPORADA ${mes.toUpperCase()} ${ano}`;
  document.getElementById('seasonFrase').textContent     = frase;
  document.getElementById('seasonDias').textContent      = dias;
  document.getElementById('seasonDiasLabel').textContent = dias === 1 ? 'dia restante' : 'dias restantes';
}

/* ============================================================
   RENDER — CARDS DE ESTATÍSTICAS
   Calcula e armazena rankingMediaGeral para as badges
   ============================================================ */
function renderStats(data) {
  const totalMembros   = data.length;
  const totalRespostas = data.reduce((s, r) => s + (parseInt(r['RESPOSTAS'], 10) || 0), 0);
  const totalPontos    = data.reduce((s, r) => s + (toFloat(r['PONTOS']) || 0), 0);

  // Atualiza média global — usada por generateBadges()
  rankingMediaGeral = totalRespostas > 0 ? totalPontos / totalRespostas : 0;

  const mediaGeral = totalRespostas > 0
    ? rankingMediaGeral.toFixed(1).replace('.', ',')
    : '—';
  const lider = data.length > 0 ? data[0]['NOME'] : '—';

  if (rankingFirstLoad) {
    animateCounter(document.getElementById('statMembros'),   totalMembros,   900, v => String(Math.round(v)));
    animateCounter(document.getElementById('statRespostas'), totalRespostas, 900, v => String(Math.round(v)));
    if (totalRespostas > 0) {
      animateCounter(document.getElementById('statMedia'), rankingMediaGeral, 900,
        v => v.toFixed(1).replace('.', ','));
    } else {
      document.getElementById('statMedia').textContent = '—';
    }
  } else {
    document.getElementById('statMembros').textContent   = totalMembros;
    document.getElementById('statRespostas').textContent = totalRespostas;
    document.getElementById('statMedia').textContent     = mediaGeral;
  }

  document.getElementById('statLider').textContent = lider;
}

/* ============================================================
   RENDER — DESTAQUES DA TEMPORADA
   ============================================================ */
function renderDestaques(data) {
  if (data.length === 0) return;

  const liderPontos = data[0];

  const liderMedia = data.reduce((best, r) => {
    const m = toFloat(r['MÉDIA'] || r['MEDIA'] || '0') || 0;
    return m > best.val ? { nome: r['NOME'], val: m } : best;
  }, { nome: '—', val: -Infinity });

  const liderPart = data.reduce((best, r) => {
    const v = parseInt(r['RESPOSTAS'], 10) || 0;
    return v > best.val ? { nome: r['NOME'], val: v } : best;
  }, { nome: '—', val: -1 });

  document.getElementById('destPontosNome').textContent  = liderPontos['NOME'];
  document.getElementById('destPontosValor').textContent = formatPontos(liderPontos['PONTOS']);

  document.getElementById('destMediaNome').textContent  = liderMedia.nome;
  document.getElementById('destMediaValor').textContent = liderMedia.val > -Infinity
    ? liderMedia.val.toFixed(1).replace('.', ',')
    : '—';

  document.getElementById('destPartNome').textContent  = liderPart.nome;
  document.getElementById('destPartValor').textContent = liderPart.val >= 0 ? String(liderPart.val) : '—';

  document.getElementById('destaquesSection').hidden = false;
}

/* ============================================================
   HALL DA FAMA — configuração de dados
   ─────────────────────────────────────────────────────────────
   ⚠️  DADOS TEMPORÁRIOS — derivados da temporada atual.
   Para substituir por dados históricos reais no futuro:
     1. Criar aba "HallFama" no Google Sheets:
        CATEGORIA | NOME | VALOR | BADGE
     2. Buscar via gviz/tq como o ranking principal
     3. Substituir buildHallConfig() por parser dos dados reais
   ─────────────────────────────────────────────────────────────
   Estrutura de retorno (manter para compatibilidade futura):
     Array<{ icon, key, titulo, badge, nome, valor }>
   ============================================================ */
function buildHallConfig(data) {
  if (!data || data.length === 0) return null;

  // 🏆 Maior pontuação — líder da temporada
  const liderPontos = data[0];

  // ⚔️ Maior consistência — melhor média geral
  const liderMedia = data.reduce((best, r) => {
    const m = toFloat(r['MÉDIA'] || r['MEDIA'] || '0') || 0;
    return m > best.val ? { row: r, val: m } : best;
  }, { row: data[0], val: -Infinity });

  // 🔥 Mais temporadas — maior número de semanas ativas (respostas)
  const liderPart = data.reduce((best, r) => {
    const v = parseInt(r['RESPOSTAS'], 10) || 0;
    return v > best.val ? { row: r, val: v } : best;
  }, { row: data[0], val: -1 });

  // 📈 Maior evolução — melhor média entre membros com ≥ 2 respostas
  //    (exclui membros com amostra pequena para maior credibilidade)
  const ativos = data.filter(r => (parseInt(r['RESPOSTAS'], 10) || 0) >= 2);
  const liderEvolucao = (ativos.length > 0 ? ativos : data).reduce((best, r) => {
    const m = toFloat(r['MÉDIA'] || r['MEDIA'] || '0') || 0;
    return m > best.val ? { row: r, val: m } : best;
  }, { row: data[0], val: -Infinity });

  return [
    {
      icon:   '🏆',
      key:    'pontuacao',
      titulo: 'MAIOR PONTUAÇÃO',
      badge:  'RECORDE DA TEMPORADA',
      nome:   liderPontos['NOME'] || '—',
      valor:  formatPontos(liderPontos['PONTOS']) + ' pts',
    },
    {
      icon:   '⚔️',
      key:    'consistencia',
      titulo: 'MAIOR CONSISTÊNCIA',
      badge:  'MÉDIA MAIS ALTA',
      nome:   liderMedia.row['NOME'] || '—',
      valor:  liderMedia.val > -Infinity
                ? liderMedia.val.toFixed(1).replace('.', ',')
                : '—',
    },
    {
      icon:   '🔥',
      key:    'temporadas',
      titulo: 'MAIS TEMPORADAS',
      badge:  'MAIS SEMANAS ATIVO',
      nome:   liderPart.row['NOME'] || '—',
      valor:  liderPart.val >= 0 ? `${liderPart.val} semanas` : '—',
    },
    {
      icon:   '📈',
      key:    'evolucao',
      titulo: 'MAIOR EVOLUÇÃO',
      badge:  'MELHOR DESEMPENHO',
      nome:   liderEvolucao.row['NOME'] || '—',
      valor:  liderEvolucao.val > -Infinity
                ? liderEvolucao.val.toFixed(1).replace('.', ',')
                : '—',
    },
  ];
}

/* ============================================================
   RENDER — HALL DA FAMA
   ============================================================ */
function renderHallOfFame(data) {
  const section = document.getElementById('hofSection');
  const grid    = document.getElementById('hofGrid');
  if (!section || !grid) return;

  const config = buildHallConfig(data);
  if (!config) { section.hidden = true; return; }

  grid.innerHTML = config.map(card => `
    <div class="hof-card hof-${card.key}">
      <span class="hof-card-icon" aria-hidden="true">${card.icon}</span>
      <div class="hof-card-content">
        <p class="hof-card-titulo">${card.titulo}</p>
        <p class="hof-card-nome">${card.nome}</p>
        <p class="hof-card-valor">${card.valor}</p>
      </div>
      <p class="hof-card-badge">${card.badge}</p>
    </div>
  `).join('');

  section.hidden = false;
}

/* ============================================================
   RENDER — PÓDIO (top 3)
   ============================================================ */
function renderPodium(data) {
  const top3    = data.slice(0, 3);
  const section = document.getElementById('podiumSection');
  const el      = document.getElementById('podium');

  if (top3.length < 3) { section.hidden = true; return; }

  const labels  = ['1º lugar', '2º lugar', '3º lugar'];
  const classes = ['pos-1', 'pos-2', 'pos-3'];

  el.innerHTML = top3.map((row, i) => `
    <div class="podium-card ${classes[i]}">
      <div class="podium-rank">${labels[i]}</div>
      <div class="podium-name">${row['NOME']}</div>
      <div class="podium-pts">${formatPontos(row['PONTOS'])}</div>
      <div class="podium-pts-label">pontos</div>
    </div>
  `).join('');

  section.hidden = false;
}

/* ============================================================
   MOVIMENTO DE RANKING — localStorage
   Snapshot: { [nome]: posição } salvo a cada fetch bem-sucedido.
   Comparação: posição anterior vs posição atual (menor = melhor).
   ============================================================ */
const LS_KEY = 'CDO_ranking_v1';

function loadRankingSnapshot() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null; // localStorage bloqueado ou dados corrompidos
  }
}

function saveRankingSnapshot(data) {
  try {
    const snapshot = {};
    data.forEach(row => {
      const nome = row['NOME'];
      const pos  = parseInt(row['POSIÇÃO'] || row['POSICAO'] || '', 10);
      if (nome && !isNaN(pos)) snapshot[nome] = pos;
    });
    localStorage.setItem(LS_KEY, JSON.stringify(snapshot));
  } catch (e) {
    // Falha silenciosa — modo privado ou armazenamento cheio
  }
}

function computeMovement(prevSnapshot, currentData) {
  if (!prevSnapshot) return {}; // primeira visita — sem baseline

  const movement = {};
  currentData.forEach(row => {
    const nome     = row['NOME'];
    const posAtual = parseInt(row['POSIÇÃO'] || row['POSICAO'] || '', 10);

    if (!nome || isNaN(posAtual)) return;

    if (!(nome in prevSnapshot)) {
      movement[nome] = { type: 'new', delta: 0 };
      return;
    }

    const posAnterior = prevSnapshot[nome];
    const delta       = posAnterior - posAtual; // positivo = subiu (# menor = melhor)

    if      (delta > 0) movement[nome] = { type: 'up',   delta };
    else if (delta < 0) movement[nome] = { type: 'down', delta: Math.abs(delta) };
    else                movement[nome] = { type: 'same', delta: 0 };
  });

  return movement;
}

/* ============================================================
   RENDER — TABELA COMPLETA
   ============================================================ */
function renderTable(data, movement = {}) {
  const tbody = document.getElementById('rankingBody');
  const count = document.getElementById('tableCount');

  count.textContent = `${data.length} membros`;

  const rowClasses = { 1: 'row-top1', 2: 'row-top2', 3: 'row-top3' };
  const badgeClass = { 1: 'badge-gold', 2: 'badge-silver', 3: 'badge-bronze' };

  tbody.innerHTML = data.map(row => {
    const pos  = parseInt(row['POSIÇÃO'] || row['POSICAO'] || '', 10);
    const rc   = rowClasses[pos] || '';
    const bc   = badgeClass[pos] || 'badge-normal';
    const nome = row['NOME'];

    // Indicador de movimento — inline abaixo do badge de posição
    const mv = movement[nome];
    let moveHTML = '';
    if (mv) {
      if      (mv.type === 'up')   moveHTML = `<span class="move-indicator move-up">▲${mv.delta}</span>`;
      else if (mv.type === 'down') moveHTML = `<span class="move-indicator move-down">▼${mv.delta}</span>`;
      else if (mv.type === 'new')  moveHTML = `<span class="move-indicator move-new">+</span>`;
      else                         moveHTML = `<span class="move-indicator move-same">•</span>`;
    }

    return `
      <tr class="${rc}">
        <td class="col-pos">
          <span class="badge ${bc}">${isNaN(pos) ? '—' : pos}</span>
          ${moveHTML}
        </td>
        <td class="col-nome nome-cell">${nome}</td>
        <td class="col-resp">${row['RESPOSTAS'] || '—'}</td>
        <td class="col-pts"><span class="pts-val">${formatPontos(row['PONTOS'])}</span></td>
        <td class="col-med"><span class="med-val">${formatDecimal(row['MÉDIA'] || row['MEDIA'])}</span></td>
      </tr>
    `;
  }).join('');
}

/* ============================================================
   TIMESTAMP
   ============================================================ */
function updateTimestamp() {
  const el  = document.getElementById('updateLabel');
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2, '0');
  const mm  = String(now.getMinutes()).padStart(2, '0');
  el.innerHTML = `<span class="live-dot"></span>Atualizado às ${hh}:${mm}`;
}

/* ============================================================
   COUNTER ANIMADO — 0 → valor final com easing suave
   ============================================================ */
function animateCounter(el, target, duration, formatFn) {
  // Cada elemento guarda um ID de geração — cancela animação anterior
  const counterId = (el._counterId || 0) + 1;
  el._counterId   = counterId;

  if (target === 0) { el.textContent = formatFn(0); return; }

  const start = performance.now();

  function step(now) {
    if (el._counterId !== counterId) return; // cancelado por nova animação
    const elapsed  = Math.min(now - start, duration);
    const progress = elapsed / duration;
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cúbico
    const current  = target * eased;
    el.textContent = formatFn(progress >= 1 ? target : current);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/* ============================================================
   SKELETON — linhas de carregamento animadas
   ============================================================ */
function showSkeleton() {
  document.getElementById('rankingBody').innerHTML = Array.from({ length: 6 }, () => `
    <tr class="skeleton-row">
      <td class="col-pos"><span class="skel skel-badge"></span></td>
      <td class="col-nome"><span class="skel skel-name"></span></td>
      <td class="col-resp"><span class="skel skel-num"></span></td>
      <td class="col-pts"><span class="skel skel-num"></span></td>
      <td class="col-med"><span class="skel skel-num"></span></td>
    </tr>
  `).join('');
}

/* ============================================================
   MODAL — PERFIL DO MEMBRO
   ============================================================ */
function openModal(member) {
  currentModalMember = member;

  const pos       = parseInt(member['POSIÇÃO'] || member['POSICAO'] || '', 10);
  const nome      = member['NOME']      || '—';
  const pontos    = formatPontos(member['PONTOS']);
  const media     = formatDecimal(member['MÉDIA'] || member['MEDIA']);
  const respostas = member['RESPOSTAS'] || '—';

  // Avatar com iniciais
  document.getElementById('modalAvatar').textContent = getInitials(nome);

  // Badge de posição com cor do pódio
  const posBadge = document.getElementById('modalPos');
  posBadge.textContent = isNaN(pos) ? '—' : String(pos);
  posBadge.className   = 'modal-pos-badge';
  if      (pos === 1) posBadge.classList.add('pos-gold');
  else if (pos === 2) posBadge.classList.add('pos-silver');
  else if (pos === 3) posBadge.classList.add('pos-bronze');

  document.getElementById('modalNome').textContent   = nome;
  document.getElementById('modalStatus').textContent = generateStatus(member);

  // Counters animados
  const pontosNum    = toFloat(member['PONTOS']) || 0;
  const mediaNum     = toFloat(member['MÉDIA'] || member['MEDIA']) || 0;
  const respostasNum = parseInt(member['RESPOSTAS'], 10) || 0;

  animateCounter(document.getElementById('modalPontos'), pontosNum, 900,
    v => Number.isInteger(pontosNum)
      ? String(Math.round(v))
      : v.toFixed(1).replace('.', ','));
  animateCounter(document.getElementById('modalMedia'),     mediaNum,     900,
    v => v.toFixed(1).replace('.', ','));
  animateCounter(document.getElementById('modalRespostas'), respostasNum, 900,
    v => String(Math.round(v)));
  animateCounter(document.getElementById('modalStreak'),    respostasNum, 900,
    v => String(Math.round(v)));

  // Nível e barra de progresso
  const lvl      = generateLevel(member);
  const fillEl   = document.getElementById('modalProgressFill');

  document.getElementById('modalLevelText').textContent = `NV ${lvl.num} — ${lvl.name}`;
  document.getElementById('modalLevelPct').textContent  = `${lvl.progress}%`;

  // Animação: reset sem transição → força reflow → aplica com transição
  fillEl.style.transition = 'none';
  fillEl.style.width      = '0%';
  fillEl.classList.remove('is-max');
  void fillEl.offsetWidth; // força reflow
  fillEl.style.transition = '';
  fillEl.style.width      = `${lvl.progress}%`;

  // Estado de nível máximo — glow dourado pulsante
  if (lvl.isMax) fillEl.classList.add('is-max');

  const labelEl = document.getElementById('modalProgressLabel');
  if (lvl.isMax) {
    labelEl.textContent = 'NÍVEL MÁXIMO ATINGIDO';
  } else {
    labelEl.textContent = `PRÓXIMO NÍVEL: ${lvl.nextName}`;
  }

  // Badges geradas a partir dos dados reais
  const badges   = generateBadges(member);
  const badgesEl = document.getElementById('modalBadges');

  if (badges.length === 0) {
    badgesEl.innerHTML = '<p class="modal-badges-empty">Sem conquistas registradas ainda.</p>';
  } else {
    badgesEl.innerHTML = badges.map(b => `
      <div class="modal-badge" data-badge="${b.key}">
        <span class="modal-badge-icon">${b.icon}</span>
        <span>${b.label}</span>
      </div>
    `).join('');
  }

  document.getElementById('modalOverlay').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeModal(keepScrollLocked = false) {
  document.getElementById('modalOverlay').classList.remove('is-open');
  if (!keepScrollLocked) document.body.style.overflow = '';
}

/* ============================================================
   SHARE CARD — PERFIL COMPARTILHÁVEL
   ============================================================ */
function openShareCard(member) {
  const pos  = parseInt(member['POSIÇÃO'] || member['POSICAO'] || '', 10);
  const nome = member['NOME'] || '—';
  const lvl  = generateLevel(member);

  // Posição — badge colorido
  const sharePosEl     = document.getElementById('sharePos');
  sharePosEl.textContent = isNaN(pos) ? '' : `#${pos}`;
  sharePosEl.className   = 'share-pos';
  if      (pos === 1) sharePosEl.classList.add('pos-gold');
  else if (pos === 2) sharePosEl.classList.add('pos-silver');
  else if (pos === 3) sharePosEl.classList.add('pos-bronze');

  // Avatar com iniciais e cor do pódio
  const shareAvatarEl     = document.getElementById('shareAvatar');
  shareAvatarEl.textContent = getInitials(nome);
  shareAvatarEl.className   = 'share-avatar';
  if      (pos === 1) shareAvatarEl.classList.add('av-gold');
  else if (pos === 2) shareAvatarEl.classList.add('av-silver');
  else if (pos === 3) shareAvatarEl.classList.add('av-bronze');

  // Identidade
  document.getElementById('shareNome').textContent       = nome;
  document.getElementById('shareNivel').textContent      = `NV ${lvl.num} — ${lvl.name}`;
  document.getElementById('shareStatusText').textContent = generateStatus(member);

  // Stats
  document.getElementById('sharePontos').textContent = formatPontos(member['PONTOS']);
  document.getElementById('shareMedia').textContent   = formatDecimal(member['MÉDIA'] || member['MEDIA']);
  document.getElementById('shareResp').textContent    = member['RESPOSTAS'] || '—';

  // Badges — máx. 4 para caber no card
  const badges        = generateBadges(member);
  const shareBadgesEl = document.getElementById('shareBadgesCard');

  if (badges.length > 0) {
    shareBadgesEl.innerHTML = badges.slice(0, 4).map(b => `
      <div class="share-badge">
        <span class="share-badge-icon">${b.icon}</span>
        <span>${b.label}</span>
      </div>
    `).join('');
    shareBadgesEl.style.display = '';
  } else {
    shareBadgesEl.innerHTML     = '';
    shareBadgesEl.style.display = 'none';
  }

  // Temporada
  const now = new Date();
  document.getElementById('shareSeasonText').textContent =
    `TEMPORADA ${MESES[now.getMonth()].toUpperCase()} ${now.getFullYear()}`;

  // Web Share API — botão texto quando disponível (enhancement)
  const nativeBtn = document.getElementById('shareNative');
  if (navigator.share) {
    nativeBtn.hidden  = false;
    nativeBtn.onclick = () => {
      const pontos = formatPontos(member['PONTOS']);
      const media  = formatDecimal(member['MÉDIA'] || member['MEDIA']);
      navigator.share({
        title: `${nome} — Clube do Ódio`,
        text:  `${nome} · #${isNaN(pos) ? '?' : pos} no Ranking\n` +
               `NV ${lvl.num} ${lvl.name} · ${pontos} pts · Média ${media}\n` +
               `Clube do Ódio — Disciplina. Cobrança. Execução.`,
      }).catch(() => {});
    };
  } else {
    nativeBtn.hidden = true;
  }

  // Abre overlay
  document.getElementById('shareOverlay').classList.add('is-open');
}

function closeShareCard() {
  document.getElementById('shareOverlay').classList.remove('is-open');
  document.body.style.overflow = '';
}

/* ============================================================
   EVENTOS DO MODAL
   ============================================================ */
function initModal() {
  const overlay = document.getElementById('modalOverlay');

  document.getElementById('modalClose').addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('modalOverlay').classList.contains('is-open')) {
      closeModal();
    }
  });

  document.getElementById('rankingBody').addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row || row.classList.contains('skeleton-row')) return;

    const nomeEl = row.querySelector('.nome-cell');
    if (!nomeEl) return;

    const nome   = nomeEl.textContent.trim();
    const member = rankingData.find(r => r['NOME'] === nome);
    if (member) openModal(member);
  });
}

/* ============================================================
   EVENTOS DO SHARE CARD
   ============================================================ */
function initShareCard() {
  const overlay = document.getElementById('shareOverlay');

  // X fecha o share card
  document.getElementById('shareClose').addEventListener('click', closeShareCard);

  // Clique fora do card (no overlay escuro) fecha
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeShareCard();
  });

  // ESC fecha (somente se share card estiver aberto)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeShareCard();
    }
  });

  // Botão "Compartilhar Perfil" dentro do modal
  document.getElementById('modalShareBtn').addEventListener('click', () => {
    if (!currentModalMember) return;
    closeModal(true);                   // fecha modal, mantém scroll bloqueado
    openShareCard(currentModalMember);  // abre share card sobre o overlay escuro
  });
}

/* ============================================================
   ENTRADA CINEMATOGRÁFICA — anima seção de invisível para visível
   ============================================================ */
function animateSectionIn(selector, delay) {
  const el = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector;
  if (!el) return;
  setTimeout(() => {
    el.classList.remove('section-init');
    el.classList.add('section-ready');
  }, delay);
}

/* ============================================================
   LOAD — busca e renderiza dados
   ============================================================ */
async function loadRanking() {
  renderSeason();

  if (rankingFirstLoad) {
    showSkeleton();

    // Marca todas as seções como invisíveis para entrada cinematográfica
    ['.season-section', '.stats-section', '.podium-section', '.destaques-section', '.hof-section', '.table-section'].forEach(sel => {
      const el = document.querySelector(sel);
      if (el) el.classList.add('section-init');
    });

    // Temporada não depende de dados — entra primeiro (40 ms)
    requestAnimationFrame(() => animateSectionIn('.season-section', 40));
  }

  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    const data = parseCSV(text);

    if (data.length === 0) throw new Error('Sem dados');

    rankingData = data;

    // Carrega snapshot anterior → calcula movimento → renderiza → salva novo snapshot
    const prevSnapshot = loadRankingSnapshot();
    const movement     = computeMovement(prevSnapshot, data);

    renderPodium(data);
    renderTable(data, movement);
    renderStats(data);      // calcula rankingMediaGeral antes das badges
    renderDestaques(data);
    renderHallOfFame(data);
    updateTimestamp();

    // Persiste o snapshot atual para a próxima visita/refresh
    saveRankingSnapshot(data);

    if (rankingFirstLoad) {
      // Sequência cinematográfica: stats → pódio → destaques → tabela
      ['.stats-section', '.podium-section', '.destaques-section', '.hof-section', '.table-section'].forEach((sel, i) => {
        animateSectionIn(sel, 100 + i * 90);
      });
    }

    rankingFirstLoad = false;

  } catch (err) {
    // Em caso de erro, revela seções para não ficarem ocultas indefinidamente
    if (rankingFirstLoad) {
      document.querySelectorAll('.section-init').forEach(el => el.classList.remove('section-init'));
    }
    document.getElementById('rankingBody').innerHTML = `
      <tr>
        <td colspan="5" class="state-error">
          Não foi possível carregar o ranking. Tente recarregar a página.
        </td>
      </tr>
    `;
    document.getElementById('updateLabel').textContent = 'Erro ao atualizar';
    console.error('[Ranking] Erro:', err.message);
  }
}

/* ============================================================
   LOGO — guard de segurança (elemento pode não existir)
   ============================================================ */
const logoEl = document.getElementById('logo');
if (logoEl) logoEl.onerror = () => logoEl.style.display = 'none';

/* ============================================================
   INIT
   ============================================================ */
initModal();
initShareCard();
loadRanking();
setInterval(loadRanking, CONFIG.refreshMs);

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
   FORMATAÇÃO DE NÚMEROS (virgula BR)
   ============================================================ */
function toFloat(val) {
  if (!val) return NaN;
  return parseFloat(val.replace(',', '.'));
}

function formatDecimal(val, casas = 1) {
  const n = toFloat(val);
  if (isNaN(n)) return '—';
  return n.toFixed(casas).replace('.', ',');
}

function formatPontos(val) {
  const n = toFloat(val);
  if (isNaN(n)) return '—';
  // Se for inteiro exato, exibe sem decimal
  return Number.isInteger(n)
    ? String(n)
    : n.toFixed(1).replace('.', ',');
}

/* ============================================================
   RENDER — PÓDIO (top 3)
   ============================================================ */
function renderPodium(data) {
  const top3   = data.slice(0, 3);
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
   RENDER — TABELA COMPLETA
   ============================================================ */
function renderTable(data) {
  const tbody = document.getElementById('rankingBody');
  const count = document.getElementById('tableCount');

  count.textContent = `${data.length} membros`;

  const rowClasses = { 1: 'row-top1', 2: 'row-top2', 3: 'row-top3' };
  const badgeClass = { 1: 'badge-gold', 2: 'badge-silver', 3: 'badge-bronze' };

  tbody.innerHTML = data.map(row => {
    const pos = parseInt(row['POSIÇÃO'] || row['POSICAO'] || '', 10);
    const rc  = rowClasses[pos] || '';
    const bc  = badgeClass[pos]  || 'badge-normal';

    return `
      <tr class="${rc}">
        <td class="col-pos">
          <span class="badge ${bc}">${isNaN(pos) ? '—' : pos}</span>
        </td>
        <td class="col-nome nome-cell">${row['NOME']}</td>
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
   LOAD — busca e renderiza dados
   ============================================================ */
async function loadRanking() {
  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    const data = parseCSV(text);

    if (data.length === 0) throw new Error('Sem dados');

    renderPodium(data);
    renderTable(data);
    updateTimestamp();

  } catch (err) {
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
   LOGO — esconde se não encontrar o arquivo
   ============================================================ */
const logoEl = document.getElementById('logo');
logoEl.onerror = () => logoEl.style.display = 'none';

/* ============================================================
   INIT
   ============================================================ */
loadRanking();
setInterval(loadRanking, CONFIG.refreshMs);

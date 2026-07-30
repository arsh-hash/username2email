// ── Generators ──────────────────────────────────────────────────────────────
const clean   = s => s.replace(/[^a-z0-9]/g, '').toLowerCase();
const inRange = s => s.length >= 6 && s.length <= 30;
const prepend = (emails, base, domain) =>
  (base.length >= 6 && base.length <= 30) ? [base + domain, ...emails] : emails;

const gens = {
  b1: (f, l, a, domain, s, e) => {
    const em = range(s, e)
      .map(i => { const lc = `${f}${i}`; return inRange(lc) ? lc + domain : null; })
      .filter(Boolean);
    return prepend(em, f, domain);
  },
  b2: (f, l, a, domain, s, e) => {
    const base = f + l;
    const em = range(s, e)
      .map(i => { const lc = `${base}${i}`; return inRange(lc) ? lc + domain : null; })
      .filter(Boolean);
    return prepend(em, base, domain);
  },
  b3: (f, l, a, domain, s, e) => {
    const base = l + f;
    const em = range(s, e)
      .map(i => { const lc = `${base}${i}`; return inRange(lc) ? lc + domain : null; })
      .filter(Boolean);
    return prepend(em, base, domain);
  },
  b4: (f, l, a, domain, s, e) => {
    const base = f + l + a;
    const em = range(s, e)
      .map(i => { const lc = `${base}${i}`; return inRange(lc) ? lc + domain : null; })
      .filter(Boolean);
    return prepend(em, base, domain);
  },
  b5: (f, l, a, domain, s, e) => {
    const base = a + f + l;
    const em = range(s, e)
      .map(i => { const lc = `${base}${i}`; return inRange(lc) ? lc + domain : null; })
      .filter(Boolean);
    return prepend(em, base, domain);
  },
  b6: (f, l, a, domain) => {
    const base = f + l;
    const em = [];
    for (let c = 97; c <= 122; c++) {
      const lc = String.fromCharCode(c) + base;
      if (inRange(lc)) em.push(lc + domain);
    }
    return prepend(em, base, domain);
  },
  b7: (f, l, a, domain) => {
    const base = f + l;
    const em = [];
    for (let d = 0; d <= 9; d++) {
      for (let r = 1; r <= 7; r++) {
        const lc = base + String(d).repeat(r);
        if (inRange(lc)) em.push(lc + domain);
      }
    }
    return prepend(em, base, domain);
  },
  b8: (f, l, a, domain, s, e) => {
    const base = f + (l[0] || '');
    const em = range(s, e)
      .map(i => { const lc = `${base}${i}`; return inRange(lc) ? lc + domain : null; })
      .filter(Boolean);
    return prepend(em, base, domain);
  },
};

const BATCH_META = [
  { key: 'b1', label: 'Basic',     desc: 'first + numbers' },
  { key: 'b2', label: 'Standard',  desc: 'first + last + numbers' },
  { key: 'b3', label: 'Reverse',   desc: 'last + first + numbers' },
  { key: 'b4', label: 'Extended',  desc: 'first + last + add-up + numbers' },
  { key: 'b5', label: 'Add-up',    desc: 'add-up + first + last + numbers' },
  { key: 'b6', label: 'Prefix',    desc: 'a-z + first + last' },
  { key: 'b7', label: 'Patterned', desc: 'first + last + digit patterns' },
  { key: 'b8', label: 'Initial',   desc: 'first + last initial + numbers' },
];

function range(s, e) {
  return [...Array(Math.max(0, e - s + 1))].map((_, i) => i + s);
}

// ── State ────────────────────────────────────────────────────────────────────
let _batches   = [];
let _allUnique = [];

// ── Tag classifier ────────────────────────────────────────────────────────────
function tagClass(email, domain, f, l, a) {
  const local = email.slice(0, email.lastIndexOf(domain));
  const bases  = [f, f + l, l + f, f + l + a, a + f + l, f + (l[0] || '')].filter(Boolean);
  if (bases.includes(local))         return 't-base';
  if (/[a-z]$/.test(local))          return 't-alpha';
  if (/(.)\1{2,}$/.test(local))      return 't-pattern';
  return 't-num';
}

// ── Generate ──────────────────────────────────────────────────────────────────
function generate() {
  const f = clean(document.getElementById('first').value);
  const l = clean(document.getElementById('last').value);
  const a = clean(document.getElementById('addup').value);
  const s = parseInt(document.getElementById('start').value)  || 0;
  const e = parseInt(document.getElementById('end').value)    || 99;
  const d = document.getElementById('domain').value.trim()   || '@gmail.com';

  if (!f) {
    document.getElementById('first').focus();
    flashMsg('⚠ first name required');
    return;
  }

  // get selected batch keys from checkboxes
  const selected = new Set(
    [...document.querySelectorAll('#batchChecks input[type=checkbox]:checked')]
      .map(cb => cb.value)
  );

  if (!selected.size) { flashMsg('\u26a0 select at least one batch'); return; }

  _batches = BATCH_META
    .filter(meta => selected.has(meta.key))
    .map(meta => {
      const fn     = gens[meta.key];
      const emails = fn(f, l, a, d, s, e);
      return { ...meta, emails: [...new Set(emails)] };
    });

  _allUnique = [...new Set(_batches.flatMap(b => b.emails))];

  // Update stats
  const bar = document.getElementById('statsBar');
  document.getElementById('sTotal').textContent   = _batches.reduce((n, b) => n + b.emails.length, 0).toLocaleString();
  document.getElementById('sUnique').textContent  = _allUnique.length.toLocaleString();
  document.getElementById('sBatches').textContent = _batches.filter(b => b.emails.length > 0).length;
  bar.classList.add('visible');

  renderBatches(f, l, a, d);
}

// ── Render ────────────────────────────────────────────────────────────────────
const PREVIEW = 10;

function renderBatches(f, l, a, d) {
  const out = document.getElementById('output');

  if (!_batches.some(b => b.emails.length)) {
    out.innerHTML = '<div class="empty-state"><span class="big">∅</span>no emails generated — check your inputs</div>';
    return;
  }

  out.innerHTML = '';

  _batches.forEach((batch, idx) => {
    if (!batch.emails.length) return;

    const card = document.createElement('div');
    card.className = 'batch-card';
    card.style.animationDelay = `${idx * 0.03}s`;

    // ── Header ──
    const header = document.createElement('div');
    header.className = 'batch-header';
    header.innerHTML = `
      <div class="batch-left">
        <span class="batch-id">B${idx + 1}</span>
        <span class="batch-name">${batch.label}</span>
      </div>
      <div class="batch-right">
        <span class="count-pill">${batch.emails.length.toLocaleString()}</span>
        <button class="copy-batch-btn" onclick="copyBatch(this,${idx})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          copy
        </button>
      </div>`;
    card.appendChild(header);

    // ── Preview email list ──
    const previewList = document.createElement('div');
    previewList.className = 'email-list';
    previewList.id = `list-${idx}`;

    // pattern descriptor row
    const descRow = document.createElement('div');
    descRow.className = 'pattern-desc';
    descRow.textContent = batch.desc;
    previewList.appendChild(descRow);

    batch.emails.slice(0, PREVIEW).forEach(email => {
      previewList.appendChild(makeRow(email, d, f, l, a));
    });
    card.appendChild(previewList);

    // ── Rest (collapsed) ──
    if (batch.emails.length > PREVIEW) {
      const rest = batch.emails.slice(PREVIEW);

      const restList = document.createElement('div');
      restList.className = 'email-list';
      restList.id = `rest-${idx}`;
      restList.style.display = 'none';
      rest.forEach(email => restList.appendChild(makeRow(email, d, f, l, a)));
      card.appendChild(restList);

      const expandBtn = document.createElement('button');
      expandBtn.className = 'expand-btn';
      expandBtn.textContent = `▸ show ${rest.length} more`;
      expandBtn.onclick = () => {
        const open = restList.style.display !== 'none';
        restList.style.display = open ? 'none' : 'flex';
        expandBtn.textContent = open ? `▸ show ${rest.length} more` : '▴ show less';
      };
      card.appendChild(expandBtn);
    }

    // ── Footer legend ──
    const footer = document.createElement('div');
    footer.className = 'batch-footer';
    footer.innerHTML = `
      <div class="legend">
        <span class="legend-item"><span class="ldot" style="background:var(--accent)"></span>base</span>
        <span class="legend-item"><span class="ldot" style="background:var(--green2)"></span>+number</span>
        <span class="legend-item"><span class="ldot" style="background:var(--purple)"></span>+letter</span>
        <span class="legend-item"><span class="ldot" style="background:var(--amber)"></span>pattern</span>
      </div>
      <span class="hint">click row → copy email</span>`;
    card.appendChild(footer);

    out.appendChild(card);
  });
}

// ── Build a single vertical row ───────────────────────────────────────────────
function makeRow(email, domain, f, l, a) {
  const cls  = tagClass(email, domain, f, l, a);
  const row  = document.createElement('div');
  row.className = `erow ${cls}`;
  row.title     = 'click to copy';

  row.innerHTML = `
    <div class="erow-left">
      <span class="erow-dot"></span>
      <span class="erow-email">${email}</span>
    </div>
    <span class="erow-copy">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2"/>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
      </svg>
    </span>`;

  row.onclick = () => {
    navigator.clipboard.writeText(email).then(() => {
      row.classList.add('copied');
      row.querySelector('.erow-email').textContent = '✓ ' + email;
      setTimeout(() => {
        row.classList.remove('copied');
        row.querySelector('.erow-email').textContent = email;
      }, 1200);
    });
  };

  return row;
}

// ── Copy helpers ──────────────────────────────────────────────────────────────
function copyBatch(btn, idx) {
  const emails = _batches[idx]?.emails || [];
  navigator.clipboard.writeText(emails.join('\n')).then(() => {
    btn.classList.add('done');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20,6 9,17 4,12"/>
      </svg>
      copied ${emails.length}`;
    flashMsg(`✓ batch ${idx + 1} — ${emails.length} emails copied`);
    setTimeout(() => {
      btn.classList.remove('done');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
        copy batch`;
    }, 2000);
  });
}

function copyAll() {
  if (!_allUnique.length) { generate(); return; }
  navigator.clipboard.writeText(_allUnique.join('\n')).then(() => {
    flashMsg(`✓ ${_allUnique.length} unique emails copied to clipboard`);
  });
}

function clearAll() {
  _batches = []; _allUnique = [];
  document.getElementById('statsBar').classList.remove('visible');
  document.getElementById('output').innerHTML = `
    <div class="empty-state">
      <span class="big">⌘</span>
      fill in target info and hit <strong>run all batches</strong>
    </div>`;
  ['first', 'last', 'addup'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('start').value  = '0';
  document.getElementById('end').value    = '99';
  document.getElementById('domain').value = '@gmail.com';
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let flashTimer;
function flashMsg(msg) {
  const el = document.getElementById('flash');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

// ── Enter key ─────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.activeElement.tagName === 'INPUT') generate();
});

// ── Batch toggle all ──────────────────────────────────────────────────────────
function toggleAllBatches(btn) {
  const boxes = document.querySelectorAll('#batchChecks input[type=checkbox]');
  const allChecked = [...boxes].every(cb => cb.checked);
  boxes.forEach(cb => cb.checked = !allChecked);
  btn.textContent = allChecked ? 'select all' : 'deselect all';
}

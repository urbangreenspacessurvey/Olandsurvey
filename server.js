const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Database (Southern Öland only)
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'survey.db');
const db = new sqlite3.Database(DB_PATH);

// Question columns: Q1-1..Q1-11 and Q2-1..Q2-9
const Q1_COLS = Array.from({ length: 11 }, (_, i) => `q1_${i + 1}`);
const Q2_COLS = Array.from({ length: 9 }, (_, i) => `q2_${i + 1}`);

const DEMO_COLS = [
  'language',
  'age',
  'sex',
  'education',
  'residence',
  'stay_length',
  'zip_code',
  'tourism_work',
  'tourism_job_categories', // JSON array string
];

const PINS_COL = 'attraction_pins'; // JSON array string

// Helpers
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Create/upgrade schema: create full table if missing; otherwise add missing columns
async function ensureSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS oland_surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const info = await all(`PRAGMA table_info(oland_surveys)`);
  const existing = new Set(info.map(r => r.name));

  const desired = [
    ...Q1_COLS.map(c => [c, 'TEXT']),
    ...Q2_COLS.map(c => [c, 'TEXT']),
    ...DEMO_COLS.map(c => [c, 'TEXT']),
    [PINS_COL, 'TEXT'],
    ['consent', 'INTEGER'],
  ];

  for (const [name, type] of desired) {
    if (!existing.has(name)) {
      await run(`ALTER TABLE oland_surveys ADD COLUMN ${name} ${type}`);
    }
  }
}

ensureSchema().catch(e => console.error('Schema init error:', e));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Accept JSON from app.js
app.post('/submit', async (req, res) => {
  try {
    const body = req.body || {};

    const consent = body.consent ? 1 : 0;
    if (!consent) {
      return res.status(400).json({ success: false, error: 'Consent required' });
    }

    // responses can come flattened (q1_1 etc) OR inside body.responses JSON
    let responsesObj = {};
    if (body.responses) {
      if (typeof body.responses === 'string') {
        try { responsesObj = JSON.parse(body.responses); } catch { responsesObj = {}; }
      } else if (typeof body.responses === 'object') {
        responsesObj = body.responses;
      }
    }

    // Build values in the order required for DB insert
    const cols = [
      ...Q1_COLS,
      ...Q2_COLS,
      ...DEMO_COLS,
      PINS_COL,
      'consent',
    ];

    const values = cols.map((c) => {
      if (c === 'consent') return consent;

      // pins
      if (c === PINS_COL) {
        const pins = body.attraction_pins
          ? (typeof body.attraction_pins === 'string' ? safeJson(body.attraction_pins, []) : body.attraction_pins)
          : (body.pins ? body.pins : []);
        return JSON.stringify(Array.isArray(pins) ? pins : []);
      }

      // job categories
      if (c === 'tourism_job_categories') {
        const jobs = body.tourism_job_categories || body.job_categories || [];
        if (typeof jobs === 'string') return jobs; // assume already JSON
        return JSON.stringify(Array.isArray(jobs) ? jobs : []);
      }

      // question columns
      if (c.startsWith('q1_') || c.startsWith('q2_')) {
        // prefer flattened, then responsesObj
        return body[c] ?? responsesObj[c] ?? null;
      }

      // demographics
      return body[c] ?? null;
    });

    const placeholders = cols.map(() => '?').join(',');
    const sql = `INSERT INTO oland_surveys (${cols.join(',')}) VALUES (${placeholders})`;

    await run(sql, values);

    return res.json({ success: true });
  } catch (e) {
    console.error('Submit error:', e);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

function safeJson(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

// Database UI: header order exactly as requested
app.get('/database', async (req, res) => {
  try {
    const header = ['id', ...Q1_COLS.map(c => c.toUpperCase().replace('_', '-')), ...Q2_COLS.map(c => c.toUpperCase().replace('_', '-')),
      'language','age','sex','education','residence','stay_length','zip_code','tourism_work','tourism_job_categories',PINS_COL,'created_at'
    ];

    // select using real column names
    const selectCols = ['id', ...Q1_COLS, ...Q2_COLS, ...DEMO_COLS, PINS_COL, 'created_at'];
    const rows = await all(`SELECT ${selectCols.join(', ')} FROM oland_surveys ORDER BY id DESC`);

    const th = header.map(h => `<th>${escapeHtml(h)}</th>`).join('');

    const tr = rows.map(r => {
      const tds = selectCols.map(c => `<td>${escapeHtml(r[c] ?? '')}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');

    res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Öland Survey Database</title>
<style>
  :root { --g:#1f6f3a; --bg:#f5faf7; }
  body { margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; background:var(--bg); }
  .wrap{ max-width: 1600px; margin:0 auto; padding: 18px 14px 50px; }
  .top{ display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
  h1{ margin:0; color:var(--g); }
  .btn{ display:inline-flex; gap:10px; align-items:center; background:var(--g); color:#fff; text-decoration:none; padding:10px 14px; border-radius:10px; font-weight:800; }
  .btn.secondary{ background:#fff; color:var(--g); border:2px solid var(--g); }
  .card{ margin-top:14px; background:#fff; border-radius:14px; border:1px solid #e5e7eb; box-shadow:0 10px 26px rgba(0,0,0,.06); overflow:hidden; }
  .table-wrap{ overflow:auto; }
  table{ width:100%; border-collapse:collapse; min-width: 1600px; }
  th{ position:sticky; top:0; background:var(--g); color:#fff; text-align:left; padding:10px; font-size:13px; white-space:nowrap; }
  td{ padding:10px; border-top:1px solid #e5e7eb; vertical-align:top; font-size:13px; white-space:nowrap; }
  td:nth-last-child(2), td:nth-last-child(3){ white-space:normal; max-width:520px; }

/* ==== FIX: wrap long JSON in database table (attraction_pins) ==== */
table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px;
  vertical-align: top;
  text-align: left;
}

th {
  background: #1f6f3a;
  color: white;
  position: sticky;
  top: 0;
  z-index: 2;
}

/* Allow long JSON (pins) to wrap */
td {
  white-space: normal !important;
  word-break: break-word;
  max-width: 600px;
}

td.attraction-pins,
td.pins,
td:last-child {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: monospace;
  font-size: 13px;
}

</style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div>
        <h1>Southern Öland Tourism Survey — Database</h1>
        <div style="color:#475569;font-weight:700;margin-top:4px;">Rows: <strong>${rows.length}</strong></div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a class="btn" href="/download-csv">⬇️ Download CSV</a>
        <a class="btn secondary" href="/">← Back to Survey</a>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr>${th}</tr></thead>
          <tbody>${tr}</tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>`);
  } catch (e) {
    console.error('DB view error:', e);
    res.status(500).send('Database error');
  }
});

app.get('/download-csv', async (req, res) => {
  try {
    const cols = ['id', ...Q1_COLS, ...Q2_COLS, ...DEMO_COLS, PINS_COL, 'created_at'];
    const rows = await all(`SELECT ${cols.join(', ')} FROM oland_surveys ORDER BY id ASC`);

    const esc = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lines = [cols.join(',')];
    for (const r of rows) {
      lines.push(cols.map(c => esc(r[c])).join(','));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="oland_surveys.csv"');
    res.send(lines.join('\n'));
  } catch (e) {
    console.error('CSV error:', e);
    res.status(500).send('CSV error');
  }
});

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

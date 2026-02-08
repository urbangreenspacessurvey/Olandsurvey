const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json({ limit: '2mb' }));

const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR));

const DB_PATH = path.join(__dirname, 'survey.db');
const db = new sqlite3.Database(DB_PATH);

// Columns in the order YOU requested:
// ID, q1_1..q1_11, q2_1..q2_9, demographics, pins
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
  'job_categories_json',
];
const ALL_COLS = [...Q1_COLS, ...Q2_COLS, ...DEMO_COLS, 'pins_json'];

function initDb() {
  const cols = [
    `id INTEGER PRIMARY KEY AUTOINCREMENT`,
    `created_at TEXT DEFAULT (datetime('now'))`,
    ...Q1_COLS.map(c => `${c} TEXT`),
    ...Q2_COLS.map(c => `${c} TEXT`),
    `language TEXT`,
    `age TEXT`,
    `sex TEXT`,
    `education TEXT`,
    `residence TEXT`,
    `stay_length TEXT`,
    `zip_code TEXT`,
    `tourism_work TEXT`,
    `job_categories_json TEXT`,
    `pins_json TEXT`,
  ].join(',\n');

  db.run(`CREATE TABLE IF NOT EXISTS oland_surveys (${cols});`);
}
initDb();

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.post('/submit', (req, res) => {
  try {
    const body = req.body || {};

    if (!body.consent) {
      return res.status(400).json({ success: false, error: 'Consent required' });
    }

    // Prepare row values
    const row = {};

    // Questions
    for (const c of Q1_COLS) row[c] = body[c] ?? null;
    for (const c of Q2_COLS) row[c] = body[c] ?? null;

    // Demographics
    row.language = body.language ?? null;
    row.age = body.age ?? null;
    row.sex = body.sex ?? null;
    row.education = body.education ?? null;
    row.residence = body.residence ?? null;
    row.stay_length = body.stay_length ?? null;
    row.zip_code = body.zip_code ?? null;
    row.tourism_work = body.tourism_work ?? null;

    // Job categories (checkboxes)
    const jobs = Array.isArray(body.tourism_job_categories) ? body.tourism_job_categories : [];
    row.job_categories_json = JSON.stringify(jobs);

    // Pins
    const pins = Array.isArray(body.pins) ? body.pins : [];
    row.pins_json = JSON.stringify(pins);

    const columns = ALL_COLS;
    const placeholders = columns.map(() => '?').join(',');
    const values = columns.map(c => row[c] ?? null);

    db.run(
      `INSERT INTO oland_surveys (${columns.join(',')}) VALUES (${placeholders})`,
      values,
      function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ success: false, error: 'DB insert failed' });
        }
        return res.json({ success: true, id: this.lastID });
      }
    );
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/database', (req, res) => {
  db.all(`SELECT id, created_at, ${ALL_COLS.join(', ')} FROM oland_surveys ORDER BY id DESC`, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }

    const headerCols = ['id', ...Q1_COLS, ...Q2_COLS, ...DEMO_COLS, 'pins_json'];
    const ths = headerCols.map(c => `<th>${c}</th>`).join('');

    const trs = rows.map(r => {
      const tds = headerCols.map(c => {
        let v = r[c];
        if (v === null || v === undefined) v = '';
        const safe = String(v)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;');
        return `<td>${safe}</td>`;
      }).join('');
      return `<tr>${tds}</tr>`;
    }).join('');

    res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Öland Survey Database</title>
<style>
  :root{ --g:#1f6f3a; --bg:#f5faf7; }
  body{ margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background:var(--bg); color:#0f172a; }
  .wrap{ max-width: 1400px; margin: 0 auto; padding: 18px 14px 50px; }
  h1{ margin: 6px 0 14px; color:var(--g); }
  .top{ display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
  .btn{ display:inline-flex; gap:10px; align-items:center; background:var(--g); color:#fff; text-decoration:none; padding:10px 14px; border-radius:10px; font-weight:800; }
  .btn.secondary{ background:#fff; color:var(--g); border:2px solid var(--g); }
  .card{ background:#fff; border-radius:14px; border:1px solid #e5e7eb; box-shadow:0 10px 26px rgba(0,0,0,.06); overflow:hidden; }
  .table-wrap{ overflow:auto; }
  table{ width:100%; border-collapse:collapse; min-width: 1400px; }
  th{ position:sticky; top:0; background:var(--g); color:#fff; text-align:left; padding:10px; font-size:13px; }
  td{ padding:10px; border-top:1px solid #e5e7eb; vertical-align:top; font-size:13px; white-space:nowrap; }
  td:last-child{ white-space:normal; max-width: 520px; }
  .meta{ color:#475569; font-weight:700; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div>
        <h1>Southern Öland Tourism Survey — Database</h1>
        <div class="meta">Table: <strong>oland_surveys</strong> • Rows: <strong>${rows.length}</strong></div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a class="btn" href="/download-csv">⬇️ Download CSV</a>
        <a class="btn secondary" href="/">← Back to Survey</a>
      </div>
    </div>

    <div class="card" style="margin-top:14px;">
      <div class="table-wrap">
        <table>
          <thead><tr>${ths}</tr></thead>
          <tbody>${trs}</tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>`);
  });
});

app.get('/download-csv', (req, res) => {
  const cols = ['id', ...Q1_COLS, ...Q2_COLS, ...DEMO_COLS, 'pins_json', 'created_at'];
  db.all(`SELECT ${cols.join(', ')} FROM oland_surveys ORDER BY id ASC`, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
      return s;
    };
    const lines = [];
    lines.push(cols.join(','));
    for (const r of rows) {
      lines.push(cols.map(c => escapeCsv(r[c])).join(','));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="oland_surveys.csv"');
    res.send(lines.join('\n'));
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const DB_PATH = path.join(__dirname, 'survey.db');
const db = new sqlite3.Database(DB_PATH);

// ---- Schema (Southern Öland only) ----
const Q1_COLS = Array.from({ length: 11 }, (_, i) => `q1_${i + 1} TEXT`).join(',\n  ');
const Q2_COLS = Array.from({ length: 9 }, (_, i) => `q2_${i + 1} TEXT`).join(',\n  ');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS oland_surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      language TEXT,
      consent INTEGER,

      age TEXT,
      sex TEXT,
      education TEXT,
      residence TEXT,
      stay_length TEXT,
      zip_code TEXT,
      tourism_work TEXT,
      job_categories_json TEXT,

      ${Q1_COLS},
      ${Q2_COLS},

      pins_json TEXT
    )
  `);
});

// ---- Helpers ----
function safeJsonStringify(v) {
  try { return JSON.stringify(v ?? null); } catch { return 'null'; }
}

function normalizeSurveyPayload(body) {
  // Expected from the new frontend:
  // { language, consent, age, sex, education, residence, stay_length, zip_code, tourism_work,
  //   tourism_job_categories: [], responses: {q1_1: "1", ...}, attraction_pins: [...] }
  const responses = typeof body.responses === 'string' ? (JSON.parse(body.responses) || {}) : (body.responses || {});
  const pins = typeof body.attraction_pins === 'string' ? (JSON.parse(body.attraction_pins) || []) : (body.attraction_pins || []);
  const jobs = body.tourism_job_categories || body.job_categories || [];
  return {
    language: body.language || 'en',
    consent: body.consent ? 1 : 0,
    age: body.age || null,
    sex: body.sex || null,
    education: body.education || null,
    residence: body.residence || null,
    stay_length: body.stay_length || null,
    zip_code: body.zip_code || null,
    tourism_work: body.tourism_work || null,
    job_categories_json: safeJsonStringify(jobs),
    responses,
    pins_json: safeJsonStringify(pins),
  };
}

function buildInsert(payload) {
  const cols = [
    'language','consent','age','sex','education','residence','stay_length','zip_code','tourism_work','job_categories_json',
    ...Array.from({ length: 11 }, (_, i) => `q1_${i+1}`),
    ...Array.from({ length: 9 }, (_, i) => `q2_${i+1}`),
    'pins_json'
  ];

  const values = [];
  values.push(payload.language);
  values.push(payload.consent);
  values.push(payload.age);
  values.push(payload.sex);
  values.push(payload.education);
  values.push(payload.residence);
  values.push(payload.stay_length);
  values.push(payload.zip_code);
  values.push(payload.tourism_work);
  values.push(payload.job_categories_json);

  for (let i = 1; i <= 11; i++) values.push(payload.responses[`q1_${i}`] ?? null);
  for (let i = 1; i <= 9; i++) values.push(payload.responses[`q2_${i}`] ?? null);

  values.push(payload.pins_json);

  const placeholders = cols.map(() => '?').join(',');
  const sql = `INSERT INTO oland_surveys (${cols.join(',')}) VALUES (${placeholders})`;
  return { sql, values };
}

// ---- Routes ----
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/submit', (req, res) => {
  try {
    const payload = normalizeSurveyPayload(req.body || {});
    if (!payload.consent) return res.status(400).json({ success: false, error: 'consent_required' });

    const { sql, values } = buildInsert(payload);
    db.run(sql, values, function (err) {
      if (err) {
        console.error('DB insert error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      return res.json({ success: true, id: this.lastID });
    });
  } catch (e) {
    console.error('Submit error:', e);
    return res.status(400).json({ success: false, error: 'bad_request' });
  }
});

app.get('/database', (req, res) => {
  db.all(`SELECT * FROM oland_surveys ORDER BY id DESC LIMIT 500`, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }

    const headerCols = [
      'ID','Created','Lang','Age','Sex','Education','Residence','Stay length','Zip','Tourism work','Job categories',
      ...Array.from({ length: 11 }, (_, i) => `Q${i+1}`),
      ...Array.from({ length: 9 }, (_, i) => `Q${i+12}`),
      'Pins (JSON)'
    ];

    const css = `
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0;background:#f4fbf6;color:#123;}
      .topbar{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;background:#1f6a3c;color:#fff;}
      .topbar h1{font-size:18px;margin:0;font-weight:800;letter-spacing:.3px}
      .actions{display:flex;gap:10px;align-items:center}
      .btn{background:#fff;color:#1f6a3c;border:0;padding:10px 14px;border-radius:10px;font-weight:800;cursor:pointer;text-decoration:none;display:inline-flex;gap:8px;align-items:center}
      .btn:hover{opacity:.92}
      .wrap{padding:18px 22px}
      .card{background:#fff;border-radius:16px;box-shadow:0 6px 20px rgba(0,0,0,.08);overflow:hidden}
      .meta{padding:14px 16px;border-bottom:1px solid #e7f2ea;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
      .meta .pill{background:#eaf7ef;color:#1f6a3c;padding:6px 10px;border-radius:999px;font-weight:800}
      .table-wrap{overflow:auto;max-width:100%}
      table{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%}
      thead th{position:sticky;top:0;background:#1f6a3c;color:#fff;padding:10px 12px;font-size:13px;white-space:nowrap}
      tbody td{padding:10px 12px;border-bottom:1px solid #eef6f0;font-size:13px;white-space:nowrap;vertical-align:top}
      tbody tr:nth-child(even){background:#fbfffc}
      .json{max-width:420px;white-space:pre-wrap;word-break:break-word}
    `;

    const toCell = (v, json=false) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (!json) return s;
      return `<div class="json">${escapeHtml(s)}</div>`;
    };

    const escapeHtml = (str) =>
      String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

    const bodyRows = rows.map(r => {
      const job = r.job_categories_json || '';
      const cells = [
        r.id,
        r.created_at,
        r.language,
        r.age,
        r.sex,
        r.education,
        r.residence,
        r.stay_length,
        r.zip_code,
        r.tourism_work,
        job,
        ...Array.from({ length: 11 }, (_, i) => r[`q1_${i+1}`]),
        ...Array.from({ length: 9 }, (_, i) => r[`q2_${i+1}`]),
        r.pins_json
      ];

      return `<tr>${cells.map((c, idx) => {
        const isJson = (idx === 10) || (idx === cells.length-1);
        return `<td class="${isJson?'json':''}">${isJson ? toCell(c,true) : toCell(c)}</td>`;
      }).join('')}</tr>`;
    }).join('');

    const html = `
      <!doctype html>
      <html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
      <title>Southern Öland Survey Database</title><style>${css}</style></head>
      <body>
        <div class="topbar">
          <h1>Southern Öland Tourism Survey Database (English/Svenska)</h1>
          <div class="actions">
            <a class="btn" href="/download-csv">⬇️ Download CSV</a>
            <a class="btn" href="/">← Back to Survey</a>
          </div>
        </div>
        <div class="wrap">
          <div class="card">
            <div class="meta">
              <div class="pill">Table: oland_surveys</div>
              <div class="pill">Rows shown: ${rows.length}</div>
            </div>
            <div class="table-wrap">
              <table>
                <thead><tr>${headerCols.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
                <tbody>${bodyRows}</tbody>
              </table>
            </div>
          </div>
        </div>
      </body></html>
    `;
    res.send(html);
  });
});

app.get('/download-csv', (req, res) => {
  db.all(`SELECT * FROM oland_surveys ORDER BY id ASC`, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }

    const cols = [
      'id','created_at','language','consent','age','sex','education','residence','stay_length','zip_code','tourism_work','job_categories_json',
      ...Array.from({ length: 11 }, (_, i) => `q1_${i+1}`),
      ...Array.from({ length: 9 }, (_, i) => `q2_${i+1}`),
      'pins_json'
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="oland_surveys.csv"');

    // Write header
    res.write(cols.join(',') + '\n');

    for (const r of rows) {
      const line = cols.map(c => {
        const val = r[c];
        const s = (val === null || val === undefined) ? '' : String(val);
        // CSV escape
        if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
          return '"' + s.replaceAll('"','""') + '"';
        }
        return s;
      }).join(',');
      res.write(line + '\n');
    }
    res.end();
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

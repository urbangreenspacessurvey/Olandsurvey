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

// Database (NEW: only Southern Öland survey)
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'survey.db');
const db = new sqlite3.Database(DB_PATH);

// Create schema
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
      tourism_job_categories TEXT, -- JSON array string
      responses TEXT,              -- JSON object string (likert answers)
      attraction_pins TEXT         -- JSON array string [{lat,lng,category,name}]
    )
  `);
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Insert submission
app.post('/submit', (req, res) => {
  try {
    const body = req.body || {};

    const payload = {
      language: body.language || null,
      consent: body.consent ? 1 : 0,
      age: body.age || null,
      sex: body.sex || null,
      education: body.education || null,
      residence: body.residence || null,
      stay_length: body.stay_length || null,
      zip_code: body.zip_code || null,
      tourism_work: body.tourism_work || null,
      tourism_job_categories: Array.isArray(body.tourism_job_categories) ? body.tourism_job_categories : [],
      responses: body.responses && typeof body.responses === 'object' ? body.responses : {},
      attraction_pins: Array.isArray(body.attraction_pins) ? body.attraction_pins : [],
    };

    if (!payload.consent) {
      return res.status(400).json({ success: false, error: 'Consent required' });
    }

    const stmt = db.prepare(`
      INSERT INTO oland_surveys (
        language, consent, age, sex, education, residence, stay_length, zip_code,
        tourism_work, tourism_job_categories, responses, attraction_pins
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      payload.language,
      payload.consent,
      payload.age,
      payload.sex,
      payload.education,
      payload.residence,
      payload.stay_length,
      payload.zip_code,
      payload.tourism_work,
      JSON.stringify(payload.tourism_job_categories),
      JSON.stringify(payload.responses),
      JSON.stringify(payload.attraction_pins),
      function (err) {
        if (err) {
          console.error('DB insert error:', err);
          return res.status(500).json({ success: false, error: 'Database insert failed' });
        }
        return res.json({ success: true, id: this.lastID });
      }
    );

    stmt.finalize();
  } catch (e) {
    console.error('Submit handler error:', e);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Database view (ONLY new survey)
app.get('/database', (req, res) => {
  db.all(`SELECT * FROM oland_surveys ORDER BY id DESC`, (err, rows) => {
    if (err) {
      console.error('Error fetching oland_surveys:', err);
      return res.status(500).send('Database error: ' + err.message);
    }

    const escape = (s) =>
      String(s ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const page = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Southern Öland Tourism Survey Database</title>
<style>
  body{font-family:Segoe UI,Tahoma,Verdana,sans-serif;margin:0;padding:24px;background:#f6faf7;color:#16321d;}
  h1{margin:0 0 16px;font-size:28px;color:#1e5e32;}
  .topbar{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:18px;}
  .btn{display:inline-flex;align-items:center;gap:10px;background:#1e5e32;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:700;}
  .btn:hover{opacity:.92;}
  .btn.secondary{background:#fff;color:#1e5e32;border:2px solid #1e5e32;}
  .card{background:#fff;border-radius:14px;box-shadow:0 8px 22px rgba(0,0,0,.08);padding:16px;}
  table{width:100%;border-collapse:collapse;font-size:14px;}
  th,td{border-bottom:1px solid #e7efe9;padding:10px;vertical-align:top;}
  th{background:#1e5e32;color:#fff;text-align:left;position:sticky;top:0;}
  tr:hover td{background:#fbfffc;}
  .small{font-size:12px;color:#355b40;}
  .wrap{max-width:1200px;margin:0 auto;}
  .mono{font-family:ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;}
</style>
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <div>
        <h1>Southern Öland Tourism Survey (English/Svenska)</h1>
        <div class="small">Table: <strong>oland_surveys</strong> • Rows: <strong>${rows.length}</strong></div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a class="btn" href="/download-csv">⬇️ Download CSV</a>
        <a class="btn secondary" href="/">← Back to Survey</a>
      </div>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Created</th>
            <th>Lang</th>
            <th>Age</th>
            <th>Sex</th>
            <th>Education</th>
            <th>Residence</th>
            <th>Stay length</th>
            <th>Zip</th>
            <th>Tourism work</th>
            <th>Job categories</th>
            <th>Responses (JSON)</th>
            <th>Attraction pins (JSON)</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((r) => `
            <tr>
              <td>${escape(r.id)}</td>
              <td>${escape(r.created_at)}</td>
              <td>${escape(r.language)}</td>
              <td>${escape(r.age)}</td>
              <td>${escape(r.sex)}</td>
              <td>${escape(r.education)}</td>
              <td>${escape(r.residence)}</td>
              <td>${escape(r.stay_length)}</td>
              <td>${escape(r.zip_code)}</td>
              <td>${escape(r.tourism_work)}</td>
              <td class="mono">${escape(r.tourism_job_categories)}</td>
              <td class="mono">${escape(r.responses)}</td>
              <td class="mono">${escape(r.attraction_pins)}</td>
            </tr>
          `)
            .join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(page);
  });
});

// CSV download (ONLY new survey)
app.get('/download-csv', (req, res) => {
  db.all(`SELECT * FROM oland_surveys ORDER BY id DESC`, (err, rows) => {
    if (err) {
      console.error('CSV fetch error:', err);
      return res.status(500).send('Database error: ' + err.message);
    }

    const headers = [
      'id','created_at','language','consent','age','sex','education','residence','stay_length',
      'zip_code','tourism_work','tourism_job_categories','responses','attraction_pins'
    ];

    const escapeCsv = (value) => {
      const s = value === null || value === undefined ? '' : String(value);
      const needsQuotes = /[",\n]/.test(s);
      const escaped = s.replaceAll('"', '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };

    const lines = [];
    lines.push(headers.join(','));
    for (const r of rows) {
      lines.push(headers.map(h => escapeCsv(r[h])).join(','));
    }

    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="oland_surveys.csv"');
    res.send(csv);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`DB: ${DB_PATH}`);
});

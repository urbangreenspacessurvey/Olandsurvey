const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new sqlite3.Database('survey.db');

// Create tables with all the new question fields
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        language TEXT,
        consent1 TEXT, consent2 TEXT, consent3 TEXT, consent4 TEXT,
        picture_response INTEGER,
        pa1 INTEGER, pa2 INTEGER, pa3 INTEGER, pa4 INTEGER, pa5 INTEGER, pa6 INTEGER, pa7 INTEGER,
        pa8 INTEGER, pa9 INTEGER, pa10 INTEGER, pa11 INTEGER, pa12 INTEGER, pa13 INTEGER, pa14 INTEGER,
        nostalgia1 INTEGER, nostalgia2 INTEGER, nostalgia3 INTEGER, nostalgia4 INTEGER,
        pwb1 INTEGER, pwb2 INTEGER, pwb3 INTEGER, pwb4 INTEGER, pwb5 INTEGER, pwb6 INTEGER,
        pwb7 INTEGER, pwb8 INTEGER, pwb9 INTEGER, pwb10 INTEGER, pwb11 INTEGER, pwb12 INTEGER,
        pwb13 INTEGER, pwb14 INTEGER, pwb15 INTEGER, pwb16 INTEGER, pwb17 INTEGER, pwb18 INTEGER,
        soj1 INTEGER, soj2 INTEGER, soj3 INTEGER, soj4 INTEGER, soj5 INTEGER, soj6 INTEGER,
        soj7 INTEGER, soj8 INTEGER, soj9 INTEGER, soj10 INTEGER, soj11 INTEGER,
        wildlife1 INTEGER, wildlife2 INTEGER, wildlife3 INTEGER, wildlife4 INTEGER, wildlife5 INTEGER, wildlife6 INTEGER,
        wildlife7 INTEGER, wildlife8 INTEGER, wildlife9 INTEGER,
        first_visit TEXT, site_background TEXT, wildlife_sharing TEXT, future_vision TEXT, contact_info TEXT,
        distance TEXT, age TEXT, gender TEXT, education TEXT, visit_frequency TEXT,
        important_drawings TEXT, wildlife_encounters TEXT,
        important_places_data TEXT, wildlife_encounters_data TEXT, drawings_data TEXT
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS map_markers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        survey_id INTEGER,
        map_type TEXT,
        latitude REAL,
        longitude REAL,
        marker_type TEXT,
        wildlife_type TEXT,
        emotion TEXT,
        experience_text TEXT,
        geojson_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (survey_id) REFERENCES surveys (id)
    )`);
    
    // Migration: Add picture_response column if it doesn't exist
    db.run(`ALTER TABLE surveys ADD COLUMN picture_response INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding picture_response column:', err);
        }
    });
    
    // Migration: Add experience_text column to map_markers if it doesn't exist
    db.run(`ALTER TABLE map_markers ADD COLUMN experience_text TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding experience_text column:', err);
        }
    });
    
    // Migration: Add important_places_data column to surveys if it doesn't exist
    db.run(`ALTER TABLE surveys ADD COLUMN important_places_data TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding important_places_data column:', err);
   
    // --- Southern Öland tourism survey tables (English/Swedish) ---
    db.run(`CREATE TABLE IF NOT EXISTS oland_surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT DEFAULT (datetime('now')),
        language TEXT,
        consent INTEGER,
        age TEXT,
        sex TEXT,
        education TEXT,
        residence TEXT,
        stay_length TEXT,
        zip_code TEXT,
        tourism_work TEXT,
        tourism_job_categories TEXT,
        responses_json TEXT,
        attraction_pins_json TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS oland_attraction_pins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        survey_id INTEGER,
        lat REAL,
        lng REAL,
        category TEXT,
        name TEXT,
        FOREIGN KEY(survey_id) REFERENCES oland_surveys(id) ON DELETE CASCADE
    )`);
     }
    });
    

});


// Helpers: detect and store Southern Öland tourism survey submissions
function isOlandPayload(data) {
    if (!data) return false;
    // New front-end sends { responses: {...}, attraction_pins: [...] }
    if (data.responses || data.attraction_pins) return true;

    // offline.js style may send JSON strings
    if (typeof data.responses === 'string' || typeof data.attraction_pins === 'string') return true;

    // Heuristic: fields present in Öland demographics
    const demoKeys = ['age','sex','education','residence','stay_length','tourism_work'];
    return demoKeys.some(k => Object.prototype.hasOwnProperty.call(data, k));
}

function safeParseJson(v, fallback) {
    try {
        if (v == null) return fallback;
        if (typeof v === 'string') return JSON.parse(v);
        return v;
    } catch (e) {
        return fallback;
    }
}

function insertOlandSurvey(db, data, cb) {
    const attractionPins = safeParseJson(data.attraction_pins, []);
    const responses = safeParseJson(data.responses, {});

    const jobCats = Array.isArray(data.tourism_job_categories)
        ? data.tourism_job_categories
        : safeParseJson(data.tourism_job_categories, []);

    const stmt = `
        INSERT INTO oland_surveys
        (language, consent, age, sex, education, residence, stay_length, zip_code, tourism_work, tourism_job_categories, responses_json, attraction_pins_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(stmt, [
        data.language || null,
        data.consent ? 1 : 0,
        data.age || null,
        data.sex || null,
        data.education || null,
        data.residence || null,
        data.stay_length || null,
        data.zip_code || null,
        data.tourism_work || null,
        JSON.stringify(jobCats || []),
        JSON.stringify(responses || {}),
        JSON.stringify(attractionPins || []),
    ], function(err) {
        if (err) return cb(err);

        const surveyId = this.lastID;
        if (!attractionPins || attractionPins.length === 0) return cb(null, surveyId);

        const pinStmt = db.prepare(`
            INSERT INTO oland_attraction_pins (survey_id, lat, lng, category, name)
            VALUES (?, ?, ?, ?, ?)
        `);

        for (const p of attractionPins) {
            pinStmt.run([
                surveyId,
                Number(p.lat) || 0,
                Number(p.lng) || 0,
                p.category || null,
                p.name || null
            ]);
        }
        pinStmt.finalize((e) => cb(e, surveyId));
    });
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/database', (req, res) => {
    // Fetch new Öland survey submissions
    db.all(`SELECT * FROM oland_surveys ORDER BY id DESC`, (errO, olandSurveys) => {
        if (errO) {
            console.error('Error fetching oland_surveys:', errO);
            olandSurveys = [];
        }

        db.all(`SELECT * FROM surveys ORDER BY id DESC`, (err, surveys) => {
        if (err) {
            console.error('Error fetching surveys:', err);
            return res.status(500).send('Database error: ' + err.message);
        }
        
        console.log('Raw survey data from database:', surveys);
        
        db.all(`SELECT * FROM map_markers ORDER BY survey_id, id`, (err, markers) => {
            if (err) {
                console.error('Error fetching markers:', err);
                return res.status(500).send('Database error');
            }
            
            let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Survey Database</title><style>
            body{font-family:Arial,sans-serif;margin:20px;background:#f5f5f5}
            .container{max-width:1600px;margin:0 auto;background:white;padding:20px;border-radius:10px;box-shadow:0 5px 15px rgba(0,0,0,0.1)}
            h1{color:#2c5530;text-align:center;border-bottom:3px solid #2d8a47;padding-bottom:10px}
            .download-btn{background:#2d8a47;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;font-weight:bold;display:inline-block;margin:20px auto}
            .table-container{overflow:auto;max-height:800px;border:1px solid #ddd;border-radius:8px}
            table{width:100%;border-collapse:collapse;min-width:4200px}
            th{background:#2d8a47;color:white;padding:8px 4px;text-align:center;position:sticky;top:0;z-index:10;font-size:0.9em;min-width:40px}
            td{padding:6px 4px;border-bottom:1px solid #eee;border-right:1px solid #eee;vertical-align:top;font-size:0.9em}
            tr:nth-child(even){background:#f8f9fa}
            tr:hover{background:#e8f5e8}
            .number-col{text-align:center;font-weight:bold;min-width:35px;max-width:45px}
            .long-text{max-width:200px;word-wrap:break-word;font-size:0.8em}
            .map-data{max-width:300px;font-size:0.8em;word-wrap:break-word}
            .marker-count{background:#2d8a47;color:white;padding:2px 6px;border-radius:3px;font-size:0.8em}
            .delete-btn{background:#dc3545;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:0.8em;font-weight:bold}
            .delete-btn:hover{background:#c82333}
            .delete-col{text-align:center;min-width:80px;max-width:80px}
            </style></head><body><div class="container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h1>🌿 Green Spaces Survey Database</h1>
                <h2 style="margin-top:20px;color:#2c5530;">🏝️ Southern Öland Tourism Survey (English/Svenska)</h2>
                <div class="table-container" style="max-height:420px;min-width:auto;">
                  <table style="min-width:1400px;">
                    <thead>
                      <tr>
                        <th>ID</th><th>Created</th><th>Lang</th><th>Age</th><th>Sex</th><th>Education</th>
                        <th>Residence</th><th>Stay length</th><th>Zip</th><th>Tourism work</th><th>Job categories</th>
                        <th>Responses JSON</th><th>Pins JSON</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${ (olandSurveys || []).map(s => `
                        <tr>
                          <td>${s.id}</td>
                          <td>${s.created_at || ''}</td>
                          <td>${s.language || ''}</td>
                          <td>${s.age || ''}</td>
                          <td>${s.sex || ''}</td>
                          <td>${s.education || ''}</td>
                          <td>${s.residence || ''}</td>
                          <td>${s.stay_length || ''}</td>
                          <td>${s.zip_code || ''}</td>
                          <td>${s.tourism_work || ''}</td>
                          <td>${s.tourism_job_categories || ''}</td>
                          <td style="max-width:420px;white-space:pre-wrap;">${s.responses_json || ''}</td>
                          <td style="max-width:420px;white-space:pre-wrap;">${s.attraction_pins_json || ''}</td>
                        </tr>
                      `).join('') }
                    </tbody>
                  </table>
                </div>

                <hr style="margin:30px 0;border:none;border-top:2px solid #e6e6e6;">

                <a href="/" style="background: #2d8a47; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">← Back to Survey</a>
            </div>
            <div style="text-align:center;margin:20px 0">
            <a href="/download-csv" class="download-btn">⬇️ Download CSV</a></div>`;
            
            if (surveys.length === 0) {
                html += '<div style="text-align:center;padding:50px">No survey data available yet.</div>';
            } else {
                html += '<div class="table-container"><table><thead><tr>' +
                '<th>ID</th><th>Date</th><th>Lang</th><th>Pic_Resp</th>' +
                '<th>PA1</th><th>PA2</th><th>PA3</th><th>PA4</th><th>PA5</th><th>PA6</th><th>PA7</th><th>PA8</th><th>PA9</th><th>PA10</th><th>PA11</th><th>PA12</th><th>PA13</th><th>PA14</th><th>PA_Avg</th>' +
                '<th>N1</th><th>N2</th><th>N3</th><th>N4</th><th>N_Avg</th>' +
                '<th>PWB1</th><th>PWB2</th><th>PWB3</th><th>PWB4</th><th>PWB5</th><th>PWB6</th><th>PWB7</th><th>PWB8</th><th>PWB9</th><th>PWB10</th><th>PWB11</th><th>PWB12</th><th>PWB13</th><th>PWB14</th><th>PWB15</th><th>PWB16</th><th>PWB17</th><th>PWB18</th><th>PWB_Avg</th>' +
                '<th>SOJ1</th><th>SOJ2</th><th>SOJ3</th><th>SOJ4</th><th>SOJ5</th><th>SOJ6</th><th>SOJ7</th><th>SOJ8</th><th>SOJ9</th><th>SOJ10</th><th>SOJ11</th><th>SOJ_Avg</th>' +
                '<th>WF1</th><th>WF2</th><th>WF3</th><th>WF4</th><th>WF5</th><th>WF6</th><th>WF7</th><th>WF8</th><th>WF9</th><th>WF_Avg</th>' +
                '<th>Age</th><th>Gender</th><th>Education</th><th>Distance</th><th>Visit_Freq</th>' +
                '<th>First_Visit</th><th>Background</th><th>Wildlife_Share</th><th>Future</th><th>Contact</th>' +
                '<th>Wildlife_Encounters</th><th>Drawings</th><th>Delete</th>' +
                '</tr></thead><tbody>';
                
                surveys.forEach(survey => {
                    // Calculate averages
                    const paValues = [survey.pa1, survey.pa2, survey.pa3, survey.pa4, survey.pa5, survey.pa6, survey.pa7, survey.pa8, survey.pa9, survey.pa10, survey.pa11, survey.pa12, survey.pa13, survey.pa14].filter(v => v != null);
                    const paAvg = paValues.length > 0 ? (paValues.reduce((a, b) => a + b, 0) / paValues.length).toFixed(2) : '';
                    
                    const nostalgiaValues = [survey.nostalgia1, survey.nostalgia2, survey.nostalgia3, survey.nostalgia4].filter(v => v != null);
                    const nostalgiaAvg = nostalgiaValues.length > 0 ? (nostalgiaValues.reduce((a, b) => a + b, 0) / nostalgiaValues.length).toFixed(2) : '';
                    
                    const pwbValues = [survey.pwb1, survey.pwb2, survey.pwb3, survey.pwb4, survey.pwb5, survey.pwb6, survey.pwb7, survey.pwb8, survey.pwb9, survey.pwb10, survey.pwb11, survey.pwb12, survey.pwb13, survey.pwb14, survey.pwb15, survey.pwb16, survey.pwb17, survey.pwb18].filter(v => v != null);
                    const pwbAvg = pwbValues.length > 0 ? (pwbValues.reduce((a, b) => a + b, 0) / pwbValues.length).toFixed(2) : '';
                    
                    const sojValues = [survey.soj1, survey.soj2, survey.soj3, survey.soj4, survey.soj5, survey.soj6, survey.soj7, survey.soj8, survey.soj9, survey.soj10, survey.soj11].filter(v => v != null);
                    const sojAvg = sojValues.length > 0 ? (sojValues.reduce((a, b) => a + b, 0) / sojValues.length).toFixed(2) : '';
                    
                    const wildlifeValues = [survey.wildlife1, survey.wildlife2, survey.wildlife3, survey.wildlife4, survey.wildlife5, survey.wildlife6, survey.wildlife7, survey.wildlife8, survey.wildlife9].filter(v => v != null);
                    const wildlifeAvg = wildlifeValues.length > 0 ? (wildlifeValues.reduce((a, b) => a + b, 0) / wildlifeValues.length).toFixed(2) : '';
                    
                    const date = new Date(survey.created_at).toLocaleString();
                    const wildlifeData = survey.wildlife_encounters_data || '';
                    
                    // Format drawings data to show description : WKT format nicely
                    let drawingsData = '';
                    if (survey.drawings_data) {
                        const wktStrings = survey.drawings_data.split(';').filter(wkt => wkt.trim());
                        drawingsData = wktStrings.map((wkt, index) => `${index + 1}: ${wkt.trim()}`).join('<br/>');
                    }
                    
                    html += `<tr>
                        <td class="number-col">${survey.id}</td>
                        <td>${date}</td>
                        <td>${survey.language || ''}</td>
                        <td class="number-col">${survey.picture_response || ''}</td>
                        <td class="number-col">${survey.pa1 || ''}</td>
                        <td class="number-col">${survey.pa2 || ''}</td>
                        <td class="number-col">${survey.pa3 || ''}</td>
                        <td class="number-col">${survey.pa4 || ''}</td>
                        <td class="number-col">${survey.pa5 || ''}</td>
                        <td class="number-col">${survey.pa6 || ''}</td>
                        <td class="number-col">${survey.pa7 || ''}</td>
                        <td class="number-col">${survey.pa8 || ''}</td>
                        <td class="number-col">${survey.pa9 || ''}</td>
                        <td class="number-col">${survey.pa10 || ''}</td>
                        <td class="number-col">${survey.pa11 || ''}</td>
                        <td class="number-col">${survey.pa12 || ''}</td>
                        <td class="number-col">${survey.pa13 || ''}</td>
                        <td class="number-col">${survey.pa14 || ''}</td>
                        <td class="number-col">${paAvg}</td>
                        <td class="number-col">${survey.nostalgia1 || ''}</td>
                        <td class="number-col">${survey.nostalgia2 || ''}</td>
                        <td class="number-col">${survey.nostalgia3 || ''}</td>
                        <td class="number-col">${survey.nostalgia4 || ''}</td>
                        <td class="number-col">${nostalgiaAvg}</td>
                        <td class="number-col">${survey.pwb1 || ''}</td>
                        <td class="number-col">${survey.pwb2 || ''}</td>
                        <td class="number-col">${survey.pwb3 || ''}</td>
                        <td class="number-col">${survey.pwb4 || ''}</td>
                        <td class="number-col">${survey.pwb5 || ''}</td>
                        <td class="number-col">${survey.pwb6 || ''}</td>
                        <td class="number-col">${survey.pwb7 || ''}</td>
                        <td class="number-col">${survey.pwb8 || ''}</td>
                        <td class="number-col">${survey.pwb9 || ''}</td>
                        <td class="number-col">${survey.pwb10 || ''}</td>
                        <td class="number-col">${survey.pwb11 || ''}</td>
                        <td class="number-col">${survey.pwb12 || ''}</td>
                        <td class="number-col">${survey.pwb13 || ''}</td>
                        <td class="number-col">${survey.pwb14 || ''}</td>
                        <td class="number-col">${survey.pwb15 || ''}</td>
                        <td class="number-col">${survey.pwb16 || ''}</td>
                        <td class="number-col">${survey.pwb17 || ''}</td>
                        <td class="number-col">${survey.pwb18 || ''}</td>
                        <td class="number-col">${pwbAvg}</td>
                        <td class="number-col">${survey.soj1 || ''}</td>
                        <td class="number-col">${survey.soj2 || ''}</td>
                        <td class="number-col">${survey.soj3 || ''}</td>
                        <td class="number-col">${survey.soj4 || ''}</td>
                        <td class="number-col">${survey.soj5 || ''}</td>
                        <td class="number-col">${survey.soj6 || ''}</td>
                        <td class="number-col">${survey.soj7 || ''}</td>
                        <td class="number-col">${survey.soj8 || ''}</td>
                        <td class="number-col">${survey.soj9 || ''}</td>
                        <td class="number-col">${survey.soj10 || ''}</td>
                        <td class="number-col">${survey.soj11 || ''}</td>
                        <td class="number-col">${sojAvg}</td>
                        <td class="number-col">${survey.wildlife1 || ''}</td>
                        <td class="number-col">${survey.wildlife2 || ''}</td>
                        <td class="number-col">${survey.wildlife3 || ''}</td>
                        <td class="number-col">${survey.wildlife4 || ''}</td>
                        <td class="number-col">${survey.wildlife5 || ''}</td>
                        <td class="number-col">${survey.wildlife6 || ''}</td>
                        <td class="number-col">${survey.wildlife7 || ''}</td>
                        <td class="number-col">${survey.wildlife8 || ''}</td>
                        <td class="number-col">${survey.wildlife9 || ''}</td>
                        <td class="number-col">${wildlifeAvg}</td>
                        <td>${survey.age || ''}</td>
                        <td>${survey.gender || ''}</td>
                        <td>${survey.education || ''}</td>
                        <td>${survey.distance || ''}</td>
                        <td>${survey.visit_frequency || ''}</td>
                        <td class="long-text">${survey.first_visit || ''}</td>
                        <td class="long-text">${survey.site_background || ''}</td>
                        <td class="long-text">${survey.wildlife_sharing || ''}</td>
                        <td class="long-text">${survey.future_vision || ''}</td>
                        <td class="long-text">${survey.contact_info || ''}</td>
                        <td class="map-data">${wildlifeData}</td>
                        <td class="map-data">${drawingsData}</td>
                        <td class="delete-col"><button class="delete-btn" onclick="deleteSurvey(${survey.id})">🗑️ Delete</button></td>
                    </tr>`;
                });
                
                html += '</tbody></table></div>';
            }
            
            html += `
            <script>
            function deleteSurvey(surveyId) {
                if (confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
                    fetch('/delete-survey/' + surveyId, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Survey deleted successfully!');
                            location.reload(); // Refresh the page to show updated data
                        } else {
                            alert('Error deleting survey: ' + data.error);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Error deleting survey. Please try again.');
                    });
                }
            }
            </script>
            </div></body></html>`;
            res.send(html);
        });
    });
    });
});

app.get('/download-csv', (req, res) => {
    db.all(`SELECT * FROM surveys ORDER BY id DESC`, (err, surveys) => {
        if (err) {
            console.error('Error fetching surveys for CSV:', err);
            return res.status(500).send('Error generating CSV');
        }
        
        const headers = [
            'Survey_ID', 'Submission_Date', 'Language', 'Picture_Response',
            'PA1', 'PA2', 'PA3', 'PA4', 'PA5', 'PA6', 'PA7', 'PA8', 'PA9', 'PA10',
            'PA11', 'PA12', 'PA13', 'PA14', 'PA_Average',
            'Nostalgia1', 'Nostalgia2', 'Nostalgia3', 'Nostalgia4', 'Nostalgia_Average',
            'PWB1', 'PWB2', 'PWB3', 'PWB4', 'PWB5', 'PWB6', 'PWB7', 'PWB8', 'PWB9', 'PWB10',
            'PWB11', 'PWB12', 'PWB13', 'PWB14', 'PWB15', 'PWB16', 'PWB17', 'PWB18', 'PWB_Average',
            'SOJ1', 'SOJ2', 'SOJ3', 'SOJ4', 'SOJ5', 'SOJ6', 'SOJ7', 'SOJ8', 'SOJ9', 'SOJ10',
            'SOJ11', 'SOJ_Average',
            'Wildlife1', 'Wildlife2', 'Wildlife3', 'Wildlife4', 'Wildlife5', 'Wildlife6', 'Wildlife7', 'Wildlife8', 'Wildlife9', 'Wildlife_Average',
            'Age', 'Gender', 'Education', 'Distance', 'Visit_Frequency',
            'First_Visit', 'Site_Background', 'Wildlife_Sharing', 'Future_Vision', 'Total_Map_Markers',
            'Wildlife_Encounters_Data', 'Drawings_Data'
        ];
        
        let csvContent = headers.join(',') + '\n';
        
        surveys.forEach(survey => {
            let importantPlaces = [], importantDrawings = [], wildlifeEncounters = [];
            
            try {
    
                importantDrawings = survey.important_drawings ? JSON.parse(survey.important_drawings) : [];
                wildlifeEncounters = survey.wildlife_encounters ? JSON.parse(survey.wildlife_encounters) : [];
            } catch (e) {}
            
            // Calculate averages
            const paValues = [survey.pa1, survey.pa2, survey.pa3, survey.pa4, survey.pa5, survey.pa6, survey.pa7, survey.pa8, survey.pa9, survey.pa10, survey.pa11, survey.pa12, survey.pa13, survey.pa14].filter(v => v != null);
            const paAvg = paValues.length > 0 ? (paValues.reduce((a, b) => a + b, 0) / paValues.length).toFixed(2) : '';
            
            const nostalgiaValues = [survey.nostalgia1, survey.nostalgia2, survey.nostalgia3, survey.nostalgia4].filter(v => v != null);
            const nostalgiaAvg = nostalgiaValues.length > 0 ? (nostalgiaValues.reduce((a, b) => a + b, 0) / nostalgiaValues.length).toFixed(2) : '';
            
            const pwbValues = [survey.pwb1, survey.pwb2, survey.pwb3, survey.pwb4, survey.pwb5, survey.pwb6, survey.pwb7, survey.pwb8, survey.pwb9, survey.pwb10, survey.pwb11, survey.pwb12, survey.pwb13, survey.pwb14, survey.pwb15, survey.pwb16, survey.pwb17, survey.pwb18].filter(v => v != null);
            const pwbAvg = pwbValues.length > 0 ? (pwbValues.reduce((a, b) => a + b, 0) / pwbValues.length).toFixed(2) : '';
            
            const sojValues = [survey.soj1, survey.soj2, survey.soj3, survey.soj4, survey.soj5, survey.soj6, survey.soj7, survey.soj8, survey.soj9, survey.soj10, survey.soj11].filter(v => v != null);
            const sojAvg = sojValues.length > 0 ? (sojValues.reduce((a, b) => a + b, 0) / sojValues.length).toFixed(2) : '';
            
                    const wildlifeValues = [survey.wildlife1, survey.wildlife2, survey.wildlife3, survey.wildlife4, survey.wildlife5, survey.wildlife6, survey.wildlife7, survey.wildlife8, survey.wildlife9].filter(v => v != null);
        const wildlifeAvg = wildlifeValues.length > 0 ? (wildlifeValues.reduce((a, b) => a + b, 0) / wildlifeValues.length).toFixed(2) : '';
            
            const date = new Date(survey.created_at).toLocaleString();
            
            const row = [
                survey.id,
                date,
                survey.language || '',
                survey.picture_response || '',
                survey.pa1 || '', survey.pa2 || '', survey.pa3 || '', survey.pa4 || '', survey.pa5 || '', survey.pa6 || '', survey.pa7 || '', survey.pa8 || '', survey.pa9 || '', survey.pa10 || '',
                survey.pa11 || '', survey.pa12 || '', survey.pa13 || '', survey.pa14 || '', paAvg,
                survey.nostalgia1 || '', survey.nostalgia2 || '', survey.nostalgia3 || '', survey.nostalgia4 || '', nostalgiaAvg,
                survey.pwb1 || '', survey.pwb2 || '', survey.pwb3 || '', survey.pwb4 || '', survey.pwb5 || '', survey.pwb6 || '', survey.pwb7 || '', survey.pwb8 || '', survey.pwb9 || '', survey.pwb10 || '',
                survey.pwb11 || '', survey.pwb12 || '', survey.pwb13 || '', survey.pwb14 || '', survey.pwb15 || '', survey.pwb16 || '', survey.pwb17 || '', survey.pwb18 || '', pwbAvg,
                survey.soj1 || '', survey.soj2 || '', survey.soj3 || '', survey.soj4 || '', survey.soj5 || '', survey.soj6 || '', survey.soj7 || '', survey.soj8 || '', survey.soj9 || '', survey.soj10 || '',
                survey.soj11 || '', sojAvg,
                survey.wildlife1 || '', survey.wildlife2 || '', survey.wildlife3 || '', survey.wildlife4 || '', survey.wildlife5 || '', survey.wildlife6 || '', survey.wildlife7 || '', survey.wildlife8 || '', survey.wildlife9 || '', wildlifeAvg,
                survey.age || '', survey.gender || '', survey.education || '', survey.distance || '', survey.visit_frequency || '',
                survey.first_visit ? `"${survey.first_visit.replace(/"/g, '""')}"` : '',
                survey.site_background ? `"${survey.site_background.replace(/"/g, '""')}"` : '',
                survey.wildlife_sharing ? `"${survey.wildlife_sharing.replace(/"/g, '""')}"` : '',
                survey.future_vision ? `"${survey.future_vision.replace(/"/g, '""')}"` : '',
                importantPlaces.length + importantDrawings.length + wildlifeEncounters.length,

                survey.wildlife_encounters_data || '',
                survey.drawings_data || ''
            ];
            
            csvContent += row.join(',') + '\n';
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="survey_data.csv"');
        res.send(csvContent);
    });
});


// New front-end fallback endpoint (JSON)
app.post('/submit', (req, res) => {
    const data = req.body;
    if (!isOlandPayload(data)) {
        return res.status(400).json({ success: false, error: 'Unsupported payload for /submit' });
    }

    insertOlandSurvey(db, data, (err, surveyId) => {
        if (err) {
            console.error('Error storing Öland survey:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, survey_id: surveyId });
    });
});

app.post('/submit-survey', (req, res) => {
    const data = req.body;
    // If this is the Southern Öland tourism survey payload, store it in the oland_* tables.
    if (isOlandPayload(data)) {
        return insertOlandSurvey(db, data, (err, surveyId) => {
            if (err) {
                console.error('Error storing Öland survey:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            return res.json({ success: true, survey_id: surveyId });
        });
    }

    console.log('Received survey data:', data);
    
    // Parse and format map data before insertion
    let wildlifeEncounters = [];
    let importantDrawings = [];
    
    try {
        wildlifeEncounters = data.wildlife_encounters ? JSON.parse(data.wildlife_encounters) : [];
        importantDrawings = data.important_drawings ? JSON.parse(data.important_drawings) : [];
    } catch (e) {
        console.error('Error parsing map data for storage:', e);
        wildlifeEncounters = [];
        importantDrawings = [];
    }
    

    
    const formatWildlifeEncounters = (encounters) => {
        console.log('Formatting wildlife encounters:', encounters);
        if (!encounters || encounters.length === 0) return '';
        return encounters.map(e => {
            const lat = parseFloat(e.lat) || 0;
            const lng = parseFloat(e.lng) || 0;
            const wildlife = e.wildlife || '';
            const emotion = e.emotion || '';
            
            console.log('Processing encounter:', { lat, lng, wildlife, emotion });
            
            // Format as "wildlife:emotion : POINT(lng lat)" if both exist
            if (wildlife && emotion) {
                return `${wildlife}:${emotion} : POINT(${lng} ${lat})`;
            } else if (wildlife) {
                return `${wildlife} : POINT(${lng} ${lat})`;
            } else {
                return `POINT(${lng} ${lat})`;
            }
        }).join(';');
    };
    
    const formatDrawings = (drawings) => {
        if (!drawings || drawings.length === 0) return '';
        return drawings.map(drawing => {
            if (!drawing.geometry || !drawing.geometry.coordinates) {
                return 'POINT(0 0)'; // Fallback
            }
            
            const coords = drawing.geometry.coordinates;
            const geometryType = drawing.geometry.type;
            const description = drawing.properties?.description || '';
            
            let wkt = '';
            
            try {
                switch (geometryType) {
                    case 'Point':
                        const [lng, lat] = coords;
                        wkt = `POINT(${lng} ${lat})`;
                        break;
                    
                    case 'LineString':
                        const lineCoords = coords.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
                        wkt = `LINESTRING(${lineCoords})`;
                        break;
                    
                    case 'Polygon':
                        // For polygons, we need to handle the outer ring
                        const outerRing = coords[0];
                        const polygonCoords = outerRing.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
                        wkt = `POLYGON((${polygonCoords}))`;
                        break;
                    
                    case 'Circle':
                        // Convert circle to square polygon for WKT compatibility
                        const center = coords;
                        const radius = drawing.radius || 0.001; // Default small radius
                        const centerLng = center[0];
                        const centerLat = center[1];
                        
                        // Create a square around the circle center
                        const squareCoords = [
                            [centerLng - radius, centerLat - radius],
                            [centerLng - radius, centerLat + radius],
                            [centerLng + radius, centerLat + radius],
                            [centerLng + radius, centerLat - radius],
                            [centerLng - radius, centerLat - radius] // Close the polygon
                        ];
                        
                        const squareWKT = squareCoords.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
                        wkt = `POLYGON((${squareWKT}))`;
                        break;
                    
                    case 'Rectangle':
                        // Convert rectangle to polygon
                        const rectCoords = coords[0]; // Rectangle coordinates
                        const rectWKT = rectCoords.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
                        wkt = `POLYGON((${rectWKT}))`;
                        break;
                    
                    default:
                        console.warn('Unknown geometry type:', geometryType);
                        // Fallback: try to treat as point if possible
                        if (coords.length === 2 && typeof coords[0] === 'number') {
                            wkt = `POINT(${coords[0]} ${coords[1]})`;
                        } else {
                            wkt = 'POINT(0 0)';
                        }
                        break;
                }
            } catch (error) {
                console.error('Error processing geometry:', error, drawing);
                wkt = 'POINT(0 0)'; // Fallback
            }
            
            // Format as "description : WKT" if description exists
            if (description && description.trim()) {
                return `${description.trim()} : ${wkt}`;
            } else {
                return wkt;
            }
        }).join(';');
    };
    
    const wildlifeEncountersData = formatWildlifeEncounters(wildlifeEncounters);
    const drawingsData = formatDrawings(importantDrawings);

    const insertSurvey = `INSERT INTO surveys (
        language, consent1, consent2, consent3, consent4, picture_response,
        pa1, pa2, pa3, pa4, pa5, pa6, pa7, pa8, pa9, pa10, pa11, pa12, pa13, pa14,
        nostalgia1, nostalgia2, nostalgia3, nostalgia4,
        pwb1, pwb2, pwb3, pwb4, pwb5, pwb6, pwb7, pwb8, pwb9, pwb10, pwb11, pwb12, pwb13, pwb14, pwb15, pwb16, pwb17, pwb18,
        soj1, soj2, soj3, soj4, soj5, soj6, soj7, soj8, soj9, soj10, soj11,
        wildlife1, wildlife2, wildlife3, wildlife4, wildlife5, wildlife6, wildlife7, wildlife8, wildlife9,
        first_visit, site_background, wildlife_sharing, future_vision, contact_info,
        distance, age, gender, education, visit_frequency,
        important_drawings, wildlife_encounters,
        important_places_data, wildlife_encounters_data, drawings_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const values = [
        data.language || 'en',
        data.consent1, data.consent2, data.consent3, data.consent4, data.picture_response,
        data.pa1, data.pa2, data.pa3, data.pa4, data.pa5, data.pa6, data.pa7, data.pa8, data.pa9, data.pa10, data.pa11, data.pa12, data.pa13, data.pa14,
        data.nostalgia1, data.nostalgia2, data.nostalgia3, data.nostalgia4,
        data.pwb1, data.pwb2, data.pwb3, data.pwb4, data.pwb5, data.pwb6, data.pwb7, data.pwb8, data.pwb9, data.pwb10, data.pwb11, data.pwb12, data.pwb13, data.pwb14, data.pwb15, data.pwb16, data.pwb17, data.pwb18,
        data.soj1, data.soj2, data.soj3, data.soj4, data.soj5, data.soj6, data.soj7, data.soj8, data.soj9, data.soj10, data.soj11,
        data.wildlife1, data.wildlife2, data.wildlife3, data.wildlife4, data.wildlife5, data.wildlife6, data.wildlife7, data.wildlife8, data.wildlife9,
        data.first_visit, data.site_background, data.wildlife_sharing, data.future_vision, data.contact_info,
        data.distance, data.age, data.gender, data.education, data.visit_frequency,
        data.important_drawings || '[]', 
        data.wildlife_encounters || '[]',
        '', // important_places_data (empty since we removed the feature)
        wildlifeEncountersData,
        drawingsData
    ];
    
    db.run(insertSurvey, values, function(err) {
        if (err) {
            console.error('Error inserting survey:', err);
            return res.status(500).json({ error: 'Error saving survey data' });
        }
        
        const surveyId = this.lastID;
        console.log('Survey inserted successfully with ID:', surveyId);
        
        // Insert map markers if they exist
        const insertMarkers = () => {
            // Use the already parsed data
            
            const allMarkers = [
                ...wildlifeEncounters.map(encounter => ({
                    survey_id: surveyId,
                    map_type: 'wildlife_encounter',
                    latitude: encounter.lat,
                    longitude: encounter.lng,
                    wildlife_type: encounter.wildlife,
                    emotion: encounter.emotion,
                    geojson_data: JSON.stringify(encounter)
                })),
                ...importantDrawings.map(drawing => ({
                    survey_id: surveyId,
                    map_type: 'drawing',
                    latitude: null,
                    longitude: null,
                    geojson_data: JSON.stringify(drawing)
                }))
            ];
            
            if (allMarkers.length > 0) {
                const insertMarker = `INSERT INTO map_markers (survey_id, map_type, latitude, longitude, marker_type, wildlife_type, emotion, experience_text, geojson_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                
                allMarkers.forEach(marker => {
                    db.run(insertMarker, [
                        marker.survey_id,
                        marker.map_type,
                        marker.latitude,
                        marker.longitude,
                        marker.marker_type || null,
                        marker.wildlife_type || null,
                        marker.emotion || null,
                        marker.experience_text || null,
                        marker.geojson_data
                    ], (err) => {
                        if (err) {
                            console.error('Error inserting marker:', err);
                        }
                    });
                });
            }
        };
        
        insertMarkers();
        
        res.json({ 
            success: true, 
            message: 'Survey submitted successfully!',
            surveyId: surveyId
        });
    });
});

// DELETE route for individual survey entries
app.delete('/delete-survey/:id', (req, res) => {
    const surveyId = req.params.id;
    
    if (!surveyId || isNaN(surveyId)) {
        return res.status(400).json({ error: 'Invalid survey ID' });
    }
    
    // First delete associated map markers
    db.run('DELETE FROM map_markers WHERE survey_id = ?', [surveyId], function(err) {
        if (err) {
            console.error('Error deleting map markers:', err);
            return res.status(500).json({ error: 'Error deleting survey data' });
        }
        
        // Then delete the survey itself
        db.run('DELETE FROM surveys WHERE id = ?', [surveyId], function(err) {
            if (err) {
                console.error('Error deleting survey:', err);
                return res.status(500).json({ error: 'Error deleting survey' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Survey not found' });
            }
            
            console.log(`Survey ${surveyId} deleted successfully`);
            res.json({ 
                success: true, 
                message: 'Survey deleted successfully',
                surveyId: surveyId
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

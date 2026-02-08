PATCH v4 (Southern Öland only)

What this does:
- Removes ALL legacy Green Spaces Survey DB views and tables from the UI.
- Uses a NEW SQLite schema with only one table: oland_surveys.
- Enables /download-csv for the new table.
- Frontend: consent is read correctly even if checkbox is outside the form.
- Frontend: map is SINGLE point (exactly 1 pin required). Clicking again moves the pin (no double markers).

How to apply:
1) In your GitHub repo, REPLACE these files:
   - server.js
   - survey.db
   - public/index.html
   - public/app.js

2) Commit + push, redeploy on Render.

URLs:
- Survey: /
- Database view: /database
- CSV: /download-csv

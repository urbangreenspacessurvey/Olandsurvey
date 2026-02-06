Replace these files in your repo:
 - server.js
 - public/index.html
 - public/app.js

Important:
1) Make sure you deploy on Render as a *Web Service* (not Static Site).
2) Ensure the files are named exactly index.html and app.js under /public.
3) Open the root URL (no /app.js).
4) server.js now listens on process.env.PORT for Render.

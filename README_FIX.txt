Apply these fixes:
1) Replace server.js with this server.js
2) Replace public/index.html with this public/index.html
3) Replace public/app.js with this public/app.js

Fixes included:
- Consent checkbox works even though it sits outside the <form> (previously caused 'must consent' error).
- Render compatibility: server listens on process.env.PORT || 3000
- Adds new tables oland_surveys and oland_attraction_pins; /submit and /submit-survey store Öland payload there.
- /database page shows a new section for Öland Tourism Survey submissions, plus the old Green Spaces survey table below.

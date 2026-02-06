// app.js (updated for the Southern Öland tourism survey)
// Key goals:
//  - English + Swedish
//  - Two Likert blocks (1–5 + "I don't know/Vet ej")
//  - Demographics block (as per PDFs)
//  - ONE map (pins only) with category + attraction name
//  - Collect payload and send to backend (or offline manager if present)
//
// NOTE: The backend should store the payload as JSON to avoid schema changes.

let currentLanguage = 'en';
let map;
let attractionPins = []; // {id, lat, lng, category, name}

const LIKERT_OPTIONS = [
  { value: '1', key: 'likert_1' },
  { value: '2', key: 'likert_2' },
  { value: '3', key: 'likert_3' },
  { value: '4', key: 'likert_4' },
  { value: '5', key: 'likert_5' },
  { value: 'dk', key: 'likert_dk' },
];

const ATTRACTION_CATEGORIES = [
  { value: 'cultural_heritage', key: 'cat_cultural' },
  { value: 'natural_heritage', key: 'cat_natural' },
  { value: 'food_beverage', key: 'cat_food' },
  { value: 'shopping_local', key: 'cat_shopping' },
];

const translations = {
  en: {
    title: "Tourism in Southern Öland Survey",
    main_title: "TOURISM IN SOUTHERN ÖLAND",

    purpose_title: "Purpose of the Study",
    purpose_p1:
      "You are invited to participate in a research study that explores how local stakeholders perceive the spatial distribution of tourism and identify key tourist attractions and types of heritage in Southern Öland.",
    participation_p:
      "Participation is voluntary. You may choose not to take part or to withdraw at any time before submitting your responses, without any negative consequences.",
    what_involves_p:
      "If you agree to participate, you will be asked to complete a survey that includes questions about: (1) perceptions of tourism distribution, (2) attractions and types of heritage important for tourism, and (3) your relationship to tourism in the area.",
    time_p: "The survey takes approximately 10 minutes.",
    conf_title: "Confidentiality and Data Protection",
    conf_p:
      "All responses will be treated as confidential. The survey does not collect personally identifiable information. Data will be stored securely and used solely for academic research purposes.",
    contact_title: "Contact Information",
    contact_p:
      "Researcher: Thomas Bartoli (Linnaeus University). Email: thomas.bartoli.extern@lnu.se",
    consent_label: "Consent",
    consent_checkbox: "I consent to participate in this survey",

    sec1_title: "Statements about tourism on Southern Öland",
    likert_hint_1:
      "Please tell us how much you agree or disagree with the following statements (1 = Strongly disagree ... 5 = Strongly agree, I don't know).",

    sec2_title: "Statements about tourism and heritage of Southern Öland",
    likert_hint_2:
      "Please tell us how much you agree or disagree with the following statements (1 = Strongly disagree ... 5 = Strongly agree, I don't know).",

    demo_title: "Demographics",

    map_title: "Mapping part",
    map_instructions_title: "From your perspective: the most important tourist attractions on Southern Öland",
    map_instructions_p:
      "Pin 5 to 10 most important tourist attractions. For each pin, choose a category and write the attraction name.",
    pin_rule: "Rule: add 5–10 pins",
    pins_added: "Pins added",
    clear_pins: "Clear pins",
    map_hint:
      "Tip: click on the map to add a pin. Click an existing pin to edit its category/name or delete it.",

    thanks_title: "Thank you for participating",
    thanks_p: "Your answers will help research on tourism planning, heritage management, and sustainable development in Southern Öland.",
    submit: "Submit Survey",

    // Likert labels
    likert_1: "1 — Strongly disagree",
    likert_2: "2 — Disagree",
    likert_3: "3 — Neither agree nor disagree",
    likert_4: "4 — Agree",
    likert_5: "5 — Strongly agree",
    likert_dk: "I don't know",

    // Categories
    cat_cultural: "Cultural heritage",
    cat_natural: "Natural heritage",
    cat_food: "Food & Beverage",
    cat_shopping: "Shopping & Local Products",

    // Validation & messages
    err_required: "Please answer all required questions.",
    err_pins: "Please add between 5 and 10 pins on the map.",
    err_consent: "You must consent to participate to continue.",
    success: "Survey submitted successfully. Thank you!",
    error: "Something went wrong while submitting. Please try again.",

    // Demographics labels
    age_label: "Age",
    sex_label: "Sex",
    edu_label: "Education",
    residence_label: "Is Southern Öland your primary place of residence?",
    stay_label: "How long have you had a residence or regularly stayed in Southern Öland?",
    zip_label: "Zip code",
    work_label: "Do you work in the tourism sector?",
    job_label: "If yes, in which job categories related to the tourism sector?",
    optional: "(optional)",

    // Demographics options
    age_18_34: "18–34",
    age_35_54: "35–54",
    age_55_65: "55–65",
    age_over_65: "Over 65",
    prefer_not: "Prefer not to say",

    woman: "Woman",
    man: "Man",

    edu_primary: "Primary education",
    edu_upper: "Upper secondary education",
    edu_voc: "Post-secondary / vocational education",
    edu_uni: "University level",
    edu_phd: "Doctoral level",
    edu_other: "Other",

    res_yes: "Yes, I live here permanently",
    res_second: "No, this is my second home",
    res_no: "I don’t live in Southern Öland",

    stay_lt1: "Less than a year",
    stay_1_5: "1–5 years",
    stay_6_15: "6–15 years",
    stay_16_25: "16–25 years",
    stay_gt25: "More than 25 years",
    stay_not_live: "I don’t live in Southern Öland",

    work_yes_full: "Yes, full-time",
    work_yes_part: "Yes, part-time",
    work_yes_season: "Yes, seasonally",
    work_no: "No",

    job_accom: "Accommodation",
    job_food: "Food & beverage",
    job_transport: "Transportation & Logistics",
    job_travel: "Travel services and intermediaries",
    job_recreation: "Recreation & Entertainment",
    job_other: "Other",
    job_dk: "I don’t know",

    // Pin modal / prompts
    pin_title: "Attraction pin",
    pin_name: "Attraction name",
    pin_category: "Category",
    save: "Save",
    delete: "Delete pin",
    cancel: "Cancel",
  },

  sv: {
    title: "Turism på södra Öland – Enkät",
    main_title: "TURISM PÅ SÖDRA ÖLAND",

    purpose_title: "Syftet med studien",
    purpose_p1:
      "Du är inbjuden att delta i en forskningsstudie som undersöker hur lokala aktörer uppfattar turismens rumsliga fördelning samt identifierar viktiga turistattraktioner och typer av kulturarv på södra Öland.",
    participation_p:
      "Ditt deltagande är frivilligt. Du kan välja att inte delta eller avbryta innan du skickar in dina svar, utan några negativa konsekvenser.",
    what_involves_p:
      "Om du samtycker kommer du att ombes fylla i en enkät med frågor om: (1) turismens rumsliga fördelning, (2) attraktioner och typer av kulturarv viktiga för turismen, och (3) din relation till turism i området.",
    time_p: "Enkäten tar ungefär 10 minuter att genomföra.",
    conf_title: "Sekretess och dataskydd",
    conf_p:
      "Alla svar behandlas konfidentiellt. Enkäten samlar inte in personligt identifierbar information. Data lagras säkert och används enbart för akademiska forskningsändamål.",
    contact_title: "Kontaktinformation",
    contact_p:
      "Forskare: Thomas Bartoli (Linnéuniversitetet). Email: thomas.bartoli.extern@lnu.se",
    consent_label: "Samtycke",
    consent_checkbox: "Jag samtycker till att delta i denna enkät",

    sec1_title: "Påståenden om turism på södra Öland",
    likert_hint_1:
      "Vänligen ange i vilken grad du instämmer eller inte instämmer (1 = Instämmer inte alls ... 5 = Instämmer helt, Vet ej).",

    sec2_title: "Påståenden om turism och kulturarv på södra Öland",
    likert_hint_2:
      "Vänligen ange i vilken grad du instämmer eller inte instämmer (1 = Instämmer inte alls ... 5 = Instämmer helt, Vet ej).",

    demo_title: "Demografi",

    map_title: "Kartläggningsdel",
    map_instructions_title: "Ur ditt perspektiv: viktigaste turistattraktioner på södra Öland",
    map_instructions_p:
      "Markera 5 till 10 av de viktigaste turistattraktionerna. För varje markering, välj kategori och skriv namnet på attraktionen.",
    pin_rule: "Regel: lägg till 5–10 markeringar",
    pins_added: "Markeringar",
    clear_pins: "Rensa markeringar",
    map_hint:
      "Tips: klicka på kartan för att lägga till en markering. Klicka på en markering för att redigera kategori/namn eller ta bort den.",

    thanks_title: "Tack för att du deltog",
    thanks_p: "Dina svar bidrar till forskning om turismplanering, kulturarvsförvaltning och hållbar utveckling på södra Öland.",
    submit: "Skicka in",

    // Likert labels
    likert_1: "1 — Instämmer inte alls",
    likert_2: "2 — Instämmer inte",
    likert_3: "3 — Varken instämmer eller instämmer inte",
    likert_4: "4 — Instämmer",
    likert_5: "5 — Instämmer helt",
    likert_dk: "Vet ej",

    // Categories
    cat_cultural: "Kulturarv",
    cat_natural: "Naturarv",
    cat_food: "Mat och dryck",
    cat_shopping: "Shopping och lokala produkter",

    // Validation & messages
    err_required: "Vänligen besvara alla obligatoriska frågor.",
    err_pins: "Vänligen lägg till mellan 5 och 10 markeringar på kartan.",
    err_consent: "Du måste samtycka för att kunna fortsätta.",
    success: "Enkäten har skickats. Tack!",
    error: "Något gick fel vid inskickning. Försök igen.",

    // Demographics labels
    age_label: "Ålder",
    sex_label: "Kön",
    edu_label: "Utbildning",
    residence_label: "Är södra Öland din huvudsakliga bostadsort?",
    stay_label: "Hur länge har du haft bostad eller regelbundet vistats på södra Öland?",
    zip_label: "Postnummer",
    work_label: "Arbetar du inom turistsektorn?",
    job_label: "Om ja, inom vilka yrkeskategorier relaterade till turistsektorn arbetar du?",
    optional: "(valfritt)",

    // Demographics options
    age_18_34: "18–34",
    age_35_54: "35–54",
    age_55_65: "55–65",
    age_over_65: "Över 65",
    prefer_not: "Föredrar att inte uppge",

    woman: "Kvinna",
    man: "Man",

    edu_primary: "Grundskola",
    edu_upper: "Gymnasieskola",
    edu_voc: "Yrkeshögskola / Eftergymnasial yrkesutbildning",
    edu_uni: "Universitetsnivå",
    edu_phd: "Doktorsnivå",
    edu_other: "Annat",

    res_yes: "Ja, jag bor här permanent",
    res_second: "Nej, detta är mitt fritidshus / min andra bostad",
    res_no: "Jag bor inte på södra Öland",

    stay_lt1: "Mindre än 1 år",
    stay_1_5: "1–5 år",
    stay_6_15: "6–15 år",
    stay_16_25: "16–25 år",
    stay_gt25: "Mer än 25 år",
    stay_not_live: "Jag bor inte på södra Öland",

    work_yes_full: "Ja, heltid",
    work_yes_part: "Ja, deltid",
    work_yes_season: "Ja, säsongsvis",
    work_no: "Nej",

    job_accom: "Boende",
    job_food: "Mat & dryck",
    job_transport: "Transport & logistik",
    job_travel: "Rese- och förmedlingstjänster",
    job_recreation: "Fritid & underhållning",
    job_other: "Annat",
    job_dk: "Jag vet inte",

    // Pin modal / prompts
    pin_title: "Markering",
    pin_name: "Attraktionens namn",
    pin_category: "Kategori",
    save: "Spara",
    delete: "Ta bort",
    cancel: "Avbryt",
  },
};

// Likert questions (from PDFs)
const Q1_11_EN = [
  "I support tourism and want to see it remains important to Southern Öland.",
  "The number of tourists in Southern Öland is too low in summer.",
  "Tourist sites in Southern Öland are overcrowded during the summer.",
  "Some parts of Southern Öland receive more visits from tourists than others.",
  "Tourist activity in Southern Öland tends to cluster around specific attractions or landmarks.",
  "Tourist visits to attractions in Southern Öland depend on how easily they can be reached by car or public transport.",
  "Sites with the potential to attract tourists in Southern Öland are not developed enough.",
  "Tourism in Southern Öland is evenly distributed throughout the entire area.",
  "Tourism benefits economically all the communities in Southern Öland equally.",
  "The current distribution of tourists throughout Southern Öland supports equal development of the different parts of the area.",
  "Tourism infrastructures (accommodation, transport, food services) on Southern Öland are evenly spread.",
];
const Q1_11_SV = [
  "Jag stöder turism och vill att den fortsatt ska vara viktig för södra Öland.",
  "Antalet turister i södra Öland är för lågt under sommaren.",
  "Turistplatserna i södra Öland är överfulla under sommaren.",
  "Vissa delar av södra Öland tar emot fler turistbesök än andra.",
  "Turistaktiviteter på södra Öland tenderar att samlas kring specifika attraktioner eller landmärken.",
  "Turistströmmarna till besöksmålen på södra Öland avgörs av dess tillgänglighet via såväl bil som kollektivtrafik.",
  "Platser med potential att attrahera turister i södra Öland är inte tillräckligt utvecklade.",
  "Turismen på södra Öland är jämnt fördelad över hela området.",
  "Turismen genererar likvärdiga ekonomiska fördelar för samtliga lokalsamhällen i södra Öland.",
  "Den nuvarande fördelningen av turister i södra Öland främjar en likvärdig utveckling av områdets olika delar.",
  "Turisminfrastrukturen (logi, transport, restaurangverksamhet) på södra Öland är jämnt fördelad.",
];

const Q12_20_EN = [
  "Cultural heritage (e.g., churches, historic buildings, archaeological sites) is a major attraction for tourists in Southern Öland.",
  "Tourism on Southern Öland contributes to the preservation of local heritage.",
  "Tourism in Southern Öland creates pressures on local heritage.",
  "The UNESCO World Heritage designation makes Southern Öland more attractive for tourists.",
  "The UNESCO World Heritage: Agricultural Landscape of Southern Öland is a major tourist attraction.",
  "Natural areas (e.g., Stora Alvaret, beaches, nature reserves) are major tourists' attractions in Southern Öland.",
  "Outdoor recreation activities (e.g., cycling, hiking, horse riding) are main tourist attractions in Southern Öland.",
  "Food and beverage experiences (restaurants, cafés, markets) are main tourist attractions in Southern Öland.",
  "Festivals and cultural events are main attractions for tourists in Southern Öland.",
];
const Q12_20_SV = [
  "Kulturarvet (t.ex. kyrkor, historiska byggnader och arkeologiska platser) är en viktig attraktion för turister i södra Öland.",
  "Turismen i södra Öland bidrar till bevarandet av det lokala kulturarvet.",
  "Turismen i södra Öland skapar påfrestningar på det lokala kulturarvet.",
  "UNESCO-världsarvsstatusen gör södra Öland mer attraktivt för turister.",
  "UNESCO-världsarvet Södra Ölands odlingslandskap är ett betydande turistmål.",
  "Naturmiljöer (t.ex. Stora Alvaret, stränder och naturreservat) är viktiga attraktioner för turister i södra Öland.",
  "Friluftsaktiviteter (t.ex. cykling, vandring, ridning) är de mest betydelsefulla turistattraktionerna på södra Öland.",
  "Mat- och dryckesupplevelser (restauranger, caféer, marknader) är de mest betydelsefulla turistattraktionerna på södra Öland.",
  "Festivaler och kulturevenemang är de mest betydelsefulla turistattraktionerna på södra Öland.",
];

document.addEventListener('DOMContentLoaded', () => {
  currentLanguage = localStorage.getItem('language') || 'en';
  updateLanguageButtons();
  updateTexts();
  renderSurvey();
  initializeMap();
});

function switchLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
  updateLanguageButtons();
  updateTexts();
  renderSurvey(); // re-render dynamic sections with translated items
  // re-render map pin popups when clicked later; existing markers will still show, but popup content comes from click handler
}

function updateLanguageButtons() {
  document.querySelectorAll('.language-switcher button').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById(`lang-${currentLanguage}`);
  if (btn) btn.classList.add('active');
}

function t(key) {
  return (translations[currentLanguage] && translations[currentLanguage][key]) || key;
}

function updateTexts() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.title = t('title');
}

function renderSurvey() {
  renderLikertSection('likert-section-1', 'q1_', getQuestionsBlock1());
  renderLikertSection('likert-section-2', 'q2_', getQuestionsBlock2());
  renderDemographics();
  updatePinCount();
}

function getQuestionsBlock1() {
  return currentLanguage === 'sv' ? Q1_11_SV : Q1_11_EN;
}

function getQuestionsBlock2() {
  return currentLanguage === 'sv' ? Q12_20_SV : Q12_20_EN;
}

function renderLikertSection(containerId, namePrefix, questions) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  questions.forEach((qText, idx) => {
    const qNum = idx + 1;
    const name = `${namePrefix}${qNum}`;

    const qDiv = document.createElement('div');
    qDiv.className = 'question';

    const title = document.createElement('p');
    title.className = 'question-title';
    title.textContent = `${qNum}. ${qText}`;
    qDiv.appendChild(title);

    const opts = document.createElement('div');
    opts.className = 'likert';

    LIKERT_OPTIONS.forEach(opt => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = name;
      input.value = opt.value;
      input.required = true;

      const span = document.createElement('span');
      span.textContent = t(opt.key);

      label.appendChild(input);
      label.appendChild(document.createTextNode(' '));
      label.appendChild(span);
      opts.appendChild(label);
    });

    qDiv.appendChild(opts);
    container.appendChild(qDiv);
  });
}

function renderDemographics() {
  const container = document.getElementById('demographics');
  if (!container) return;

  container.innerHTML = '';

  // Helper to build radio groups
  const radioGroup = (name, titleKey, options, required = true) => {
    const q = document.createElement('div');
    q.className = 'question';

    const p = document.createElement('p');
    p.className = 'question-title';
    p.textContent = t(titleKey);
    q.appendChild(p);

    options.forEach(opt => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = name;
      input.value = opt.value;
      input.required = required;

      const span = document.createElement('span');
      span.textContent = t(opt.key);

      label.appendChild(input);
      label.appendChild(document.createTextNode(' '));
      label.appendChild(span);
      q.appendChild(label);
    });

    return q;
  };

  // Helper for checkbox group (job categories)
  const checkboxGroup = (name, titleKey, options, required = false) => {
    const q = document.createElement('div');
    q.className = 'question';

    const p = document.createElement('p');
    p.className = 'question-title';
    p.textContent = `${t(titleKey)} ${required ? '' : t('optional')}`;
    q.appendChild(p);

    options.forEach(opt => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = name;
      input.value = opt.value;

      const span = document.createElement('span');
      span.textContent = t(opt.key);

      label.appendChild(input);
      label.appendChild(document.createTextNode(' '));
      label.appendChild(span);
      q.appendChild(label);
    });

    return q;
  };

  container.appendChild(
    radioGroup('age', 'age_label', [
      { value: '18_34', key: 'age_18_34' },
      { value: '35_54', key: 'age_35_54' },
      { value: '55_65', key: 'age_55_65' },
      { value: 'over_65', key: 'age_over_65' },
      { value: 'prefer_not', key: 'prefer_not' },
    ])
  );

  container.appendChild(
    radioGroup('sex', 'sex_label', [
      { value: 'woman', key: 'woman' },
      { value: 'man', key: 'man' },
      { value: 'prefer_not', key: 'prefer_not' },
    ])
  );

  container.appendChild(
    radioGroup('education', 'edu_label', [
      { value: 'primary', key: 'edu_primary' },
      { value: 'upper_secondary', key: 'edu_upper' },
      { value: 'vocational', key: 'edu_voc' },
      { value: 'university', key: 'edu_uni' },
      { value: 'doctoral', key: 'edu_phd' },
      { value: 'other', key: 'edu_other' },
      { value: 'prefer_not', key: 'prefer_not' },
    ])
  );

  container.appendChild(
    radioGroup('residence', 'residence_label', [
      { value: 'permanent', key: 'res_yes' },
      { value: 'second_home', key: 'res_second' },
      { value: 'not_live', key: 'res_no' },
    ])
  );

  container.appendChild(
    radioGroup('stay_length', 'stay_label', [
      { value: 'lt1', key: 'stay_lt1' },
      { value: '1_5', key: 'stay_1_5' },
      { value: '6_15', key: 'stay_6_15' },
      { value: '16_25', key: 'stay_16_25' },
      { value: 'gt25', key: 'stay_gt25' },
      { value: 'not_live', key: 'stay_not_live' },
    ])
  );

  // Zip code (text)
  const zip = document.createElement('div');
  zip.className = 'question';
  const zipTitle = document.createElement('p');
  zipTitle.className = 'question-title';
  zipTitle.textContent = `${t('zip_label')} ${t('optional')}`;
  const zipInput = document.createElement('input');
  zipInput.type = 'text';
  zipInput.name = 'zip_code';
  zipInput.placeholder = '...';
  zip.appendChild(zipTitle);
  zip.appendChild(zipInput);
  container.appendChild(zip);

  container.appendChild(
    radioGroup('tourism_work', 'work_label', [
      { value: 'yes_full', key: 'work_yes_full' },
      { value: 'yes_part', key: 'work_yes_part' },
      { value: 'yes_season', key: 'work_yes_season' },
      { value: 'no', key: 'work_no' },
    ])
  );

  container.appendChild(
    checkboxGroup('tourism_job_categories', 'job_label', [
      { value: 'accommodation', key: 'job_accom' },
      { value: 'food_beverage', key: 'job_food' },
      { value: 'transport', key: 'job_transport' },
      { value: 'travel_services', key: 'job_travel' },
      { value: 'recreation', key: 'job_recreation' },
      { value: 'other', key: 'job_other' },
      { value: 'dont_know', key: 'job_dk' },
    ], false)
  );
}

function initializeMap() {
  // Center on Southern Öland (rough). You can adjust to your preferred default.
  const defaultCenter = [56.55, 16.5];
  const defaultZoom = 10;

  map = L.map('map').setView(defaultCenter, defaultZoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  map.on('click', (e) => {
    addOrEditPin({ lat: e.latlng.lat, lng: e.latlng.lng });
  });
}

function addOrEditPin(pin) {
  // Create a new pin object
  const id = pin.id || cryptoRandomId();
  const existing = attractionPins.find(p => p.id === id);

  const draft = existing || {
    id,
    lat: pin.lat,
    lng: pin.lng,
    category: ATTRACTION_CATEGORIES[0].value,
    name: '',
  };

  const marker = L.marker([draft.lat, draft.lng]).addTo(map);

  marker.on('click', () => {
    openPinPopup(marker, draft.id);
  });

  // If editing existing, replace marker reference by deleting old one and keeping new
  draft._marker = marker;

  if (!existing) {
    attractionPins.push(draft);
  } else {
    // update lat/lng if user clicked somewhere new (this path is not used now)
    existing.lat = draft.lat;
    existing.lng = draft.lng;
    existing._marker = marker;
  }

  openPinPopup(marker, draft.id);
  updatePinCount();
}

function openPinPopup(marker, pinId) {
  const pin = attractionPins.find(p => p.id === pinId);
  if (!pin) return;

  const container = document.createElement('div');
  container.style.minWidth = '240px';

  const title = document.createElement('div');
  title.style.fontWeight = '700';
  title.style.marginBottom = '8px';
  title.textContent = t('pin_title');
  container.appendChild(title);

  // Name
  const nameLabel = document.createElement('label');
  nameLabel.style.display = 'block';
  nameLabel.style.marginBottom = '6px';
  nameLabel.textContent = t('pin_name');
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = pin.name || '';
  nameInput.style.width = '100%';
  nameInput.style.boxSizing = 'border-box';
  nameInput.style.marginTop = '4px';
  nameInput.style.padding = '8px';
  nameInput.style.border = '1px solid #ddd';
  nameInput.style.borderRadius = '6px';
  nameLabel.appendChild(nameInput);
  container.appendChild(nameLabel);

  // Category
  const catLabel = document.createElement('label');
  catLabel.style.display = 'block';
  catLabel.style.marginBottom = '10px';
  catLabel.textContent = t('pin_category');
  const select = document.createElement('select');
  select.style.width = '100%';
  select.style.marginTop = '4px';
  select.style.padding = '8px';
  select.style.border = '1px solid #ddd';
  select.style.borderRadius = '6px';

  ATTRACTION_CATEGORIES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.value;
    opt.textContent = t(c.key);
    if (pin.category === c.value) opt.selected = true;
    select.appendChild(opt);
  });
  catLabel.appendChild(select);
  container.appendChild(catLabel);

  // Buttons
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.gap = '8px';
  row.style.justifyContent = 'space-between';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.textContent = t('save');
  saveBtn.style.flex = '1';
  saveBtn.style.cursor = 'pointer';

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.textContent = t('delete');
  delBtn.style.flex = '1';
  delBtn.style.cursor = 'pointer';

  row.appendChild(saveBtn);
  row.appendChild(delBtn);

  container.appendChild(row);

  saveBtn.addEventListener('click', () => {
    pin.name = (nameInput.value || '').trim();
    pin.category = select.value;

    // Update marker popup summary
    marker.bindPopup(pinSummary(pin)).openPopup();
    marker.closePopup(); // close the edit popup
    updatePinCount();
  });

  delBtn.addEventListener('click', () => {
    removePin(pin.id);
  });

  marker.bindPopup(container).openPopup();
}

function pinSummary(pin) {
  const catKey = ATTRACTION_CATEGORIES.find(c => c.value === pin.category)?.key || '';
  const cat = catKey ? t(catKey) : pin.category;
  const name = pin.name ? escapeHtml(pin.name) : '<em>(no name)</em>';
  return `<div><strong>${cat}</strong><br/>${name}</div>`;
}

function removePin(id) {
  const idx = attractionPins.findIndex(p => p.id === id);
  if (idx === -1) return;
  const pin = attractionPins[idx];
  if (pin._marker) {
    map.removeLayer(pin._marker);
  }
  attractionPins.splice(idx, 1);
  updatePinCount();
}

function clearPins() {
  attractionPins.forEach(p => {
    if (p._marker) map.removeLayer(p._marker);
  });
  attractionPins = [];
  updatePinCount();
}

function updatePinCount() {
  const el = document.getElementById('pin-count');
  if (el) el.textContent = String(attractionPins.length);
}

function cryptoRandomId() {
  try {
    const arr = new Uint8Array(8);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return String(Date.now()) + String(Math.random()).slice(2);
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showMessage(msg, type) {
  const div = document.getElementById('message');
  if (!div) return;
  div.textContent = msg;
  div.className = type;
  div.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => (div.style.display = 'none'), 7000);
}

function collectFormData() {
  const formEl = document.getElementById('survey-form');
  const fd = new FormData(formEl);
  const data = {};

  // Basic scalar fields (radios + text)
  for (const [k, v] of fd.entries()) {
    // checkbox group for job categories -> array
    if (k === 'tourism_job_categories') {
      if (!data[k]) data[k] = [];
      data[k].push(v);
    } else if (k === 'consent') {
      // consent checkbox returns "on" if checked; convert to boolean
      data[k] = true;
    } else {
      data[k] = v;
    }
  }

  data.language = currentLanguage;

  // Map pins - strip marker refs
  data.attraction_pins = attractionPins.map(p => ({
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    category: p.category,
    name: p.name || '',
  }));

  // Also keep raw question responses in a nested object for simpler backend storage
  data.responses = {};

  // Collect all likert radios by name prefix
  const allInputs = formEl.querySelectorAll('input[type="radio"]:checked');
  allInputs.forEach(inp => {
    data.responses[inp.name] = inp.value;
  });

  return data;
}

function validateForm(data) {
  // Consent
  if (!data.consent) {
    showMessage(t('err_consent'), 'error');
    return false;
  }

  // Pins: 5–10
  const n = (data.attraction_pins || []).length;
  if (n < 5 || n > 10) {
    showMessage(t('err_pins'), 'error');
    return false;
  }

  // Required radios: ensure no unanswered in the two likert blocks + demographics
  const formEl = document.getElementById('survey-form');
  const requiredRadios = Array.from(formEl.querySelectorAll('input[type="radio"][required]'))
    .map(i => i.name)
    .filter((v, i, a) => a.indexOf(v) === i);

  for (const name of requiredRadios) {
    const checked = formEl.querySelector(`input[name="${CSS.escape(name)}"]:checked`);
    if (!checked) {
      showMessage(t('err_required'), 'error');
      const el = formEl.querySelector(`input[name="${CSS.escape(name)}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
  }

  return true;
}

async function submitForm() {
  try {
    const data = collectFormData();
    if (!validateForm(data)) return;

    // Prefer offline manager if your repo uses it
    if (window.offlineManager && typeof window.offlineManager.submitSurvey === 'function') {
      const result = await window.offlineManager.submitSurvey({
        // Keep backward compatibility: offline.js might expect a flat object. We provide JSON-safe object.
        ...data,
        attraction_pins: JSON.stringify(data.attraction_pins),
        responses: JSON.stringify(data.responses),
      });

      if (result && result.success) {
        showMessage(t('success'), 'success');
        document.getElementById('survey-form').reset();
        clearPins();
        return;
      }
      throw new Error('offlineManager submission failed');
    }

    // Fallback direct POST
    const res = await fetch('/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);
    showMessage(t('success'), 'success');
    document.getElementById('survey-form').reset();
    clearPins();
  } catch (e) {
    console.error(e);
    showMessage(t('error'), 'error');
  }
}

if (location.pathname.endsWith('/dashboard.html') && sessionStorage.getItem('nyayasetu-auth-demo') !== 'true') {
  window.location.assign('login/');
}

const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('[data-view]');
const crumbTitle = document.getElementById('crumbTitle');
const sidebar = document.getElementById('sidebar');
const titles = { overview: 'Dashboard', ask: 'Ask NyayaSetu', document: 'Analyze document', roadmaps: 'My roadmaps', checklist: 'Evidence checklist', resources: 'Saved resources' };
let currentLanguage = 'english';

function showView(name) {
  views.forEach(view => view.classList.toggle('active', view.id === `${name}View`));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === name));
  document.querySelectorAll('.mobile-bottom-item[data-view]').forEach(item => item.classList.toggle('active', item.dataset.view === name));
  crumbTitle.textContent = languageText[currentLanguage]?.[name] || titles[name] || 'Overview';
  sidebar.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach(item => item.addEventListener('click', () => showView(item.dataset.view)));
document.getElementById('mobileMenu').addEventListener('click', () => sidebar.classList.toggle('open'));
document.querySelector('.safety-banner button').addEventListener('click', event => event.currentTarget.parentElement.remove());

const languageText = {
  english: { overview: 'Dashboard', ask: 'Ask NyayaSetu', document: 'Analyze document', roadmaps: 'My roadmaps', checklist: 'Evidence checklist', resources: 'Saved resources' },
  hindi: { overview: 'अवलोकन', ask: 'न्यायसेतु से पूछें', document: 'दस्तावेज़ विश्लेषण', roadmaps: 'मेरे रोडमैप', checklist: 'सबूत की सूची', resources: 'सहेजे गए स्रोत' }
};

const hashViews = { '#ask': 'ask', '#document': 'document', '#roadmaps': 'roadmaps', '#resources': 'resources' };
if (hashViews[location.hash]) showView(hashViews[location.hash]);

document.getElementById('languageToggle').addEventListener('click', event => {
  const button = event.currentTarget;
  const isHindi = button.dataset.language === 'hindi';
  button.dataset.language = isHindi ? 'english' : 'hindi';
  button.innerHTML = isHindi ? '<span>अ</span> हिन्दी <b>⌄</b>' : '<span>A</span> English <b>⌄</b>';
  const language = isHindi ? 'english' : 'hindi';
  currentLanguage = language;
  document.querySelectorAll('.nav-item').forEach(item => {
    const label = item.querySelector('.nav-icon').nextSibling;
    if (label) label.textContent = ` ${languageText[language][item.dataset.view]}`;
  });
  document.getElementById('crumbTitle').textContent = languageText[language][document.querySelector('.nav-item.active')?.dataset.view || 'overview'];
  document.querySelectorAll('.ai-label').forEach(label => { label.innerHTML = language === 'hindi' ? '<span>✦</span> AI कानूनी व्याख्याकार' : '<span>✦</span> AI legal explainer'; });
  document.querySelectorAll('.ai-tag').forEach(label => { label.textContent = language === 'hindi' ? '✦ AI द्वारा तैयार जानकारी' : '✦ AI-generated information'; });
});

document.querySelectorAll('.suggestions button').forEach(button => button.addEventListener('click', () => {
  document.getElementById('situationInput').value = `${button.textContent} — I would like to understand my options and what evidence I should keep.`;
}));

const dashboardInput = document.getElementById('dashboardInput');
if (dashboardInput) {
  document.querySelectorAll('.assistant-prompts button').forEach(button => button.addEventListener('click', () => {
    dashboardInput.value = button.dataset.prompt;
  }));
  document.getElementById('dashboardAsk').addEventListener('click', () => {
    const value = dashboardInput.value.trim();
    if (!value) {
      dashboardInput.focus();
      return;
    }
    situationInput.value = value;
    situationInput.dispatchEvent(new Event('input'));
    showView('ask');
    generateButton.click();
  });
}

const situationInput = document.getElementById('situationInput');
const inputError = document.getElementById('inputError');
const analysisResult = document.getElementById('analysisResult');
const generateButton = document.getElementById('generateRoadmap');

situationInput.addEventListener('input', () => {
  document.getElementById('characterCount').textContent = `${situationInput.value.length} / 2,000 characters`;
  inputError.textContent = '';
});

generateButton.addEventListener('click', () => {
  if (!situationInput.value.trim()) {
    inputError.textContent = 'Tell us a little about what happened so we can create a useful explanation.';
    situationInput.focus();
    return;
  }
  generateButton.disabled = true;
  generateButton.innerHTML = 'Analyzing your situation <span class="loading-dot">•••</span>';
  window.setTimeout(() => {
    analysisResult.hidden = false;
    generateButton.disabled = false;
    generateButton.innerHTML = 'Analyze again <span>→</span>';
    analysisResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 650);
});

document.getElementById('viewGeneratedRoadmap').addEventListener('click', () => showView('roadmaps'));

document.querySelectorAll('.check-row').forEach(row => row.addEventListener('click', () => {
  const input = row.querySelector('input');
  input.checked = !input.checked;
  row.classList.toggle('done', input.checked);
  row.querySelector('.custom-check').textContent = input.checked ? '✓' : '';
  const checked = document.querySelectorAll('.check-row input:checked').length;
  document.getElementById('checkCount').textContent = checked;
  document.getElementById('checkProgress').style.width = `${checked * 20}%`;
}));

document.getElementById('uploadButton').addEventListener('click', () => document.getElementById('fileInput').click());
const documentResult = document.getElementById('documentResult');
const uploadStatus = document.getElementById('uploadStatus');

function showDocumentError(message) {
  documentResult.hidden = false;
  documentResult.innerHTML = `<div class="document-error"><strong>We could not read that document.</strong><p>${message}</p><span>No summary was generated. Try a text-based PDF, a clear image, or a smaller file.</span></div>`;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function showDocumentSummary(fileName, extractedText) {
  documentResult.hidden = false;
  const preview = escapeHtml(extractedText.slice(0, 140));
  documentResult.innerHTML = `<div class="result-heading"><div><span class="section-kicker">DOCUMENT REVIEW</span><h2>What this document may mean for you</h2></div><span class="ai-tag">✦ AI-generated explanation</span></div><p class="document-file">${escapeHtml(fileName)} · original file unchanged</p><div class="document-summary-grid"><article><strong>Important dates</strong><p>Dates detected in extracted text will appear here for review. Verify every deadline against the original.</p></article><article><strong>Parties and roles</strong><p>Names and roles can be identified from readable text, but should be checked against the document.</p></article><article><strong>Payments and obligations</strong><p>Payment amounts, due dates and responsibilities need confirmation before you act.</p></article><article><strong>Key clauses and terms</strong><p>Potentially confusing terminology is flagged for plain-language explanation, not a legal conclusion.</p></article></div><div class="extracted-preview"><strong>Readable text found</strong><p>${preview || 'The file opened, but no readable text was found.'}</p></div><button class="outline-button delete-document" id="deleteDocument">Delete this document from the session</button><div class="result-disclaimer">This is a text-extraction preview, not legal advice. Keep the original document and verify important details with a professional.</div>`;
}

async function extractPdf(file) {
  if (!window.pdfjsLib) throw new Error('PDF extraction is unavailable right now.');
  const buffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
  let text = '';
  for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 8); pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    text += `${content.items.map(item => item.str).join(' ')} `;
  }
  if (!text.trim()) throw new Error('No readable text was found in this PDF.');
  return text.trim();
}

document.getElementById('fileInput').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  const supported = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];
  if (file.size > 10 * 1024 * 1024 || !supported.includes(file.type)) {
    showDocumentError('This file type or size is not supported.');
    return;
  }
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  document.querySelector('.upload-panel h2').textContent = safeFileName;
  uploadStatus.textContent = 'Reading document securely in your browser…';
  document.getElementById('uploadButton').disabled = true;
  try {
    let extractedText = '';
    if (file.type === 'application/pdf') extractedText = await extractPdf(file);
    else if (file.type === 'text/plain') extractedText = await file.text();
    else throw new Error('This image needs OCR support before a reliable summary can be created.');
    showDocumentSummary(file.name, extractedText);
    uploadStatus.textContent = 'Text extracted · original document remains unchanged';
  } catch (error) {
    showDocumentError(error.message || 'The document could not be read.');
    uploadStatus.textContent = 'Extraction needs attention';
  } finally {
    document.getElementById('uploadButton').disabled = false;
  }
});

document.getElementById('documentResult').addEventListener('click', event => {
  if (!event.target.closest('#deleteDocument')) return;
  document.getElementById('documentResult').hidden = true;
  document.querySelector('.upload-panel h2').textContent = 'Drop a document here';
  uploadStatus.textContent = 'Document removed from this session';
  document.getElementById('fileInput').value = '';
});

const roadmapStages = document.querySelectorAll('.timeline-item');
roadmapStages.forEach(stage => {
  stage.tabIndex = 0;
  stage.setAttribute('role', 'button');
  stage.setAttribute('aria-expanded', 'true');
  const toggleStage = () => {
    stage.classList.toggle('collapsed');
    stage.setAttribute('aria-expanded', String(!stage.classList.contains('collapsed')));
  };
  stage.addEventListener('click', event => {
    if (event.target.closest('input, button, a, label')) return;
    toggleStage();
  });
  stage.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleStage();
    }
  });
});

const termDefinitions = {
  'grievance redressal': { meaning: 'A process for receiving, reviewing and responding to a complaint.', why: 'It may be the first internal route to contact a seller or service provider before considering another forum.', example: 'You use a company grievance channel to record that your paid order was not delivered.', source: 'Department of Consumer Affairs · official consumer information' },
  'consumer complaint': { meaning: 'A formal complaint by a consumer about goods or services, such as non-delivery or misleading information.', why: 'It can help organize your issue and the remedy you are asking for.', example: 'You keep the invoice and ask for delivery or a refund after the seller does not respond.', source: 'National Consumer Helpline · consumer support information' },
  'notice period': { meaning: 'The amount of time a person or organization is expected to give before a particular action takes effect.', why: 'Missing or misunderstanding a notice period can affect what you do next.', example: 'A contract asks one party to give written notice before ending the arrangement.', source: 'No single source identified · verify the specific document and jurisdiction' }
};
const explainTermButton = document.getElementById('explainTerm');
const termInput = document.getElementById('termInput');
const termResult = document.getElementById('termResult');
explainTermButton.addEventListener('click', () => {
  const query = termInput.value.trim().toLowerCase();
  if (!query) {
    termResult.hidden = false;
    termResult.innerHTML = '<p class="input-error">Enter a term to explain.</p>';
    return;
  }
  const definition = termDefinitions[query];
  termResult.hidden = false;
  if (!definition) {
    termResult.innerHTML = `<strong>We need to verify that term first.</strong><p>No reliable source is attached to “${termInput.value}” in this demo, so we will not guess. Check the original document or ask a qualified professional.</p>`;
    return;
  }
  termResult.innerHTML = `<div><span class="section-kicker">SIMPLE MEANING</span><strong>${definition.meaning}</strong></div><div><span class="section-kicker">WHY IT MAY MATTER</span><p>${definition.why}</p></div><div><span class="section-kicker">EASY EXAMPLE</span><p>${definition.example}</p></div><div><span class="section-kicker">REFERENCE</span><p>${definition.source}</p></div>`;
});

const checklistRows = document.querySelectorAll('.check-row');
const storedChecklist = JSON.parse(sessionStorage.getItem('nyayasetu-checklist') || 'null');
if (storedChecklist) {
  checklistRows.forEach((row, index) => {
    const input = row.querySelector('input');
    input.checked = Boolean(storedChecklist[index]);
    row.classList.toggle('done', input.checked);
    row.querySelector('.custom-check').textContent = input.checked ? '✓' : '';
  });
}
checklistRows.forEach(row => row.addEventListener('click', () => {
  sessionStorage.setItem('nyayasetu-checklist', JSON.stringify([...checklistRows].map(item => item.querySelector('input').checked)));
}));

document.getElementById('clearSession').addEventListener('click', event => {
  sessionStorage.clear();
  checklistRows.forEach((row, index) => {
    const input = row.querySelector('input');
    input.checked = index === 0;
    row.classList.toggle('done', input.checked);
    row.querySelector('.custom-check').textContent = input.checked ? '✓' : '';
  });
  document.getElementById('checkCount').textContent = '1';
  document.getElementById('checkProgress').style.width = '20%';
  event.currentTarget.textContent = 'Session data cleared';
});

const logoutButton = document.getElementById('logoutButton');
if (logoutButton) logoutButton.addEventListener('click', () => {
  sessionStorage.removeItem('nyayasetu-auth-demo');
  window.location.assign('index.html');
});
const profileMenu = document.getElementById('profileMenu');
if (profileMenu) profileMenu.addEventListener('click', () => document.getElementById('privacyCenter').click());
const managePrivacy = document.getElementById('managePrivacy');
if (managePrivacy) managePrivacy.addEventListener('click', () => document.getElementById('privacyCenter').click());
const privacyNav = document.getElementById('privacyNav');
if (privacyNav) privacyNav.addEventListener('click', () => document.getElementById('privacyCenter').click());
const settingsNav = document.getElementById('settingsNav');
if (settingsNav) settingsNav.addEventListener('click', () => document.getElementById('privacyCenter').click());

const privacyModal = document.getElementById('privacyModal');
const privacyFeedback = document.getElementById('privacyFeedback');
document.getElementById('privacyCenter').addEventListener('click', () => { privacyModal.hidden = false; });
document.getElementById('mobileProfile').addEventListener('click', () => { privacyModal.hidden = false; });
document.getElementById('closePrivacy').addEventListener('click', () => { privacyModal.hidden = true; });
document.querySelectorAll('.profile-shortcuts [data-view]').forEach(button => button.addEventListener('click', () => { privacyModal.hidden = true; }));
if (location.hash === '#profile') privacyModal.hidden = false;
document.getElementById('deleteMyData').addEventListener('click', () => {
  sessionStorage.clear();
  privacyFeedback.textContent = 'Demo checklist data deleted from this browser session.';
});
document.getElementById('logoutDemo').addEventListener('click', () => {
  sessionStorage.clear();
  privacyFeedback.textContent = 'Demo session cleared. Production logout must revoke the authenticated server session.';
});
document.getElementById('profilePrivacy').addEventListener('click', () => { privacyModal.hidden = true; document.getElementById('privacyCenter').click(); });
document.getElementById('profileSettings').addEventListener('click', () => { privacyFeedback.textContent = 'Settings are ready for the authenticated production workspace.'; });
document.getElementById('profileHelp').addEventListener('click', () => { privacyFeedback.textContent = 'For urgent matters, contact a qualified professional or appropriate official authority.'; });

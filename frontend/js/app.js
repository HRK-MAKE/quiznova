const API_BASE = localStorage.getItem('qn_api_base') || 'http://localhost:4000';
const $ = (id) => document.getElementById(id);
const state = { token: localStorage.getItem('qn_token') || '', user: null, quizzes: [], editingId: null, mode: 'login', toastTimer: null };

function toast(message, isError = false) {
  const el = $('toast'); el.textContent = message; el.classList.toggle('error', isError); el.classList.add('show');
  clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}
function setAuthMessage(message = '', error = false) { $('authMessage').textContent = message; $('authMessage').style.color = error ? '#c34455' : '#23966f'; }
function setAuthMode(mode) {
  state.mode = mode; const register = mode === 'register';
  $('nameWrap').hidden = !register; $('roleWrap').hidden = !register;
  $('authTitle').textContent = register ? 'Create your account' : 'Welcome back';
  $('authSubtitle').textContent = register ? 'Join QuizNova and make learning more engaging.' : 'Sign in to continue your learning journey.';
  $('authSubmit').querySelector('span').textContent = register ? 'Create account' : 'Sign in';
  $('loginTab').classList.toggle('active', !register); $('registerTab').classList.toggle('active', register);
  $('password').autocomplete = register ? 'new-password' : 'current-password'; setAuthMessage('');
}
async function api(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}), ...(options.headers || {}) };
  let response;
  try { response = await fetch(`${API_BASE}${path}`, { ...options, headers }); }
  catch { throw new Error(`Cannot reach QuizNova API at ${API_BASE}. Check that the backend is running.`); }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload.data;
}
function showApp() { $('authView').hidden = true; $('appView').hidden = false; }
function showAuth() { $('appView').hidden = true; $('authView').hidden = false; setAuthMode('login'); }
function setUser(user) {
  state.user = user;
  const isStudent = user.role === 'STUDENT';
  $('appView').classList.toggle('student-mode', isStudent);
  $('studentHome').hidden = !isStudent; $('teacherStats').hidden = isStudent; $('teacherRecent').hidden = isStudent;
  document.querySelectorAll('.nav-link[data-page="quizzes"], .nav-link[data-page="create"]').forEach(el => el.hidden = isStudent);
  document.querySelectorAll('[data-page="create"]').forEach(el => el.hidden = isStudent);
  $('upgrade-link')?.setAttribute('hidden', isStudent ? '' : null); $('userName').textContent = user.fullName || 'QuizNova user'; $('userRole').textContent = user.role || 'USER';
  $('userAvatar').textContent = (user.fullName || user.email || 'Q').trim().charAt(0).toUpperCase();
  const first = (user.fullName || 'there').trim().split(/\s+/)[0]; $('welcomeTitle').textContent = `Good to see you, ${first}.`;
  $('todayLabel').textContent = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
}
function switchPage(page) {
  const pages = ['overview', 'quizzes', 'create', 'library'];
  pages.forEach(name => { $(`${name}Page`).hidden = name !== page; });
  document.querySelectorAll('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.page === page));
  $('breadcrumbPage').textContent = ({ overview: 'Overview', quizzes: 'My quizzes', create: state.editingId ? 'Edit quiz' : 'Create a quiz', library: 'Quiz library' })[page] || 'Overview';
  $('sidebar').classList.remove('open');
  if (page === 'quizzes') renderAllQuizzes();
  if (page === 'overview') renderOverview();
}
function safeDate(value) { if (!value) return 'Recently updated'; const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Recently updated' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
function escapeHTML(value = '') { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function quizCard(quiz, index = 0) {
  const published = quiz.status === 'PUBLISHED'; const icons = ['✦', '▤', '◈', '✧']; const colors = ['', 'orange', 'green', ''];
  const card = document.createElement('article'); card.className = 'quiz-card';
  card.innerHTML = `<div class="quiz-card-top"><span class="quiz-art ${colors[index % colors.length]}">${icons[index % icons.length]}</span><span class="status-pill ${published ? 'published' : 'draft'}">${published ? 'PUBLISHED' : 'DRAFT'}</span></div><h3>${escapeHTML(quiz.title)}</h3><p>${escapeHTML(quiz.description || quiz.subject || 'Add a description to tell learners what this quiz is about.')}</p><div class="quiz-card-meta"><span>▤ ${Array.isArray(quiz.questions) ? quiz.questions.length : 0} questions</span><span>↻ ${safeDate(quiz.updatedAt)}</span></div><div class="quiz-card-actions"><button class="small-action edit-quiz" type="button">Edit quiz</button><button class="small-action danger delete-quiz" type="button">Delete</button></div>`;
  card.querySelector('.edit-quiz').addEventListener('click', () => editQuiz(quiz._id));
  card.querySelector('.delete-quiz').addEventListener('click', () => deleteQuiz(quiz._id, quiz.title));
  return card;
}
async function loadQuizzes() {
  if (!state.user || state.user.role !== 'TEACHER') { state.quizzes = []; renderOverview(); return; }
  const data = await api('/api/quizzes'); state.quizzes = data.quizzes || []; renderOverview();
}
function renderOverview() {
  const quizzes = state.quizzes; $('statTotal').textContent = quizzes.length;
  $('statPublished').textContent = quizzes.filter(q => q.status === 'PUBLISHED').length;
  $('statDrafts').textContent = quizzes.filter(q => q.status !== 'PUBLISHED').length;
  const grid = $('recentGrid'); grid.replaceChildren();
  quizzes.slice(0, 3).forEach((quiz, index) => grid.append(quizCard(quiz, index)));
  $('recentEmpty').hidden = quizzes.length !== 0; grid.hidden = quizzes.length === 0;
}
function renderAllQuizzes() {
  const term = $('quizSearch').value.trim().toLowerCase(); const filter = $('statusFilter').value;
  const matches = state.quizzes.filter(q => (filter === 'ALL' || q.status === filter) && `${q.title} ${q.description || ''} ${q.subject || ''}`.toLowerCase().includes(term));
  const grid = $('allQuizGrid'); grid.replaceChildren(); matches.forEach((quiz, index) => grid.append(quizCard(quiz, index)));
  $('allEmpty').hidden = matches.length > 0; grid.hidden = matches.length === 0;
}
function resetBuilder() {
  state.editingId = null; $('quizEditorForm').reset(); $('quizDifficulty').value = 'MEDIUM'; $('questionEditorList').replaceChildren(); updateQuestionCounts();
  $('builderHeading').textContent = 'Create a quiz'; $('breadcrumbPage').textContent = 'Create a quiz';
}
function makeOption(text = '', correct = false) {
  const row = document.createElement('div'); row.className = 'option-row';
  const radio = document.createElement('input'); radio.type = 'radio'; radio.className = 'correct-option'; radio.title = 'Mark as correct answer'; radio.checked = correct;
  const input = document.createElement('input'); input.type = 'text'; input.className = 'option-text'; input.placeholder = `Answer option`; input.value = text; input.required = true;
  const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-option'; remove.textContent = '×'; remove.title = 'Remove option';
  remove.addEventListener('click', () => { row.remove(); const first = row.closest('.option-list')?.querySelector('.correct-option'); if (first && !row.closest('.option-list').querySelector('.correct-option:checked')) first.checked = true; });
  row.append(radio, input, remove); return row;
}
function addQuestion(data = {}) {
  const fragment = $('questionTemplate').content.cloneNode(true); const card = fragment.querySelector('.question-card');
  const type = data.type || 'MCQ'; card.querySelector('.question-type').value = type; card.querySelector('.question-time').value = String(data.timeLimit || 20);
  card.querySelector('.question-prompt').value = data.text || ''; card.querySelector('.question-explanation').value = data.explanation || '';
  const list = card.querySelector('.option-list');
  if (type === 'TRUE_FALSE') {
    const options = data.options?.length ? data.options : [{ text: 'True', isCorrect: false }, { text: 'False', isCorrect: false }];
    options.forEach(o => list.append(makeOption(o.text, o.isCorrect)));
  } else if (type === 'MCQ') {
    const options = data.options?.length ? data.options : [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }];
    options.forEach(o => list.append(makeOption(o.text, o.isCorrect)));
  } else {
    const answer = (data.acceptedAnswers || [''])[0]; list.append(makeOption(answer, true));
  }
  const addOptionButton = card.querySelector('.add-option');
  addOptionButton.addEventListener('click', () => { if (list.children.length >= 6) return toast('A question can have up to 6 options.', true); list.append(makeOption('', false)); });
  card.querySelector('.remove-question').addEventListener('click', () => { card.remove(); renumberQuestions(); });
  card.querySelector('.duplicate-question').addEventListener('click', () => {
    const duplicate = { type: card.querySelector('.question-type').value, text: card.querySelector('.question-prompt').value, timeLimit: Number(card.querySelector('.question-time').value), explanation: card.querySelector('.question-explanation').value, options: [...list.querySelectorAll('.option-row')].map(row => ({ text: row.querySelector('.option-text').value, isCorrect: row.querySelector('.correct-option').checked })) };
    addQuestion(duplicate); toast('Question duplicated.');
  });
  card.querySelector('.question-type').addEventListener('change', event => {
    const next = event.target.value; list.replaceChildren();
    if (next === 'TRUE_FALSE') { list.append(makeOption('True', true), makeOption('False', false)); }
    else if (next === 'FILL_BLANK') { list.append(makeOption('', true)); }
    else { list.append(makeOption('', true), makeOption('', false), makeOption('', false), makeOption('', false)); }
    const isFill = next === 'FILL_BLANK'; addOptionButton.hidden = isFill || next === 'TRUE_FALSE';
    card.querySelector('.answer-heading b').textContent = isFill ? 'Accepted answer' : 'Answer options';
  });
  const isFill = type === 'FILL_BLANK'; addOptionButton.hidden = isFill || type === 'TRUE_FALSE';
  card.querySelector('.answer-heading b').textContent = isFill ? 'Accepted answer' : 'Answer options';
  $('questionEditorList').append(card); renumberQuestions();
}
function renumberQuestions() {
  const cards = [...$('questionEditorList').children]; cards.forEach((card, index) => card.querySelector('.q-index').textContent = index + 1);
  $('noQuestionsHint').hidden = cards.length > 0; updateQuestionCounts();
}
function updateQuestionCounts() {
  const count = $('questionEditorList').children.length; $('questionCount').textContent = count; $('summaryQuestionCount').textContent = count;
  $('summaryDifficulty').textContent = $('quizDifficulty').selectedOptions[0]?.text || 'Medium';
}
function collectQuestions() {
  const cards = [...$('questionEditorList').children]; const questions = [];
  for (let index = 0; index < cards.length; index++) {
    const card = cards[index], type = card.querySelector('.question-type').value;
    const text = card.querySelector('.question-prompt').value.trim();
    if (!text) throw new Error(`Please enter the text for question ${index + 1}.`);
    const rows = [...card.querySelectorAll('.option-row')]; const options = rows.map(row => ({ text: row.querySelector('.option-text').value.trim(), isCorrect: row.querySelector('.correct-option').checked }));
    if (options.some(o => !o.text)) throw new Error(`Please complete every answer option in question ${index + 1}.`);
    if (!options.some(o => o.isCorrect)) throw new Error(`Choose the correct answer for question ${index + 1}.`);
    if (type === 'MCQ' && (options.length < 2 || options.length > 6)) throw new Error(`Question ${index + 1} needs 2–6 options.`);
    if (type === 'TRUE_FALSE' && options.length !== 2) throw new Error(`True/false question ${index + 1} must have two options.`);
    questions.push({ type, text, options: type === 'FILL_BLANK' ? [] : options, acceptedAnswers: type === 'FILL_BLANK' ? [options.find(o => o.isCorrect).text] : [], timeLimit: Number(card.querySelector('.question-time').value), points: 1000, explanation: card.querySelector('.question-explanation').value.trim(), orderIndex: index });
  }
  return questions;
}
async function saveQuiz(status) {
  try {
    const title = $('quizTitle').value.trim(); if (!title) throw new Error('Please enter a quiz title.');
    const questions = collectQuestions();
    if (status === 'PUBLISHED' && questions.length === 0) throw new Error('Add at least one question before publishing.');
    const payload = { title, description: $('quizDescription').value.trim(), subject: $('quizSubject').value.trim(), topic: $('quizTopic').value.trim(), difficulty: $('quizDifficulty').value, status, questions };
    if (state.editingId) {
      await api(`/api/quizzes/${state.editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      // The current backend POST route creates the quiz shell; PUT persists questions/status.
      const created = await api('/api/quizzes', { method: 'POST', body: JSON.stringify({ title, description: payload.description, subject: payload.subject, topic: payload.topic, difficulty: payload.difficulty }) });
      const newId = created.quiz?._id;
      if (!newId) throw new Error('Quiz was created, but the server did not return its ID. Refresh your quiz list.');
      await api(`/api/quizzes/${newId}`, { method: 'PUT', body: JSON.stringify(payload) });
    }
    toast(status === 'PUBLISHED' ? 'Quiz published successfully.' : 'Quiz saved as draft.');
    await loadQuizzes(); resetBuilder(); switchPage('quizzes');
  } catch (error) { toast(error.message, true); }
}
async function editQuiz(id) {
  try {
    const data = await api(`/api/quizzes/${id}`); const quiz = data.quiz; state.editingId = id;
    $('quizTitle').value = quiz.title || ''; $('quizDescription').value = quiz.description || ''; $('quizSubject').value = quiz.subject || ''; $('quizTopic').value = quiz.topic || ''; $('quizDifficulty').value = quiz.difficulty || 'MEDIUM';
    $('questionEditorList').replaceChildren(); (quiz.questions || []).forEach(q => addQuestion(q));
    $('builderHeading').textContent = 'Edit your quiz'; switchPage('create');
  } catch (error) { toast(error.message, true); }
}
async function deleteQuiz(id, title) {
  if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
  try { await api(`/api/quizzes/${id}`, { method: 'DELETE' }); toast('Quiz deleted.'); await loadQuizzes(); renderAllQuizzes(); }
  catch (error) { toast(error.message, true); }
}
async function handleAuth(event) {
  event.preventDefault(); setAuthMessage('Connecting…'); $('authSubmit').disabled = true;
  try {
    const payload = { email: $('email').value.trim(), password: $('password').value };
    if (state.mode === 'register') { payload.fullName = $('fullName').value.trim(); payload.role = $('role').value; }
    const data = await api(`/api/auth/${state.mode}`, { method: 'POST', body: JSON.stringify(payload) });
    if (state.mode === 'register') { setAuthMode('login'); $('email').value = payload.email; setAuthMessage('Account created. Please sign in.'); toast('Account created. Please sign in.'); return; }
    state.token = data.token; state.user = data.user; localStorage.setItem('qn_token', state.token); localStorage.setItem('qn_user', JSON.stringify(state.user));
    setUser(state.user); showApp();
    if (state.user.role === 'TEACHER') await loadQuizzes(); else { state.quizzes = []; renderOverview(); toast('Signed in. Student gameplay is not enabled on the server yet.'); }
    switchPage('overview');
  } catch (error) { setAuthMessage(error.message, true); }
  finally { $('authSubmit').disabled = false; }
}
async function restoreSession() {
  if (!state.token) return showAuth();
  try {
    const data = await api('/api/auth/me'); state.user = data.user; setUser(state.user); showApp();
    if (state.user.role === 'TEACHER') await loadQuizzes(); else state.quizzes = [];
    switchPage('overview');
  } catch { state.token = ''; localStorage.removeItem('qn_token'); localStorage.removeItem('qn_user'); showAuth(); }
}
function logout() { state.token = ''; state.user = null; state.quizzes = []; localStorage.removeItem('qn_token'); localStorage.removeItem('qn_user'); showAuth(); toast('You have signed out.'); }

$('loginTab').addEventListener('click', () => setAuthMode('login'));
$('registerTab').addEventListener('click', () => setAuthMode('register'));
$('authForm').addEventListener('submit', handleAuth);
$('logoutButton').addEventListener('click', logout);
document.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => { const page = button.dataset.page; if (page === 'create' && !state.editingId) resetBuilder(); switchPage(page); }));
$('menuButton').addEventListener('click', () => $('sidebar').classList.toggle('open'));
$('quizSearch').addEventListener('input', renderAllQuizzes); $('statusFilter').addEventListener('change', renderAllQuizzes);
$('addQuestionButton').addEventListener('click', () => addQuestion()); $('firstQuestionButton').addEventListener('click', () => addQuestion());
$('quizDifficulty').addEventListener('change', updateQuestionCounts);
$('saveDraftButton').addEventListener('click', () => saveQuiz('DRAFT'));
$('publishButton').addEventListener('click', () => saveQuiz('PUBLISHED'));
$('quizEditorForm').addEventListener('submit', event => event.preventDefault());
setAuthMode('login'); restoreSession();

const isRegister = document.body.dataset.authPage === 'register';
const form = document.getElementById('authForm');
const message = document.getElementById('authMessage');
const submitButton = document.getElementById('submitButton');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function setError(id, text) { const node = document.getElementById(id); if (node) node.textContent = text; }
function clearErrors() { document.querySelectorAll('.field-error').forEach(node => { node.textContent = ''; }); message.textContent = ''; message.className = 'auth-message'; }
form.addEventListener('submit', event => {
  event.preventDefault(); clearErrors();
  const data = new FormData(form); const email = String(data.get('email') || '').trim(); const password = String(data.get('password') || '');
  let valid = true;
  if (!emailPattern.test(email)) { setError('emailError', 'Enter a valid email address.'); valid = false; }
  if (password.length < 8) { setError('passwordError', 'Use at least 8 characters.'); valid = false; }
  if (isRegister) {
    if (!String(data.get('fullName') || '').trim()) { setError('nameError', 'Enter your name.'); valid = false; }
    if (password !== String(data.get('confirmPassword') || '')) { setError('confirmError', 'Passwords do not match.'); valid = false; }
    if (!document.getElementById('terms').checked) { setError('termsError', 'Accept the Terms and Privacy Policy to continue.'); valid = false; }
  }
  if (!valid) return;
  submitButton.disabled = true; submitButton.textContent = isRegister ? 'Creating your space…' : 'Signing you in…';
  window.setTimeout(() => {
    sessionStorage.setItem('nyayasetu-auth-demo', 'true'); message.textContent = isRegister ? 'Account created in demo mode. Opening your workspace…' : 'Signed in to demo mode. Opening your workspace…'; message.className = 'auth-message success';
    window.setTimeout(() => { window.location.assign('../dashboard.html'); }, 500);
  }, 700);
});
const forgot = document.getElementById('forgotPassword');
if (forgot) forgot.addEventListener('click', event => { event.preventDefault(); clearErrors(); message.textContent = 'If an account exists for that email, reset instructions will be sent. Demo email delivery is not connected.'; message.className = 'auth-message success'; });

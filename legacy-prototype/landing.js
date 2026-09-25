const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');
navToggle.addEventListener('click', () => siteNav.classList.toggle('open'));
document.querySelectorAll('#siteNav a').forEach(link => link.addEventListener('click', () => siteNav.classList.remove('open')));

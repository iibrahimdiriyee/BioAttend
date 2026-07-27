/* =====================================================================
   BioAttend — Shared Application Logic
   -----------------------------------------------------------------
   Loaded on every page (index.html, student.html, lecturer.html,
   admin.html). Functions no-op safely on pages that don't contain
   the relevant elements, so this one file can be shared everywhere
   without per-page checks at the call site.

   Sections:
     1. Navigation (login -> role page, logout -> login)
     2. Login form (password show/hide, submit)
     3. Student: biometric attendance flow
     4. Live clock + session countdown (student + lecturer pages)
     5. Lecturer: live attendance roll simulation
     6. Admin: CSV export
     7. Toast notifications (used by all pages)
     8. Init
===================================================================== */

// ===================== 1. NAVIGATION =====================
// This is a static, multi-page site now: each role has its own HTML
// file (student.html, lecturer.html, admin.html) and index.html is
// the login page. Navigation between them is a real page load via
// <a href="..."> links, not a JS-driven div toggle.
//
// ROLE_PAGES maps a login-form role value to the file that role
// should land on after signing in.
const ROLE_PAGES = {
  student: 'student.html',
  lecturer: 'lecturer.html',
  admin: 'admin.html',
};

// ===================== 2. LOGIN =====================
function doLogin() {
  const roleSelect = document.getElementById('login-role');
  if (!roleSelect) return; // safety: only relevant on index.html

  const role = roleSelect.value;
  const btn = event.target.closest('button');
  const originalLabel = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = 'Authenticating…';

  setTimeout(() => {
    const targetPage = ROLE_PAGES[role] || ROLE_PAGES.student;
    // A toast can't really be shown "before" navigating away, so we
    // stash the message in sessionStorage and the next page displays
    // it once it loads (see initToastFromRedirect below).
    sessionStorage.setItem(
      'ba_flash_message',
      'Signed in as ' + role.charAt(0).toUpperCase() + role.slice(1)
    );
    window.location.href = targetPage;
  }, 900);
}

function togglePw() {
  const inp = document.getElementById('pw-input');
  const btn = event.target;
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.textContent = 'HIDE';
  } else {
    inp.type = 'password';
    btn.textContent = 'SHOW';
  }
}

function doLogout() {
  sessionStorage.setItem('ba_flash_message', 'Signed out successfully.');
  window.location.href = 'index.html';
}

// Shows a one-time toast that was queued by the previous page
// (e.g. "Signed in as Student" after doLogin() redirects).
function initToastFromRedirect() {
  const msg = sessionStorage.getItem('ba_flash_message');
  if (msg) {
    sessionStorage.removeItem('ba_flash_message');
    showToast(msg, false);
  }
}

// ===================== 3. STUDENT: BIOMETRIC ATTENDANCE =====================
let attendanceMarked = false;

function markAttendance() {
  if (attendanceMarked) return;
  const overlay = document.getElementById('scan-overlay');
  if (!overlay) return; // only present on student.html

  overlay.classList.add('visible');
  document.getElementById('scan-in-progress').style.display = 'block';
  document.getElementById('scan-success').style.display = 'none';

  setTimeout(() => {
    document.getElementById('scan-in-progress').style.display = 'none';
    document.getElementById('scan-success').style.display = 'block';
    setTimeout(() => {
      overlay.classList.remove('visible');
      showAttendanceSuccess();
    }, 1200);
  }, 2200);
}

function showAttendanceSuccess() {
  attendanceMarked = true;
  document.getElementById('bio-action').style.display = 'none';
  const sc = document.getElementById('bio-success-card');
  sc.classList.add('visible');
  const now = new Date();
  document.getElementById('success-ts').textContent =
    'Logged at ' +
    now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    ' · ' +
    now.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  showToast('Attendance marked for CS 403 — Algorithm Design', false);
}

// ===================== 4. LIVE CLOCK & SESSION COUNTDOWN =====================
function tickClock() {
  const el = document.getElementById('live-time');
  if (el) el.textContent = new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(tickClock, 1000);

let countdownSeconds = 527; // ~8:47, matches the static markup on load
function tickCountdown() {
  if (countdownSeconds <= 0) return;
  countdownSeconds--;
  const m = Math.floor(countdownSeconds / 60).toString().padStart(2, '0');
  const s = (countdownSeconds % 60).toString().padStart(2, '0');
  const val = m + ':' + s;
  ['session-countdown', 'lec-timer', 'lec-timer-2'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}
setInterval(tickCountdown, 1000);

// ===================== 5. LECTURER: LIVE ATTENDANCE ROLL =====================
const TOTAL_ENROLLED = 47; // CS 403 cohort size, matches static markup

const mockStudents = [
  { init: 'GN', name: 'Grace Ndungu', id: 'CS/4401/2023', color: '#01579B', text: '#81D4FA' },
  { init: 'HO', name: 'Hassan Oduya', id: 'CS/4412/2023', color: '#4A148C', text: '#CE93D8' },
  { init: 'IK', name: 'Irene Kamau', id: 'CS/4423/2023', color: '#004D40', text: '#80CBC4' },
  { init: 'JM', name: 'James Mutua', id: 'CS/4434/2023', color: '#37474F', text: '#B0BEC5' },
  { init: 'KA', name: 'Kefilwe Addo', id: 'CS/4445/2023', color: '#1A237E', text: '#9FA8DA' },
  { init: 'LT', name: 'Laila Tahir', id: 'CS/4456/2023', color: '#880E4F', text: '#F48FB1' },
  { init: 'MO', name: 'Musa Osei', id: 'CS/4467/2023', color: '#1B5E20', text: '#A5D6A7' },
  { init: 'NO', name: 'Nomsa Obi', id: 'CS/4478/2023', color: '#3E2723', text: '#BCAAA4' },
  { init: 'OW', name: 'Obinna Waweru', id: 'CS/4489/2023', color: '#5D4037', text: '#D7CCC8' },
  { init: 'PD', name: 'Priya Dlamini', id: 'CS/4490/2023', color: '#006064', text: '#80DEEA' },
];
let rollIdx = 0;
let presentCount = 6; // matches the 6 students already listed in the static markup

function addRollEntry() {
  const roll = document.getElementById('student-roll');
  if (!roll) return; // only present on lecturer.html

  if (rollIdx >= mockStudents.length) {
    showToast('All available students have been added.', true);
    return;
  }
  const s = mockStudents[rollIdx++];
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

  const div = document.createElement('div');
  div.className = 'roll-item';
  div.innerHTML = `
    <div class="roll-avatar" style="background:${s.color};color:${s.text};">${s.init}</div>
    <div><div class="roll-name">${s.name}</div><div class="roll-id">${s.id}</div></div>
    <span class="roll-time">${timeStr}</span>
    <svg class="roll-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  `;
  roll.appendChild(div);
  roll.scrollTop = roll.scrollHeight;

  presentCount++;
  const pending = TOTAL_ENROLLED - presentCount;
  const pct = Math.round((presentCount / TOTAL_ENROLLED) * 100);

  setTextIfPresent('lec-present-count', presentCount);
  setTextIfPresent('lec-pending-count', Math.max(0, pending));
  setTextIfPresent('lec-pct', pct + '% response');
  setTextIfPresent('sc-present', presentCount);
  setTextIfPresent('sc-absent', Math.max(0, TOTAL_ENROLLED - presentCount));

  showToast(s.name + ' marked present', false);
}

function setTextIfPresent(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ===================== 6. ADMIN: EXPORT CSV =====================
function exportCSV() {
  const rows = [
    ['Course', 'Lecturer', 'Date', 'Time', 'Enrolled', 'Present', 'Rate', 'Status'],
    ['CS 403 — Algorithm Design', 'Dr. K. Mensah', '2026-06-16', '08:00–10:00', '47', '36', '77%', 'Complete'],
    ['CS 301 — Operating Systems', 'Dr. A. Njeri', '2026-06-16', '10:00–12:00', '52', '41', '79%', 'Live'],
    ['MATH 204 — Linear Algebra', 'Prof. B. Omondi', '2026-06-13', '14:00–16:00', '89', '55', '62%', 'Complete'],
    ['CS 302 — Database Systems', 'Dr. K. Mensah', '2026-06-11', '08:00–10:00', '47', '40', '85%', 'Complete'],
    ['ENG 201 — Engineering Maths', 'Prof. C. Waweru', '2026-06-11', '12:00–14:00', '121', '88', '73%', 'Complete'],
    ['BUS 310 — Strategic Management', 'Dr. L. Mutua', '2026-06-10', '09:00–11:00', '76', '30', '39%', 'Flagged'],
    ['CS 401 — AI & Machine Learning', 'Dr. S. Otieno', '2026-06-10', '14:00–16:00', '39', '35', '90%', 'Complete'],
    ['PHY 101 — Physics for Engineers', 'Prof. M. Kariuki', '2026-06-09', '08:00–10:00', '143', '110', '77%', 'Complete'],
  ];
  const csv = rows.map((r) => r.map((c) => '"' + c + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'attendance-report-2026-06-16.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Report exported: attendance-report-2026-06-16.csv', false);
}

// ===================== 6b. ADMIN: TABLE PAGINATION & FILTERS =====================
let adminPage = 1;
const ADMIN_TOTAL_PAGES = 3;

function adminGoToPage(target) {
  if (target === 'prev') adminPage = Math.max(1, adminPage - 1);
  else if (target === 'next') adminPage = Math.min(ADMIN_TOTAL_PAGES, adminPage + 1);
  else adminPage = target;

  document.querySelectorAll('.pager-page').forEach((el) => {
    el.classList.toggle('active', Number(el.dataset.page) === adminPage);
  });
  const prevBtn = document.getElementById('pager-prev');
  const nextBtn = document.getElementById('pager-next');
  if (prevBtn) prevBtn.disabled = adminPage === 1;
  if (nextBtn) nextBtn.disabled = adminPage === ADMIN_TOTAL_PAGES;

  showToast('Showing page ' + adminPage + ' of ' + ADMIN_TOTAL_PAGES, false);
}

function applyAdminFilters() {
  showToast('Filters applied to attendance records', false);
}

// ===================== 7. TOAST NOTIFICATIONS =====================
function showToast(msg, isError) {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;
  const t = document.createElement('div');
  t.className = 'toast' + (isError ? ' error' : '');
  t.innerHTML = (isError ? '⚠️ ' : '✓ ') + msg;
  stack.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity 0.4s';
    setTimeout(() => t.remove(), 400);
  }, 3200);
}

// ===================== 8. AVATAR DROPDOWN =====================
// Shared by student.html, lecturer.html, admin.html, profile.html.
// Markup contract: a clickable element with [data-avatar-trigger], a
// sibling `.avatar-menu` with a matching id, and an item marked
// [data-action="signout"] inside it.
function toggleAvatarMenu(id) {
  const menu = document.getElementById(id);
  if (!menu) return;
  const wasOpen = menu.classList.contains('open');
  document.querySelectorAll('.avatar-menu.open').forEach((m) => m.classList.remove('open'));
  if (!wasOpen) menu.classList.add('open');
}

document.addEventListener('click', (e) => {
  // Close any open avatar menu when clicking outside of it.
  if (!e.target.closest('.avatar-wrap')) {
    document.querySelectorAll('.avatar-menu.open').forEach((m) => m.classList.remove('open'));
  }
});

// ===================== 9. SIGNUP =====================
let signupRole = 'student';

function pickSignupRole(role, el) {
  signupRole = role;
  document.querySelectorAll('.role-pick').forEach((r) => r.classList.remove('selected'));
  el.classList.add('selected');
}

function toggleSignupPw(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.textContent = 'HIDE';
  } else {
    inp.type = 'password';
    btn.textContent = 'SHOW';
  }
}

function checkPasswordStrength() {
  const pw = document.getElementById('su-password').value;
  const bars = document.querySelectorAll('.strength-bar');
  bars.forEach((b) => (b.className = 'strength-bar'));
  if (!pw) return;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 10) score++;
  const cls = score <= 1 ? 'on-weak' : score === 2 ? 'on-ok' : 'on-strong';
  const litCount = score <= 1 ? 1 : score === 2 ? 2 : 3;
  for (let i = 0; i < litCount; i++) bars[i].classList.add(cls);
}

function doSignup() {
  const btn = event.target.closest('button');
  const name = document.getElementById('su-name');
  const email = document.getElementById('su-email');
  const pw = document.getElementById('su-password');
  const confirm = document.getElementById('su-confirm');
  const err = document.getElementById('su-error');

  [name, email, pw, confirm].forEach((f) => f.classList.remove('invalid'));
  err.classList.remove('visible');

  let problem = '';
  if (!name.value.trim()) problem = 'Enter your full name.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) problem = 'Enter a valid email address.';
  else if (pw.value.length < 8) problem = 'Password must be at least 8 characters.';
  else if (pw.value !== confirm.value) problem = 'Passwords do not match.';

  if (problem) {
    err.textContent = problem;
    err.classList.add('visible');
    if (!name.value.trim()) name.classList.add('invalid');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) email.classList.add('invalid');
    if (pw.value.length < 8) pw.classList.add('invalid');
    if (pw.value !== confirm.value) confirm.classList.add('invalid');
    return;
  }

  const originalLabel = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = 'Creating account…';

  setTimeout(() => {
    sessionStorage.setItem('ba_name', name.value.trim());
    sessionStorage.setItem('ba_email', email.value.trim());
    sessionStorage.setItem('ba_role', signupRole);
    sessionStorage.setItem(
      'ba_flash_message',
      'Account created for ' + name.value.trim() + '. You can now register a biometric credential and sign in.'
    );
    window.location.href = 'index.html';
  }, 900);
}

// ===================== 10. PROFILE PAGE =====================
function saveProfileField(labelText) {
  showToast(labelText + ' updated', false);
}

function confirmRevokeDevice(el) {
  const row = el.closest('.list-card');
  if (!row) return;
  if (row.dataset.confirming === '1') {
    row.remove();
    showToast('Device credential revoked', false);
    return;
  }
  row.dataset.confirming = '1';
  el.textContent = 'Confirm revoke';
  el.classList.remove('btn-ghost');
  el.classList.add('btn-primary');
  setTimeout(() => {
    if (row.dataset.confirming === '1') {
      row.dataset.confirming = '0';
      el.textContent = 'Revoke';
      el.classList.remove('btn-primary');
      el.classList.add('btn-ghost');
    }
  }, 3000);
}

// ===================== 10b. LECTURER: SESSION CONTROL =====================
function launchSession() {
  const course = document.getElementById('new-session-course');
  const courseLabel = course ? course.options[course.selectedIndex].text : 'the selected course';
  showToast('Session launched for ' + courseLabel, false);
  const card = document.getElementById('active-session-card');
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function endSession() {
  const btn = event.target.closest('button');
  if (btn.dataset.confirming !== '1') {
    btn.dataset.confirming = '1';
    const original = btn.textContent;
    btn.dataset.original = original;
    btn.textContent = 'Confirm End?';
    setTimeout(() => {
      if (btn.dataset.confirming === '1') {
        btn.dataset.confirming = '0';
        btn.textContent = btn.dataset.original;
      }
    }, 3000);
    return;
  }
  btn.dataset.confirming = '0';
  btn.textContent = 'Session Ended';
  btn.disabled = true;
  const card = document.getElementById('active-session-card');
  if (card) {
    card.style.opacity = '0.5';
    card.style.pointerEvents = 'none';
  }
  showToast('Session ended. Final roll saved to reports.', false);
}

// ===================== 11. GENERIC SETTINGS TOGGLE =====================
function onSettingsToggle(el, label) {
  showToast(label + (el.checked ? ' enabled' : ' disabled'), false);
}

// ===================== 12. PROFILE PAGE INIT =====================
// profile.html is shared by all three roles. It reads who "signed in"
// from sessionStorage (set by doLogin/doSignup) and falls back to the
// Student demo persona used elsewhere on the site so the page never
// looks broken when opened directly.
const ROLE_PERSONAS = {
  student: {
    initials: 'AO', name: 'Amara Osei', roleLabel: 'Student',
    meta: 'CS/4321/2023 · BSc. Computer Science, Year 3',
    email: 'amara.osei@ku.ac.ke', phone: '+254 712 345 678',
    dashboardHref: 'student.html', dashboardLabel: 'Dashboard',
  },
  lecturer: {
    initials: 'KM', name: 'Dr. Kwame Mensah', roleLabel: 'Lecturer',
    meta: 'Department of Computer Science · Staff No. KU-2291',
    email: 'k.mensah@ku.ac.ke', phone: '+254 722 981 340',
    dashboardHref: 'lecturer.html', dashboardLabel: 'Sessions',
  },
  admin: {
    initials: 'AD', name: 'System Administrator', roleLabel: 'Administrator',
    meta: 'Kenyatta University · IT Systems Office',
    email: 'admin@ku.ac.ke', phone: '+254 700 112 233',
    dashboardHref: 'admin.html', dashboardLabel: 'Overview',
  },
};

function initProfilePage() {
  const root = document.getElementById('page-profile');
  if (!root) return; // only present on profile.html

  const role = sessionStorage.getItem('ba_role') || 'student';
  const persona = ROLE_PERSONAS[role] || ROLE_PERSONAS.student;
  const name = sessionStorage.getItem('ba_name') || persona.name;
  const email = sessionStorage.getItem('ba_email') || persona.email;

  setTextIfPresent('profile-initials', persona.initials);
  setTextIfPresent('profile-name', name);
  setTextIfPresent('profile-role', persona.roleLabel);
  setTextIfPresent('profile-meta', persona.meta);
  setTextIfPresent('profile-back-label', persona.dashboardLabel);

  const backLink = document.getElementById('profile-back-link');
  if (backLink) backLink.href = persona.dashboardHref;

  const nameInput = document.getElementById('profile-input-name');
  if (nameInput) nameInput.value = name;
  const emailInput = document.getElementById('profile-input-email');
  if (emailInput) emailInput.value = email;
  const phoneInput = document.getElementById('profile-input-phone');
  if (phoneInput) phoneInput.value = persona.phone;
}

// ===================== 13. INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  initToastFromRedirect();
  initProfilePage();
});


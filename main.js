/* ============================================
   Career Launchpad, Shared JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initToastSystem();
  initAuthPage();
  initProfileBuilder();
  initResourcesPage();
  initFeedbackBoard();
  initMentorshipPage();
  initContactPage();
  initProfileView();
});

/* ============================================
   NAVIGATION
   ============================================ */
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });

  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ============================================
   TOAST NOTIFICATION SYSTEM
   ============================================ */
let toastContainer;

function initToastSystem() {
  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  toastContainer.setAttribute('role', 'status');
  toastContainer.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastContainer);
}

function showToast(message, type = 'success', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close" aria-label="Dismiss notification">&times;</button>
  `;
  toastContainer.appendChild(toast);

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));

  setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
  if (!toast.parentNode) return;
  toast.classList.add('removing');
  setTimeout(() => toast.remove(), 300);
}

/* ============================================
   AUTH PAGE (Sign Up / Log In)
   ============================================ */
function initAuthPage() {
  const authTabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  if (!authTabs.length) return;

  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      authTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      if (target === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
      } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
      }
    });
  });

  setupFormValidation(loginForm, ['login-email', 'login-password']);
  setupFormValidation(signupForm, ['signup-name', 'signup-email', 'signup-password', 'signup-student-number']);

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'profile-builder.html';
    });
  }
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'profile-builder.html';
    });
  }
}

function setupFormValidation(form, fieldIds) {
  if (!form) return;
  const submitBtn = form.querySelector('button[type="submit"]');

  fieldIds.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener('input', () => {
      validateField(input);
      updateSubmitState(form, fieldIds, submitBtn);
    });

    input.addEventListener('blur', () => {
      validateField(input);
      updateSubmitState(form, fieldIds, submitBtn);
    });
  });

  updateSubmitState(form, fieldIds, submitBtn);
}

/*
 * validateField — emotionally supportive error messages
 * Following Norman (2013): good error design reduces
 * negative affect and keeps users motivated to recover.
 */
function validateField(input) {
  const value = input.value.trim();
  const type = input.type;
  const id = input.id;
  let valid = true;
  let message = '';

  if (!value) {
    valid = false;
    const labelText = input.labels?.[0]?.textContent?.replace('*','').trim()
                   || input.previousElementSibling?.textContent?.replace('*','').trim()
                   || 'This field';
    message = `${labelText} is required — fill this in to continue.`;
  } else if (type === 'email' || id.includes('email')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      valid = false;
      message = 'Double-check that — emails should look like: keith@email.com';
    }
  } else if (type === 'password' || id.includes('password')) {
    if (value.length < 8) {
      valid = false;
      message = 'Almost there! Your password needs at least 8 characters.';
    }
  } else if (id.includes('student-number') || id.includes('student-num')) {
    if (!/^ST\d{8}$/i.test(value)) {
      valid = false;
      message = 'No worries — student numbers follow this format: ST10447272 (ST + 8 digits).';
    }
  }

  const wrapper = input.closest('.form-group');
  const existingError = wrapper.querySelector('.field-error');
  const existingSuccess = wrapper.querySelector('.field-success');
  if (existingError) existingError.remove();
  if (existingSuccess) existingSuccess.remove();

  input.classList.remove('valid', 'invalid');

  if (value === '') return false;

  if (valid) {
    input.classList.add('valid');
    const successEl = document.createElement('div');
    successEl.className = 'field-success';
    successEl.textContent = 'Looks good!';
    wrapper.appendChild(successEl);
  } else {
    input.classList.add('invalid');
    const errorEl = document.createElement('div');
    errorEl.className = 'field-error';
    errorEl.setAttribute('role', 'alert');
    errorEl.textContent = message;
    wrapper.appendChild(errorEl);
  }
  return valid;
}

function updateSubmitState(form, fieldIds, submitBtn) {
  if (!submitBtn) return;
  const allValid = fieldIds.every(id => {
    const input = document.getElementById(id);
    if (!input) return false;
    if (input.closest('form')?.style.display === 'none') return true;
    return input.value.trim() !== '' && !input.classList.contains('invalid');
  });
  submitBtn.disabled = !allValid;
}

/* ============================================
   PROFILE BUILDER, Multi-step Wizard
   ============================================ */
let currentStep = 1;
const totalSteps = 5;
let autoSaveTimer = null;

function initProfileBuilder() {
  const wizard = document.getElementById('profile-wizard');
  if (!wizard) return;

  showStep(1);
  updateProgress();
  initSkillsManager();
  initPortfolioStep();
  initSectionReorder();
  initCharacterCounter();
  initAutoSave();

  wizard.addEventListener('input', () => {
    triggerAutoSave();
    updateProgress();
    updateNextButton();
  });
}

function showStep(step) {
  document.querySelectorAll('.step-content').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`step-${step}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.wizard-step').forEach((s, i) => {
    s.classList.remove('active', 'completed');
    if (i + 1 < step) s.classList.add('completed');
    if (i + 1 === step) s.classList.add('active');
  });

  currentStep = step;
  updateNextButton();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep() {
  if (currentStep < totalSteps) showStep(currentStep + 1);
}

function prevStep() {
  if (currentStep > 1) showStep(currentStep - 1);
}

function updateNextButton() {
  const nextBtn = document.querySelector(`#step-${currentStep} .btn-next`);
  if (!nextBtn) return;

  const step = document.getElementById(`step-${currentStep}`);
  const required = step.querySelectorAll('[required]');
  const allFilled = Array.from(required).every(f => f.value.trim() !== '');
  nextBtn.disabled = !allFilled;
}

function updateProgress() {
  const wizard = document.getElementById('profile-wizard');
  if (!wizard) return;

  const allRequired = wizard.querySelectorAll('[data-progress]');
  let filled = 0;
  let total = allRequired.length || 1;

  allRequired.forEach(f => {
    if (f.value && f.value.trim() !== '') filled++;
  });

  const skillTags = document.querySelectorAll('#skills-container .tag');
  if (skillTags.length > 0) filled++;
  total++;

  const pct = Math.round((filled / total) * 100);
  const bar = document.getElementById('progress-fill');
  const text = document.getElementById('progress-pct');
  const msg = document.getElementById('progress-msg');
  const progressSection = document.querySelector('.progress-section');

  if (bar) bar.style.width = pct + '%';
  if (text) text.textContent = pct + '%';

  // Update ARIA value for screen readers
  if (progressSection) progressSection.setAttribute('aria-valuenow', pct);

  if (msg) {
    if (pct === 0)       msg.textContent = 'Just getting started, keep going!';
    else if (pct < 30)   msg.textContent = 'Good start! Keep filling in your details.';
    else if (pct < 60)   msg.textContent = 'Great progress! Add more details to stand out.';
    else if (pct < 90)   msg.textContent = 'Almost there — add a personal statement to impress recruiters!';
    else if (pct < 100)  msg.textContent = 'So close! Just a few more details.';
    else                 msg.textContent = 'Your profile is looking fantastic! Ready to generate your link. 🎉';
  }
}

/* Auto-save simulation */
function initAutoSave() {
  const indicator = document.getElementById('autosave');
  if (!indicator) return;
}

function triggerAutoSave() {
  const indicator = document.getElementById('autosave');
  if (!indicator) return;

  clearTimeout(autoSaveTimer);
  indicator.className = 'autosave-indicator saving';
  indicator.innerHTML = '<span class="autosave-dot"></span> Saving...';

  autoSaveTimer = setTimeout(() => {
    indicator.className = 'autosave-indicator saved';
    indicator.innerHTML = '<span class="autosave-dot"></span> All changes saved ✓';
  }, 2000);
}

/* Skills Manager */
function initSkillsManager() {
  const addTech = document.getElementById('add-tech-skill');
  const addSoft = document.getElementById('add-soft-skill');
  if (addTech) addTech.addEventListener('click', () => addSkill('tech'));
  if (addSoft) addSoft.addEventListener('click', () => addSkill('soft'));
}

function addSkill(type) {
  const input = document.getElementById(`${type}-skill-input`);
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  const container = document.getElementById('skills-container');
  const tag = document.createElement('span');
  tag.className = `tag ${type === 'tech' ? '' : 'green'} removable`;
  tag.innerHTML = `${val} <button class="remove-tag" aria-label="Remove ${val}" onclick="this.parentElement.remove(); updateProgress();">&times;</button>`;
  container.appendChild(tag);
  input.value = '';
  updateProgress();
  triggerAutoSave();
}

/* Portfolio step */
function initPortfolioStep() {
  const zone = document.getElementById('cv-upload-zone');
  const fileInput = document.getElementById('cv-file-input');
  if (!zone) return;

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('dragover');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleCVUpload(files[0]);
  });

  zone.addEventListener('click', () => fileInput?.click());
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput?.click();
    }
  });

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) handleCVUpload(fileInput.files[0]);
    });
  }

  const addLinkBtn = document.getElementById('add-project-link');
  if (addLinkBtn) addLinkBtn.addEventListener('click', addProjectLink);
}

function handleCVUpload(file) {
  const result = document.getElementById('upload-result');
  if (!result) return;
  result.innerHTML = `
    <div class="upload-success">
      <span aria-hidden="true">✓</span>
      <span>${file.name} uploaded successfully</span>
    </div>`;
  updateProgress();
  triggerAutoSave();
}

function addProjectLink() {
  const input = document.getElementById('project-link-input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  const list = document.getElementById('project-links-list');
  const item = document.createElement('div');
  item.className = 'project-link-item';
  item.innerHTML = `
    <span aria-hidden="true">🔗</span>
    <span>${val}</span>
    <button class="remove-link" aria-label="Remove link" onclick="this.parentElement.remove();">&times;</button>`;
  list.appendChild(item);
  input.value = '';
  triggerAutoSave();
}

/* Section Reorder (drag) */
function initSectionReorder() {
  const list = document.getElementById('reorder-list');
  if (!list) return;

  let dragItem = null;

  list.querySelectorAll('.reorder-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      dragItem = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      dragItem = null;
      triggerAutoSave();
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = item.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        list.insertBefore(dragItem, item);
      } else {
        list.insertBefore(dragItem, item.nextSibling);
      }
    });
  });
}

/* Character Counter */
function initCharacterCounter() {
  const textarea = document.getElementById('personal-statement');
  const counter = document.getElementById('char-counter');
  if (!textarea || !counter) return;

  const maxLen = 500;

  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    counter.textContent = `${len} / ${maxLen} characters`;
    counter.className = 'char-counter';
    if (len > maxLen * 0.9) counter.classList.add('warning');
    if (len >= maxLen) counter.classList.add('limit');
    if (len > maxLen) {
      textarea.value = textarea.value.substring(0, maxLen);
      counter.textContent = `${maxLen} / ${maxLen} characters`;
    }
  });
}

/* ============================================
   GENERATE PROFILE — Celebration
   Emotional Design: Norman (2013) reflective level.
   The celebration overlay is the emotional payoff
   of completing the full five-step workflow.
   Fogg (2003): goal-gradient effect — reward must
   arrive immediately at goal completion.
   ============================================ */
function generateProfile() {
  const overlay = document.getElementById('celebrate-overlay');
  if (!overlay) {
    // Fallback: go directly to profile view
    window.location.href = 'profile-view.html';
    return;
  }

  // Show the overlay
  overlay.style.display = 'flex';

  // Move focus into the overlay for accessibility
  const title = document.getElementById('celebrate-title');
  if (title) {
    title.setAttribute('tabindex', '-1');
    title.focus();
  }

  // Fire confetti
  launchConfetti();
}

/*
 * launchConfetti — DOM-based confetti animation
 * Creates 90 small coloured pieces that fall from the top.
 * Uses Career Launchpad's brand colours for consistency.
 */
function launchConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;

  container.innerHTML = ''; // Clear any previous run

  const colors = [
    '#1a4b8c', // primary navy
    '#0f7a4e', // secondary green
    '#f59e0b', // accent gold
    '#60a5fa', // light blue
    '#34d399', // light green
    '#fbbf24', // light gold
    '#a78bfa', // purple accent
    '#f87171', // coral
  ];

  const pieceCount = 90;

  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';

    const size = 6 + Math.random() * 9;         // 6–15px
    const isCircle = Math.random() > 0.45;       // ~55% circles, rest squares
    const duration = 1.8 + Math.random() * 2.4;  // 1.8–4.2s fall time
    const delay = Math.random() * 1.0;           // stagger up to 1s
    const leftPos = Math.random() * 100;         // spread across full width
    const color = colors[Math.floor(Math.random() * colors.length)];

    piece.style.cssText = `
      left: ${leftPos}%;
      background: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: ${isCircle ? '50%' : '2px'};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      transform: rotate(${Math.random() * 360}deg);
      opacity: 0.9;
    `;

    container.appendChild(piece);
  }

  // Auto-clean after all pieces have fallen
  setTimeout(() => {
    if (container) container.innerHTML = '';
  }, 5500);
}

/* ============================================
   RESOURCES PAGE
   ============================================ */
function initResourcesPage() {
  const tabs = document.querySelectorAll('.resource-tabs .tab-btn');
  const cards = document.querySelectorAll('.resource-card');
  const searchInput = document.getElementById('resource-search');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterResources(tab.dataset.filter, searchInput?.value || '');
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const activeTab = document.querySelector('.resource-tabs .tab-btn.active');
      filterResources(activeTab?.dataset.filter || 'all', searchInput.value);
    });
  }
}

function filterResources(category, search) {
  const cards = document.querySelectorAll('.resource-card');
  const term = search.toLowerCase();

  cards.forEach(card => {
    const cat = card.dataset.category;
    const text = card.textContent.toLowerCase();
    const matchCat = category === 'all' || cat === category;
    const matchSearch = !term || text.includes(term);
    card.style.display = (matchCat && matchSearch) ? '' : 'none';
  });
}

/* ============================================
   FEEDBACK BOARD
   ============================================ */
function initFeedbackBoard() {
  const zone = document.getElementById('feedback-upload-zone');
  const fileInput = document.getElementById('feedback-cv-input');
  if (!zone) return;

  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      const result = document.getElementById('feedback-upload-result');
      if (result) {
        result.innerHTML = `<div class="upload-success"><span aria-hidden="true">✓</span><span>${e.dataTransfer.files[0].name} uploaded for peer review</span></div>`;
      }
    }
  });

  zone.addEventListener('click', () => fileInput?.click());
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        const result = document.getElementById('feedback-upload-result');
        if (result) {
          result.innerHTML = `<div class="upload-success"><span aria-hidden="true">✓</span><span>${fileInput.files[0].name} uploaded for peer review</span></div>`;
        }
      }
    });
  }

  document.querySelectorAll('.give-feedback-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      const modal = document.getElementById('feedback-modal');
      const title = document.getElementById('feedback-modal-name');
      if (modal && title) {
        title.textContent = `Give feedback on ${name}'s CV`;
        openModal(modal);
      }
    });
  });

  const submitFeedback = document.getElementById('submit-feedback');
  if (submitFeedback) {
    submitFeedback.addEventListener('click', () => {
      const modal = document.getElementById('feedback-modal');
      closeModal(modal);
      showToast('Feedback submitted! The student will be notified.', 'success');
    });
  }

  document.querySelectorAll('.slider-input').forEach(slider => {
    const display = document.getElementById(slider.dataset.display);
    if (display) {
      slider.addEventListener('input', () => {
        display.textContent = slider.value;
      });
    }
  });
}

/* ============================================
   MENTORSHIP PAGE
   ============================================ */
function initMentorshipPage() {
  document.querySelectorAll('.ask-question-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.mentor;
      const modal = document.getElementById('mentor-modal');
      const title = document.getElementById('mentor-modal-name');
      if (modal && title) {
        title.textContent = `Your question for ${name}`;
        openModal(modal);
      }
    });
  });

  const sendQuestion = document.getElementById('send-question');
  if (sendQuestion) {
    sendQuestion.addEventListener('click', () => {
      const textarea = document.getElementById('mentor-question');
      if (textarea && textarea.value.trim()) {
        const modal = document.getElementById('mentor-modal');
        closeModal(modal);
        showToast('Question sent! You will be notified when the mentor replies.', 'success');
        textarea.value = '';
      }
    });
  }
}

/* ============================================
   CONTACT PAGE
   ============================================ */
function initContactPage() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const fields = ['contact-name', 'contact-email', 'contact-subject', 'contact-message'];
  setupFormValidation(form, fields);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.style.display = 'none';
    const success = document.getElementById('contact-success');
    if (success) success.style.display = 'block';
  });
}

/* ============================================
   PROFILE VIEW
   ============================================ */
function initProfileView() {
  const copyBtn = document.getElementById('copy-profile-link');
  if (!copyBtn) return;

  copyBtn.addEventListener('click', () => {
    const code = document.getElementById('profile-url');
    if (code) {
      navigator.clipboard.writeText(code.textContent).then(() => {
        showToast('Profile link copied to clipboard!', 'info');
      });
    }
  });
}

/* ============================================
   MODAL HELPERS
   ============================================ */
function openModal(modal) {
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  const close = modal.querySelector('.modal-close');
  if (close) close.focus();

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close celebration overlay if open
    const overlay = document.getElementById('celebrate-overlay');
    if (overlay && overlay.style.display !== 'none') {
      overlay.style.display = 'none';
      return;
    }
    document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m));
  }
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-close')) {
    const modal = e.target.closest('.modal-overlay');
    closeModal(modal);
  }
});

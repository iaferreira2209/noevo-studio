/* ========================================
   NOEVO STUDIO - Interactive Logic
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCalendar();
  initBooking();
  initScrollReveal();
  initSmoothScroll();
  generateQRCodes();
});

/* --- Navbar --- */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.nav-links');

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });

  // Close mobile menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });
}

/* --- Calendar --- */
const calendarState = {
  currentDate: new Date(),
  selectedDate: null,
  month: new Date().getMonth(),
  year: new Date().getFullYear()
};

function initCalendar() {
  renderCalendar();

  document.querySelector('.cal-prev').addEventListener('click', () => {
    calendarState.month--;
    if (calendarState.month < 0) {
      calendarState.month = 11;
      calendarState.year--;
    }
    renderCalendar();
  });

  document.querySelector('.cal-next').addEventListener('click', () => {
    calendarState.month++;
    if (calendarState.month > 11) {
      calendarState.month = 0;
      calendarState.year++;
    }
    renderCalendar();
  });
}

function renderCalendar() {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  document.getElementById('calendarMonth').textContent = 
    `${months[calendarState.month]} ${calendarState.year}`;

  const daysContainer = document.querySelector('.calendar-days');
  daysContainer.innerHTML = '';

  const firstDay = new Date(calendarState.year, calendarState.month, 1).getDay();
  const daysInMonth = new Date(calendarState.year, calendarState.month + 1, 0).getDate();
  const today = new Date();

  // Adjust for Sunday = 0 -> shift to Monday start
  const startDay = firstDay === 0 ? 6 : firstDay - 1;

  // Empty cells
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day empty';
    daysContainer.appendChild(empty);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.textContent = day;

    const currentDay = new Date(calendarState.year, calendarState.month, day);

    // Past dates
    if (currentDay < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      dayEl.classList.add('disabled');
    } else {
      // Sundays
      const dayOfWeek = currentDay.getDay();
      if (dayOfWeek === 0) {
        dayEl.classList.add('disabled');
      } else {
        dayEl.addEventListener('click', () => selectDay(dayEl, day));
      }
    }

    // Today
    if (
      day === today.getDate() &&
      calendarState.month === today.getMonth() &&
      calendarState.year === today.getFullYear()
    ) {
      dayEl.classList.add('today');
    }

    // Selected
    if (
      calendarState.selectedDate &&
      day === calendarState.selectedDate.getDate() &&
      calendarState.month === calendarState.selectedDate.getMonth() &&
      calendarState.year === calendarState.selectedDate.getFullYear()
    ) {
      dayEl.classList.add('selected');
    }

    daysContainer.appendChild(dayEl);
  }
}

function selectDay(el, day) {
  document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
  el.classList.add('selected');
  calendarState.selectedDate = new Date(calendarState.year, calendarState.month, day);
  updateBookingButton();
}

/* --- Booking Flow --- */
const bookingState = {
  step: 1,
  barber: '',
  date: null,
  time: '',
  service: '',
  servicePrice: ''
};

function initBooking() {
  // Service cards in services section (showcase) - agora funcionam como atalho
  // inteligente: pré-selecionam o serviço e já levam direto pro agendamento
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.service-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const serviceKey = card.dataset.service;
      const matchingSelectCard = document.querySelector(`.service-select-card[data-service="${serviceKey}"]`);
      if (matchingSelectCard) {
        document.querySelectorAll('.service-select-card').forEach(c => c.classList.remove('selected'));
        matchingSelectCard.classList.add('selected');
        bookingState.service = matchingSelectCard.dataset.service;
        bookingState.servicePrice = matchingSelectCard.dataset.price;
        updateBookingButton();
      }

      scrollToBookingPanel();
    });
  });

  // Booking service select cards
  document.querySelectorAll('.service-select-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.service-select-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      bookingState.service = card.dataset.service;
      bookingState.servicePrice = card.dataset.price;
      updateBookingButton();
    });
  });

  // Time slots
  document.querySelectorAll('.time-slot:not(.unavailable)').forEach(slot => {
    slot.addEventListener('click', () => {
      document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
      slot.classList.add('selected');
      bookingState.time = slot.textContent.trim();
      updateBookingButton();
    });
  });

  // Barber select
  const barberSelect = document.getElementById('barberSelect');
  barberSelect.addEventListener('change', () => {
    bookingState.barber = barberSelect.value;
    updateBookingButton();
  });

  // Step navigation
  document.getElementById('btnStep1Next').addEventListener('click', () => goToStep(2));
  document.getElementById('btnStep2Back').addEventListener('click', () => goToStep(1));
  document.getElementById('btnStep2Next').addEventListener('click', () => goToStep(3));
  document.getElementById('btnStep3Back').addEventListener('click', () => goToStep(2));
  // Removed old showConfirmation listener since we handle it at the end now
  document.getElementById('btnConfirm').addEventListener('click', () => {
    if (!isLoggedIn()) {
      openLoginModal();
    } else {
      finishBooking();
    }
  });
}

function goToStep(step) {
  bookingState.step = step;

  // Update step indicators
  document.querySelectorAll('.booking-step').forEach((s, i) => {
    s.classList.remove('active', 'completed');
    if (i + 1 === step) s.classList.add('active');
    if (i + 1 < step) s.classList.add('completed');
  });

  // Show/hide content
  document.querySelectorAll('.booking-step-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`step${step}`).classList.add('active');

  // Update header title
  const titles = ['', 'Escolha Data e Horário', 'Selecione o Serviço', 'Confirmar Agendamento'];
  document.getElementById('bookingStepTitle').textContent = titles[step];

  // Scroll booking into view on mobile
  const panel = document.querySelector('.booking-panel');
  if (window.innerWidth < 768) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (step === 3) {
    updateConfirmationSummary();
  }
}

function updateBookingButton() {
  const btn1 = document.getElementById('btnStep1Next');
  const btn2 = document.getElementById('btnStep2Next');

  // Step 1: need barber, date, time
  btn1.disabled = !(bookingState.barber || document.getElementById('barberSelect').value) 
    || !calendarState.selectedDate 
    || !bookingState.time;
  
  if (document.getElementById('barberSelect').value) {
    bookingState.barber = document.getElementById('barberSelect').value;
  }
  bookingState.date = calendarState.selectedDate;

  // Step 2: need service
  btn2.disabled = !bookingState.service;
}

function updateConfirmationSummary() {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  if (bookingState.date) {
    const d = bookingState.date;
    document.getElementById('summaryDate').textContent = 
      `${d.getDate()} de ${months[d.getMonth()]}, ${d.getFullYear()}`;
  }
  document.getElementById('summaryTime').textContent = bookingState.time || '-';
  document.getElementById('summaryBarber').textContent = bookingState.barber || '-';

  const serviceNames = {
    'corte': 'Corte',
    'barba': 'Barba',
    'combo': 'Corte + Barba'
  };
  document.getElementById('summaryService').textContent = serviceNames[bookingState.service] || '-';
  document.getElementById('summaryPrice').textContent = bookingState.servicePrice || '-';
}

function showConfirmation() {
  const modal = document.getElementById('confirmationModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Update modal details
  document.getElementById('modalBarber').textContent = bookingState.barber;
  document.getElementById('modalDate').textContent = document.getElementById('summaryDate').textContent;
  document.getElementById('modalTime').textContent = bookingState.time;
  
  const serviceNames = {
    'corte': 'Corte',
    'barba': 'Barba',
    'combo': 'Corte + Barba'
  };
  document.getElementById('modalService').textContent = serviceNames[bookingState.service] || '-';
  document.getElementById('modalPrice').textContent = bookingState.servicePrice;
}

function closeModal() {
  const modal = document.getElementById('confirmationModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

/* --- Scroll Reveal --- */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

/* --- Smooth Scroll --- */
function scrollToBookingPanel() {
  scrollToElement(document.getElementById('bookingPanel'));
}

function scrollToElement(target) {
  if (!target) return;
  const navbar = document.querySelector('.navbar');
  const offset = (navbar ? navbar.offsetHeight : 80) + 16;
  const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href.length <= 1) return; // ignora href="#"
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        scrollToElement(target);
      }
    });
  });
}

/* --- QR Code Generation --- */
function generateQRCodes() {
  // Simple QR Code drawing using canvas
  const qrData = 'https://sites.appbarber.com.br/noevostudio';
  
  document.querySelectorAll('.qr-canvas').forEach(canvas => {
    drawQRPattern(canvas, qrData);
  });
}

function drawQRPattern(canvas, data) {
  const ctx = canvas.getContext('2d');
  const size = 200;
  canvas.width = size;
  canvas.height = size;

  // Generate a deterministic pattern based on data
  const moduleCount = 25;
  const moduleSize = size / moduleCount;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#000000';

  // Simple hash-based pattern generation
  const hash = simpleHash(data);
  
  // Draw finder patterns (corners)
  drawFinderPattern(ctx, 0, 0, moduleSize);
  drawFinderPattern(ctx, (moduleCount - 7) * moduleSize, 0, moduleSize);
  drawFinderPattern(ctx, 0, (moduleCount - 7) * moduleSize, moduleSize);

  // Draw alignment pattern
  const cx = 13 * moduleSize, cy = 13 * moduleSize;
  ctx.fillRect(cx, cy, 5 * moduleSize, 5 * moduleSize);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx + moduleSize, cy + moduleSize, 3 * moduleSize, 3 * moduleSize);
  ctx.fillStyle = '#000000';
  ctx.fillRect(cx + 2 * moduleSize, cy + 2 * moduleSize, moduleSize, moduleSize);

  // Draw timing patterns
  for (let i = 8; i < moduleCount - 8; i++) {
    if (i % 2 === 0) {
      ctx.fillRect(i * moduleSize, 6 * moduleSize, moduleSize, moduleSize);
      ctx.fillRect(6 * moduleSize, i * moduleSize, moduleSize, moduleSize);
    }
  }

  // Draw data modules
  let seed = hash;
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      // Skip finder patterns, timing, alignment
      if (isReserved(row, col, moduleCount)) continue;
      
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      if (seed % 3 !== 0) {
        ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
      }
    }
  }
}

function drawFinderPattern(ctx, x, y, ms) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(x, y, 7 * ms, 7 * ms);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + ms, y + ms, 5 * ms, 5 * ms);
  ctx.fillStyle = '#000000';
  ctx.fillRect(x + 2 * ms, y + 2 * ms, 3 * ms, 3 * ms);
}

function isReserved(row, col, mc) {
  // Finder patterns + separator
  if (row < 9 && col < 9) return true;
  if (row < 9 && col > mc - 9) return true;
  if (row > mc - 9 && col < 9) return true;
  // Timing
  if (row === 6 || col === 6) return true;
  // Alignment
  if (row >= 11 && row <= 17 && col >= 11 && col <= 17) return true;
  return false;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/* ========================================
   MODALS, AUTH AND BOOKING CONFIRMATION
   ======================================== */
const confirmationModal = document.getElementById('confirmationModal');
const loginModal = document.getElementById('loginModal');

function closeModal() {
  confirmationModal.classList.remove('active');
  document.body.style.overflow = '';
}

function closeLoginModal() {
  loginModal.classList.remove('active');
  document.body.style.overflow = '';
}

// --- Real auth session (Supabase) ---
let currentUser = null;

supabaseClient.auth.getSession().then(({ data }) => {
  currentUser = data.session ? data.session.user : null;
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
  currentUser = session ? session.user : null;
});

function isLoggedIn() {
  return currentUser !== null;
}

function openLoginModal() {
  loginModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function updateStepVisibility(step) {
  // Mock function missing if called from elsewhere
  goToStep(step);
}

async function finishBooking() {
  if (!currentUser) {
    openLoginModal();
    return;
  }

  const newBooking = {
    user_id: currentUser.id,
    barber: bookingState.barber,
    date: bookingState.date.toISOString(),
    time: bookingState.time,
    service: bookingState.service,
    price: bookingState.servicePrice,
    client: (currentUser.user_metadata && currentUser.user_metadata.phone) || currentUser.email || 'Cliente'
  };

  const { error } = await supabaseClient.from('agendamentos').insert(newBooking);

  if (error) {
    alert('Não foi possível confirmar o agendamento. Tente novamente em instantes.');
    console.error('Erro ao salvar agendamento:', error);
    return;
  }

  closeModal();

  setTimeout(() => {
    const d = bookingState.date;
    const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
    alert(`Agendamento confirmado para ${dateStr} às ${bookingState.time} com ${bookingState.barber}! Te esperamos lá.`);
    
    bookingState.barber = '';
    bookingState.date = null;
    bookingState.time = '';
    bookingState.service = '';
    bookingState.servicePrice = '';
    
    goToStep(1);
    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
    document.querySelectorAll('.service-select-card').forEach(card => card.classList.remove('selected'));
    document.getElementById('barberSelect').value = '';
    calendarState.selectedDate = null;
    renderCalendar();
  }, 300);
}

// Login Modal Tabs
const loginTabs = document.querySelectorAll('.login-tab');
const loginForms = document.querySelectorAll('.login-form');

if (loginTabs.length > 0) {
  loginTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      loginTabs.forEach(t => t.classList.remove('active'));
      loginForms.forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      const targetForm = tab.getAttribute('data-tab') === 'email' ? 'formEmail' : 'formPhone';
      document.getElementById(targetForm).classList.add('active');
    });
  });

  // Tenta logar; se a conta ainda não existir, cria na hora (cadastro automático)
  async function loginOrSignUp({ email, password, options }) {
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (!signInError) return { data: signInData, error: null };

    // Credenciais inválidas pode significar "conta não existe ainda" -> tenta criar
    if (signInError.message && signInError.message.toLowerCase().includes('invalid login credentials')) {
      return await supabaseClient.auth.signUp({ email, password, options });
    }

    return { data: null, error: signInError };
  }

  function setSubmitLoading(form, loading) {
    const btn = form.querySelector('button[type="submit"], .login-submit');
    if (!btn) return;
    btn.disabled = loading;
    btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
    btn.textContent = loading ? 'Entrando...' : btn.dataset.originalText;
  }

  // Handle Email Login/Cadastro
  document.getElementById('formEmail').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    setSubmitLoading(form, true);
    const { error } = await loginOrSignUp({ email, password });
    setSubmitLoading(form, false);

    if (error) {
      alert('Não foi possível entrar: ' + error.message);
      return;
    }

    closeLoginModal();
    finishBooking();
  });

  // Handle Phone Login/Cadastro (sem SMS - login direto por telefone + senha)
  // OBS: o Supabase exige um provedor de SMS pago (Twilio) pra usar o telefone
  // como identidade nativa. Como não configuramos Twilio, usamos o telefone
  // como identificador único por baixo dos panos, via um e-mail sintético
  // (o usuário nunca vê isso - a experiência dele é só telefone + senha).
  document.getElementById('formPhone').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const rawPhone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPhonePassword').value;

    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      alert('Por favor, insira um número válido.');
      return;
    }
    // Formato E.164 (assume Brasil se o DDI não foi informado) - guardado no perfil
    const phone = digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
    // E-mail sintético usado só internamente para autenticar via telefone
    const syntheticEmail = `${digits}@phone.noevostudio.local`;

    setSubmitLoading(form, true);
    const { error } = await loginOrSignUp({
      email: syntheticEmail,
      password,
      options: { data: { phone } }
    });
    setSubmitLoading(form, false);

    if (error) {
      alert('Não foi possível entrar: ' + error.message);
      return;
    }

    closeLoginModal();
    finishBooking();
  });
}

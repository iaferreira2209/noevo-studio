// E-mail da conta admin criada no Supabase (Authentication > Users).
// A senha real fica guardada no Supabase, não aqui no código.
const ADMIN_EMAIL = "admin@noevostudio.com";

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('adminLoginOverlay');
  const dashboard = document.getElementById('adminDashboard');
  const btnLogin = document.getElementById('btnAdminLogin');
  const passwordInput = document.getElementById('adminPassword');
  const btnLogout = document.getElementById('btnAdminLogout');
  const barberSelect = document.getElementById('adminBarberSelect');
  const dateFilterContainer = document.getElementById('adminDateFilter');

  let selectedDateFilter = new Date().toISOString().split('T')[0]; // Default to today

  // Generate Date Buttons (Hoje, Amanhã, + 5 days)
  function renderDateButtons() {
    dateFilterContainer.innerHTML = '';
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateString = d.toISOString().split('T')[0];
      
      let label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`;
      if (i === 0) label = 'Hoje';
      else if (i === 1) label = 'Amanhã';

      const btn = document.createElement('button');
      btn.className = `admin-date-btn ${selectedDateFilter === dateString ? 'active' : ''}`;
      btn.textContent = label;
      btn.addEventListener('click', () => {
        selectedDateFilter = dateString;
        renderDateButtons();
        renderBookings();
      });
      
      dateFilterContainer.appendChild(btn);
    }
  }

  // Check if already logged in as admin (sessão real do Supabase)
  supabaseClient.auth.getSession().then(({ data }) => {
    if (data.session) {
      showDashboard();
    }
  });

  async function attemptLogin() {
    btnLogin.disabled = true;
    btnLogin.textContent = 'Entrando...';

    const { error } = await supabaseClient.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: passwordInput.value
    });

    btnLogin.disabled = false;
    btnLogin.textContent = 'Entrar';

    if (error) {
      alert('Senha incorreta.');
      return;
    }
    showDashboard();
  }

  btnLogin.addEventListener('click', attemptLogin);

  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') attemptLogin();
  });

  btnLogout.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  });

  barberSelect.addEventListener('change', () => {
    renderBookings();
  });

  function showDashboard() {
    overlay.classList.remove('active');
    dashboard.style.display = 'block';
    renderDateButtons();
    renderBookings();
  }

  async function renderBookings() {
    const list = document.getElementById('adminBookingsList');
    list.innerHTML = `<p style="color: var(--text-secondary); text-align: center; margin-top: 40px;">Carregando...</p>`;

    // Filtro por dia: início e fim do dia selecionado, em ISO
    const dayStart = new Date(`${selectedDateFilter}T00:00:00`);
    const dayEnd = new Date(`${selectedDateFilter}T23:59:59.999`);

    let query = supabaseClient
      .from('agendamentos')
      .select('*')
      .gte('date', dayStart.toISOString())
      .lte('date', dayEnd.toISOString())
      .order('date', { ascending: true });

    const selectedBarber = barberSelect.value;
    if (selectedBarber !== 'Todos') {
      query = query.eq('barber', selectedBarber);
    }

    const { data: bookings, error } = await query;

    if (error) {
      list.innerHTML = `<p style="color: var(--text-secondary); text-align: center; margin-top: 40px;">Erro ao carregar agendamentos: ${error.message}</p>`;
      console.error('Erro ao buscar agendamentos:', error);
      return;
    }

    list.innerHTML = '';

    if (!bookings || bookings.length === 0) {
      list.innerHTML = `<p style="color: var(--text-secondary); text-align: center; margin-top: 40px;">Nenhum agendamento encontrado.</p>`;
      return;
    }

    bookings.forEach(booking => {
      const d = new Date(booking.date);
      const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      
      const card = document.createElement('div');
      card.className = 'admin-booking-card';
      card.innerHTML = `
        <div class="booking-time">
          <strong>${booking.time}</strong>
          <span>${dateStr}</span>
        </div>
        <div class="booking-details">
          <h4>${booking.client}</h4>
          <p>Serviço: <span class="badge">${booking.service.toUpperCase()}</span> | Barbeiro: <strong>${booking.barber}</strong></p>
        </div>
        <div class="booking-price">
          ${booking.price}
        </div>
      `;
      list.appendChild(card);
    });
  }
});

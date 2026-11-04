(() => {
  const WHATSAPP = '555436991164';

  // Ano no rodapé
  document.getElementById('ano').textContent = new Date().getFullYear();

  // Header ao rolar
  const header = document.querySelector('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Menu mobile
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const toggleMenu = (open) => {
    burger.setAttribute('aria-expanded', open);
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggleMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => toggleMenu(false)));

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Faixa de produtos: clones para a rotação não ter emenda
  const marquee = document.getElementById('marquee');
  const group = marquee.firstElementChild;
  for (let i = 0; i < 3; i++) marquee.appendChild(group.cloneNode(true));

  // Cards em sequência: um entra logo depois do outro
  document.querySelectorAll('.features, .offers, .reviews').forEach((list) => {
    [...list.children].forEach((el, i) => { el.style.transitionDelay = `${i * 0.13}s`; });
  });

  // Números da seção "Benvenuti" contando
  const countUp = (el) => {
    const to = Number(el.dataset.count);
    const from = Number(el.dataset.from || 0);
    const suffix = el.dataset.suffix || '';
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / 1400, 1);
      el.textContent = Math.round(from + (to - from) * (1 - (1 - t) ** 3)) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // Animações de entrada
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('is-visible');
      io.unobserve(el);
      if (!calm) el.querySelectorAll('[data-count]').forEach(countUp);
      // Depois de entrar, devolve as transições de hover do próprio elemento
      if (el.classList.contains('reveal')) {
        setTimeout(() => {
          el.classList.remove('reveal', 'reveal--left', 'reveal--right', 'reveal--delay');
          el.style.transitionDelay = '';
        }, 1800);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, [data-watch]').forEach((el) => io.observe(el));

  // Rolagem: barra de progresso, parallax e giro dos produtos
  const progress = document.getElementById('progress');
  const moving = calm ? [] : [...document.querySelectorAll('[data-parallax]')];
  let ticking = false;
  const onFrame = () => {
    ticking = false;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    progress.style.setProperty('--scroll', max > 0 ? window.scrollY / max : 0);
    moving.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const off = r.top + r.height / 2 - vh / 2;
      el.style.setProperty('--py', `${(off * Number(el.dataset.parallax)).toFixed(1)}px`);
      if (el.dataset.spin) el.style.setProperty('--rot', `${((off / vh) * Number(el.dataset.spin)).toFixed(2)}deg`);
    });
  };
  const requestFrame = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onFrame); }
  };
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame);
  onFrame();

  // Hero acompanha o mouse de leve
  if (!calm && window.matchMedia('(pointer: fine)').matches) {
    const hero = document.querySelector('.hero');
    const cup = hero.querySelector('.hero__cup');
    const cards = hero.querySelectorAll('.hero__rating, .hero__badge');
    hero.addEventListener('mousemove', (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      cup.style.setProperty('--cx', `${(x * -22).toFixed(1)}px`);
      cards.forEach((c, i) => {
        const depth = i ? 26 : -18;
        c.style.setProperty('--mx', `${(x * depth).toFixed(1)}px`);
        c.style.setProperty('--my', `${(y * depth).toFixed(1)}px`);
      });
    });
  }

  // Plaquinha do toldo: aberto ou fechado no horário de Gramado
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const part = (type) => Number(parts.find((p) => p.type === type).value);
  const minutes = part('hour') * 60 + part('minute');
  const isOpen = minutes >= 8 * 60 + 30 && minutes < 21 * 60;
  document.getElementById('sign').classList.add(isOpen ? 'is-open' : 'is-closed');
  document.getElementById('signLabel').textContent = isOpen ? 'Aberto agora' : 'Fechado agora';
  document.getElementById('signSub').textContent = isOpen ? 'até as 21h' : 'abrimos às 8h30';

  // ---------- Formulário de reserva ----------
  const form = document.getElementById('reservaForm');
  const errorBox = document.getElementById('formError');
  const dateInput = form.data;
  const timeSelect = form.horario;

  // Data mínima = hoje
  const toISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateInput.min = toISO(new Date());

  // Horários das 8h30 às 20h30 (casa fecha às 21h)
  const slots = [];
  for (let m = 8 * 60 + 30; m <= 20 * 60 + 30; m += 30) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  const fillSlots = () => {
    const isToday = dateInput.value === toISO(new Date());
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes() + 30;
    const current = timeSelect.value;
    timeSelect.innerHTML = '<option value="">Selecione</option>';
    slots.forEach((s) => {
      const [h, mi] = s.split(':').map(Number);
      if (isToday && h * 60 + mi < nowMin) return;
      const opt = new Option(s.replace(':', 'h'), s);
      if (s === current) opt.selected = true;
      timeSelect.add(opt);
    });
    if (timeSelect.options.length === 1) {
      timeSelect.options[0].text = 'Sem horários hoje, escolha outra data';
    }
  };
  fillSlots();
  dateInput.addEventListener('change', fillSlots);

  // Máscara de telefone
  form.telefone.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    e.target.value = v;
  });

  // Links "Reservar Café Colonial / à la carte" pré-selecionam a experiência
  document.querySelectorAll('[data-experience]').forEach((link) => {
    link.addEventListener('click', () => {
      const radio = form.querySelector(`input[name="experiencia"][value="${link.dataset.experience}"]`);
      if (radio) radio.checked = true;
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const required = [form.nome, dateInput, timeSelect, form.telefone];
    let firstInvalid = null;
    required.forEach((f) => {
      const bad = !f.value.trim() || (f === form.telefone && f.value.replace(/\D/g, '').length < 10);
      f.classList.toggle('is-invalid', bad);
      if (bad && !firstInvalid) firstInvalid = f;
    });

    if (firstInvalid) {
      errorBox.textContent = 'Por favor, preencha nome, data, horário e um telefone válido.';
      errorBox.hidden = false;
      firstInvalid.focus();
      return;
    }
    errorBox.hidden = true;

    const [y, mo, d] = dateInput.value.split('-');
    const lines = [
      'Olá! Gostaria de reservar uma mesa na *Sereníssima Panetteria* ✨',
      '',
      `*Nome:* ${form.nome.value.trim()}`,
      `*Data:* ${d}/${mo}/${y}`,
      `*Horário:* ${timeSelect.value.replace(':', 'h')}`,
      `*Pessoas:* ${form.pessoas.value}`,
      `*Experiência:* ${form.experiencia.value}`,
      `*Telefone:* ${form.telefone.value}`,
    ];
    if (form.obs.value.trim()) lines.push(`*Observações:* ${form.obs.value.trim()}`);

    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener');
  });

  form.querySelectorAll('input, select').forEach((f) =>
    f.addEventListener('input', () => f.classList.remove('is-invalid'))
  );
})();

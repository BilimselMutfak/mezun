// ========================================================
// HARİCİ KÜTÜPHANE BAĞIMSIZ DOĞRUDAN SUPABASE MOTORU
// ========================================================
const SUPABASE_URL = "https://yevbibgsmhxgbtutgbmv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_euV481YL-C4481-_dPGXOw_0HIrIiSH";

const supabaseHeaders = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

// ========================================================
// GLOBAL UYGULAMA DEĞİŞKENLERİ
// ========================================================
let localGraduatesData = [];

// DOM Elemanları
const graduatesContainer = document.getElementById('graduates');
const searchInput = document.getElementById('searchInput');
const departmentFilter = document.getElementById('departmentFilter');
const yearFilter = document.getElementById('yearFilter');
const cityFilter = document.getElementById('cityFilter');
const statusFilter = document.getElementById('statusFilter');
const resetBtn = document.getElementById('resetBtn');
const resultText = document.getElementById('resultText');
const emptyState = document.getElementById('emptyState');
const themeBtn = document.getElementById('themeBtn');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const modalContent = document.getElementById('modalContent');

// Admin DOM Elemanları
const adminLoginLink = document.getElementById('adminLoginLink');
const adminModal = document.getElementById('adminModal');
const closeAdminModal = document.getElementById('closeAdminModal');
const btnSaveToDatabase = document.getElementById('btnSaveToDatabase');

// ========================================================
// VERİTABANINDAN VERİ ÇEKME VE UYGULAMAYI BAŞLATMA
// ========================================================
async function fetchGraduatesFromDatabase() {
  try {
    resultText.textContent = "Veriler buluttan yükleniyor...";

    const response = await fetch(`${SUPABASE_URL}/rest/v1/mezunlar?select=*&order=id.asc`, {
      method: 'GET',
      headers: supabaseHeaders
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase Hatası (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    localGraduatesData = data || [];

    populateFilterOptions();
    calculateAndRenderStats();
    filterAndRenderGraduates();

  } catch (err) {
    console.error("Veritabanı bağlantı hatası:", err.message);
    resultText.textContent = "Veri yükleme hatası oluştu.";
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchGraduatesFromDatabase();

  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    themeBtn.textContent = '☼';
  }
});

// ========================================================
// İSTATİSTİK VE FİLTRE DOLDURMA MANTIĞI
// ========================================================
function calculateAndRenderStats() {
  const total = localGraduatesData.length;
  const working = localGraduatesData.filter(m => m.durum === "Çalışıyor" || m.durum === "Girişimci").length;

  const depts = new Set(localGraduatesData.map(m => m.bolum).filter(Boolean));
  const cities = new Set(localGraduatesData.map(m => m.sehir).filter(Boolean));

  document.getElementById('stats').innerHTML = `
    <div class="stat">
      <div class="number">${total}</div>
      <div class="label">Toplam Mezun</div>
    </div>
    <div class="stat">
      <div class="number">${working}</div>
      <div class="label">Çalışan Mezun</div>
    </div>
    <div class="stat">
      <div class="number">${depts.size}</div>
      <div class="label">Aktif Bölüm</div>
    </div>
    <div class="stat">
      <div class="number">${cities.size}</div>
      <div class="label">Farklı Şehir</div>
    </div>
  `;
}

function populateFilterOptions() {
  clearSelectOptions(departmentFilter);
  clearSelectOptions(yearFilter);
  clearSelectOptions(cityFilter);
  clearSelectOptions(statusFilter);

  const depts = [...new Set(localGraduatesData.map(m => m.bolum).filter(Boolean))].sort();
  const years = [...new Set(localGraduatesData.map(m => m.yil).filter(Boolean))].sort((a, b) => b - a);
  const cities = [...new Set(localGraduatesData.map(m => m.sehir).filter(Boolean))].sort();
  const statuses = [...new Set(localGraduatesData.map(m => m.durum).filter(Boolean))].sort();

  depts.forEach(d => departmentFilter.appendChild(new Option(d, d)));
  years.forEach(y => yearFilter.appendChild(new Option(y, y)));
  cities.forEach(c => cityFilter.appendChild(new Option(c, c)));
  statuses.forEach(s => statusFilter.appendChild(new Option(s, s)));
}

function clearSelectOptions(selectElement) {
  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }
}

function filterAndRenderGraduates() {
  const query = searchInput.value.toLowerCase().trim();
  const selectedDept = departmentFilter.value;
  const selectedYear = yearFilter.value;
  const selectedCity = cityFilter.value;
  const selectedStatus = statusFilter.value;

  const filtered = localGraduatesData.filter(m => {
    const matchesSearch = !query ||
      (m.ad && m.ad.toLowerCase().includes(query)) ||
      (m.bolum && m.bolum.toLowerCase().includes(query)) ||
      (m.kurum && m.kurum.toLowerCase().includes(query)) ||
      (m.sektor && m.sektor.toLowerCase().includes(query)) ||
      (m.unvan && m.unvan.toLowerCase().includes(query));

    const matchesDept = !selectedDept || m.bolum === selectedDept;
    const matchesYear = !selectedYear || String(m.yil) === selectedYear;
    const matchesCity = !selectedCity || m.sehir === selectedCity;
    const matchesStatus = !selectedStatus || m.durum === selectedStatus;

    return matchesSearch && matchesDept && matchesYear && matchesCity && matchesStatus;
  });

  renderGraduatesCards(filtered);

  if (filtered.length === localGraduatesData.length) {
    resultText.textContent = "Tüm mezunlar gösteriliyor.";
  } else {
    resultText.textContent = `${filtered.length} mezun bulundu.`;
  }
}

function renderGraduatesCards(list) {
  graduatesContainer.innerHTML = '';
  if (list.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  list.forEach(m => {
    const firstLetter = m.ad ? m.ad.charAt(0).toUpperCase() : '?';
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-top">
        <div class="avatar">${firstLetter}</div>
        <div class="status">${m.durum || '-'}</div>
      </div>
      <h3>${m.ad || 'İsimsiz Mezun'}</h3>
      <div class="dept">${m.bolum || '-'}</div>
      <div class="meta">
        <div>📍 ${m.sehir || '-'}</div>
        <div>🎓 ${m.yil || '-'} Mezunu</div>
        <div>💼 ${m.kurum || '-'}</div>
      </div>
      <button class="detail-btn" onclick="openGraduateDetail(${m.id})">Detayları Gör</button>
    `;
    graduatesContainer.appendChild(card);
  });
}

window.openGraduateDetail = function (id) {
  const m = localGraduatesData.find(grad => grad.id === id);
  if (!m) return;

  const firstLetter = m.ad ? m.ad.charAt(0).toUpperCase() : '?';
  modalContent.innerHTML = `
    <div class="profile-big">
      <div class="avatar" style="width:52px; height:52px; font-size:18px; margin:0 auto; display:grid; place-items:center; border-radius:50%; background:var(--primary); color:white; font-weight:800;">${firstLetter}</div>
      <h2 style="margin:14px 0 4px;">${m.ad || '-'}</h2>
      <div class="dept" style="color:var(--primary); font-weight:700; margin-bottom:20px;">${m.bolum || '-'}</div>
    </div>
    <div class="profile-list">
      <div><strong>Mezuniyet Yılı:</strong> <span>${m.yil || '-'}</span></div>
      <div><strong>Bulunduğu Şehir:</strong> <span>${m.sehir || '-'}</span></div>
      <div><strong>Sektör / Alan:</strong> <span>${m.sektor || '-'}</span></div>
      <div><strong>Çalışma Durumu:</strong> <span>${m.durum || '-'}</span></div>
      <div><strong>Kurum / Şirket:</strong> <span>${m.kurum || '-'}</span></div>
      <div><strong>Unvan / Görev:</strong> <span>${m.unvan || '-'}</span></div>
    </div>
  `;
  modal.classList.remove('hidden');
};

searchInput.addEventListener('input', filterAndRenderGraduates);
departmentFilter.addEventListener('change', filterAndRenderGraduates);
yearFilter.addEventListener('change', filterAndRenderGraduates);
cityFilter.addEventListener('change', filterAndRenderGraduates);
statusFilter.addEventListener('change', filterAndRenderGraduates);

resetBtn.addEventListener('click', () => {
  searchInput.value = '';
  departmentFilter.value = '';
  yearFilter.value = '';
  cityFilter.value = '';
  statusFilter.value = '';
  filterAndRenderGraduates();
});

closeModal.addEventListener('click', () => modal.classList.add('hidden'));
closeAdminModal.addEventListener('click', () => adminModal.classList.add('hidden'));

themeBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  themeBtn.textContent = isDark ? '☼' : '☾';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

adminLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  const password = prompt("Yönetici giriş şifresini yazınız:");
  if (password === "123456y.") {
    adminModal.classList.remove('hidden');
  } else if (password !== null) {
    alert("Hatalı şifre girdiniz!");
  }
});

btnSaveToDatabase.addEventListener('click', async () => {
  const name = document.getElementById('admName').value.trim();
  const dept = document.getElementById('admDept').value;
  const year = parseInt(document.getElementById('admYear').value.trim());
  const city = document.getElementById('admCity').value.trim();
  const sektor = document.getElementById('admSektor').value.trim();
  const status = document.getElementById('admStatus').value;
  const company = document.getElementById('admCompany').value.trim();
  const job = document.getElementById('admJob').value.trim();

  if (!name || !year || !city || !sektor || !company || !job) {
    alert("Lütfen zorunlu alanların (*) tümünü doldurunuz!");
    return;
  }

  try {
    btnSaveToDatabase.disabled = true;
    btnSaveToDatabase.textContent = "Buluta Kaydediliyor...";

    const response = await fetch(`${SUPABASE_URL}/rest/v1/mezunlar`, {
      method: 'POST',
      headers: {
        ...supabaseHeaders,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        ad: name,
        bolum: dept,
        yil: year,
        sehir: city,
        sektor: sektor,
        durum: status,
        kurum: company,
        unvan: job
      })
    });

    if (!response.ok) throw new Error("Veri tabanına yazma hatası.");

    alert("Harika! Yeni mezun kaydı bulut veritabanınıza başarıyla doğrudan eklendi.");

    document.getElementById('admName').value = '';
    document.getElementById('admYear').value = '';
    document.getElementById('admCity').value = '';
    document.getElementById('admSektor').value = '';
    document.getElementById('admCompany').value = '';
    document.getElementById('admJob').value = '';

    adminModal.classList.add('hidden');
    await fetchGraduatesFromDatabase();

  } catch (err) {
    console.error("Kayıt esnasında hata oluştu:", err.message);
    alert("Veritabanına kaydedilirken bir hata oluştu: " + err.message);
  } finally {
    btnSaveToDatabase.disabled = false;
    btnSaveToDatabase.textContent = "💾 Veritabanına Doğrudan Kaydet (Kalıcı)";
  }
});

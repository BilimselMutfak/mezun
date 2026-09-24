import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

/* ========================================================
   FIREBASE AYARLARI
   ======================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyClVse5IDWDPo5jLXz_YNKKew3vMUMdAhA",
  authDomain: "mezunlar-9af10.firebaseapp.com",
  projectId: "mezunlar-9af10",
  storageBucket: "mezunlar-9af10.firebasestorage.app",
  messagingSenderId: "572752219682",
  appId: "1:572752219682:web:968dffe69fdc2c6506c47b"
};

/* ========================================================
   FIREBASE BAŞLAT
   ======================================================== */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ========================================================
   GLOBAL DEĞİŞKENLER
   ======================================================== */

let localGraduatesData = [];

/* ========================================================
   HTML ELEMENTLERİ
   ======================================================== */

const graduatesContainer = document.getElementById("graduates");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const departmentFilter = document.getElementById("departmentFilter");
const yearFilter = document.getElementById("yearFilter");
const cityFilter = document.getElementById("cityFilter");
const statusFilter = document.getElementById("statusFilter");

const resetBtn = document.getElementById("resetBtn");

const resultText = document.getElementById("resultText");

const statTotal = document.getElementById("stat-total");
const statWorking = document.getElementById("stat-working");
const statDepartments = document.getElementById("stat-departments");
const statCities = document.getElementById("stat-cities");

const themeBtn = document.getElementById("themeBtn");

const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const closeModal = document.getElementById("closeModal");

const loginModal = document.getElementById("loginModal");
const closeLoginModal = document.getElementById("closeLoginModal");

const adminModal = document.getElementById("adminModal");
const closeAdminModal = document.getElementById("closeAdminModal");

const adminLoginLink = document.getElementById("adminLoginLink");

const btnLogin = document.getElementById("btnLogin");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");

const btnSaveToDatabase = document.getElementById("btnSaveToDatabase");

/* ========================================================
   SAYFA AÇILDIĞINDA
   ======================================================== */

document.addEventListener("DOMContentLoaded", () => {

  fetchGraduatesFromDatabase();

  setupEventListeners();

  setupTheme();

});

/* ========================================================
   EVENTLER
   ======================================================== */

function setupEventListeners() {

  searchInput.addEventListener("input", filterAndRenderGraduates);

  departmentFilter.addEventListener("change", filterAndRenderGraduates);

  yearFilter.addEventListener("change", filterAndRenderGraduates);

  cityFilter.addEventListener("change", filterAndRenderGraduates);

  statusFilter.addEventListener("change", filterAndRenderGraduates);

  resetBtn.addEventListener("click", resetFilters);

  closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  closeLoginModal.addEventListener("click", () => {
    loginModal.classList.add("hidden");
  });

  closeAdminModal.addEventListener("click", () => {
    adminModal.classList.add("hidden");
  });

  adminLoginLink.addEventListener("click", (event) => {

    event.preventDefault();

    loginError.style.display = "none";

    loginModal.classList.remove("hidden");

  });

  btnLogin.addEventListener("click", adminLogin);

  btnSaveToDatabase.addEventListener("click", saveGraduateToDatabase);

  themeBtn.addEventListener("click", toggleTheme);

}

/* ========================================================
   FIRESTORE'DAN MEZUNLARI GETİR
   ======================================================== */

async function fetchGraduatesFromDatabase() {

  try {

    resultText.textContent = "Veriler yükleniyor...";

    const snapshot = await getDocs(
      collection(db, "mezunlar")
    );

    localGraduatesData = snapshot.docs.map(doc => {

      const data = doc.data();

      return {
        ...data,
        firestoreId: doc.id
      };

    });

    populateFilterOptions();

    calculateAndRenderStats();

    filterAndRenderGraduates();

  } catch (error) {

    console.error("Firestore veri alma hatası:", error);

    resultText.textContent =
      "Veriler yüklenirken bir hata oluştu.";

  }

}

/* ========================================================
   FİLTRE SEÇENEKLERİNİ DOLDUR
   ======================================================== */

function populateFilterOptions() {

  const departments = [
    ...new Set(
      localGraduatesData
        .map(m => m.bolum)
        .filter(Boolean)
    )
  ].sort();

  const years = [
    ...new Set(
      localGraduatesData
        .map(m => m.yil)
        .filter(Boolean)
    )
  ].sort((a, b) => Number(b) - Number(a));

  const cities = [
    ...new Set(
      localGraduatesData
        .map(m => m.sehir)
        .filter(Boolean)
    )
  ].sort();

  const statuses = [
    ...new Set(
      localGraduatesData
        .map(m => m.durum)
        .filter(Boolean)
    )
  ].sort();

  departmentFilter.innerHTML =
    `<option value="">Tüm bölümler</option>`;

  departments.forEach(dept => {

    departmentFilter.innerHTML += `
      <option value="${escapeHtml(dept)}">
        ${escapeHtml(dept)}
      </option>
    `;

  });

  yearFilter.innerHTML =
    `<option value="">Tüm yıllar</option>`;

  years.forEach(year => {

    yearFilter.innerHTML += `
      <option value="${escapeHtml(year)}">
        ${escapeHtml(year)}
      </option>
    `;

  });

  cityFilter.innerHTML =
    `<option value="">Tüm şehirler</option>`;

  cities.forEach(city => {

    cityFilter.innerHTML += `
      <option value="${escapeHtml(city)}">
        ${escapeHtml(city)}
      </option>
    `;

  });

  statusFilter.innerHTML =
    `<option value="">Tümü</option>`;

  statuses.forEach(status => {

    statusFilter.innerHTML += `
      <option value="${escapeHtml(status)}">
        ${escapeHtml(status)}
      </option>
    `;

  });

}

/* ========================================================
   İSTATİSTİKLER
   ======================================================== */

function calculateAndRenderStats() {

  const total = localGraduatesData.length;

  const working =
    localGraduatesData.filter(
      m =>
        m.durum === "Çalışıyor" ||
        m.durum === "Girişimci"
    ).length;

  const departments =
    new Set(
      localGraduatesData
        .map(m => m.bolum)
        .filter(Boolean)
    ).size;

  const cities =
    new Set(
      localGraduatesData
        .map(m => m.sehir)
        .filter(Boolean)
    ).size;

  statTotal.textContent = total;

  statWorking.textContent = working;

  statDepartments.textContent = departments;

  statCities.textContent = cities;

}

/* ========================================================
   FİLTRELEME
   ======================================================== */

function filterAndRenderGraduates() {

  const search =
    searchInput.value
      .trim()
      .toLocaleLowerCase("tr-TR");

  const department =
    departmentFilter.value;

  const year =
    yearFilter.value;

  const city =
    cityFilter.value;

  const status =
    statusFilter.value;

  const filtered =
    localGraduatesData.filter(m => {

      const searchableText = [

        m.ad,
        m.bolum,
        m.kurum,
        m.sektor,
        m.unvan

      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      const matchesSearch =
        !search ||
        searchableText.includes(search);

      const matchesDepartment =
        !department ||
        m.bolum === department;

      const matchesYear =
        !year ||
        String(m.yil) === String(year);

      const matchesCity =
        !city ||
        m.sehir === city;

      const matchesStatus =
        !status ||
        m.durum === status;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesYear &&
        matchesCity &&
        matchesStatus
      );

    });

  renderGraduatesCards(filtered);

  resultText.textContent =
    `${filtered.length} mezun gösteriliyor`;

}

/* ========================================================
   MEZUN KARTLARINI OLUŞTUR
   ======================================================== */

function renderGraduatesCards(list) {

  graduatesContainer.innerHTML = "";

  if (!list.length) {

    emptyState.classList.remove("hidden");

    return;

  }

  emptyState.classList.add("hidden");

  list.forEach(m => {

    const card =
      document.createElement("div");

    /*
     * DURUMA GÖRE KART RENGİ
     *
     * Çalışıyor       → Yeşil
     * Çalışmıyor      → Kırmızı
     * Girişimci        → Mavi
     * Diğer durumlar  → Normal
     */

    const normalizedStatus =
      String(m.durum || "")
        .trim()
        .toLocaleLowerCase("tr-TR");

    if (normalizedStatus === "çalışıyor") {

      card.className =
        "card status-working";

    } else if (normalizedStatus === "çalışmıyor") {

      card.className =
        "card status-not-working";

    } else if (normalizedStatus === "girişimci") {

      card.className =
        "card status-entrepreneur";

    } else {

      card.className =
        "card";

    }

    const firstLetter =
      (m.ad || "?")
        .trim()
        .charAt(0)
        .toLocaleUpperCase("tr-TR");

    card.innerHTML = `

      <div class="card-top">

        <div class="avatar">
          ${escapeHtml(firstLetter)}
        </div>

        <div class="status">
          ${escapeHtml(m.durum || "-")}
        </div>

      </div>

      <h3>
        ${escapeHtml(m.ad || "İsimsiz Mezun")}
      </h3>

      <div class="dept">
        ${escapeHtml(m.bolum || "-")}
      </div>

      <div class="meta">

        <div>
          📍 ${escapeHtml(m.sehir || "-")}
        </div>

        <div>
          🎓 ${escapeHtml(m.yil || "-")} Mezunu
        </div>

        <div>
          💼 ${escapeHtml(m.kurum || "-")}
        </div>

      </div>

      <button
        class="detail-btn"
        onclick="openGraduateDetail('${escapeHtml(String(m.id || m.firestoreId || ""))}')"
      >
        Detayları Gör
      </button>

    `;

    graduatesContainer.appendChild(card);

  });

}

/* ========================================================
   DETAY MODALI
   ======================================================== */

window.openGraduateDetail = function(id) {

  const graduate =
    localGraduatesData.find(
      m =>
        String(m.id) === String(id) ||
        String(m.firestoreId) === String(id)
    );

  if (!graduate) {

    console.error("Mezun bulunamadı:", id);

    return;

  }

  const firstLetter =
    (graduate.ad || "?")
      .trim()
      .charAt(0)
      .toLocaleUpperCase("tr-TR");

  modalContent.innerHTML = `

    <div class="profile-big">

      <div class="avatar">
        ${escapeHtml(firstLetter)}
      </div>

      <h2>
        ${escapeHtml(graduate.ad || "İsimsiz Mezun")}
      </h2>

      <div class="dept">
        ${escapeHtml(graduate.bolum || "-")}
      </div>

    </div>

    <div class="profile-list">

      <div>
        <strong>Mezuniyet Yılı:</strong>
        ${escapeHtml(graduate.yil || "-")}
      </div>

      <div>
        <strong>Şehir:</strong>
        ${escapeHtml(graduate.sehir || "-")}
      </div>

      <div>
        <strong>Sektör:</strong>
        ${escapeHtml(graduate.sektor || "-")}
      </div>

      <div>
        <strong>Durum:</strong>
        ${escapeHtml(graduate.durum || "-")}
      </div>

      <div>
        <strong>Kurum:</strong>
        ${escapeHtml(graduate.kurum || "-")}
      </div>

      <div>
        <strong>Unvan:</strong>
        ${escapeHtml(graduate.unvan || "-")}
      </div>

    </div>

  `;

  modal.classList.remove("hidden");

};

/* ========================================================
   FİLTRELERİ TEMİZLE
   ======================================================== */

function resetFilters() {

  searchInput.value = "";

  departmentFilter.value = "";

  yearFilter.value = "";

  cityFilter.value = "";

  statusFilter.value = "";

  filterAndRenderGraduates();

}

/* ========================================================
   TEMA
   ======================================================== */

function setupTheme() {

  const savedTheme =
    localStorage.getItem("mezunPortalTheme");

  if (savedTheme === "dark") {

    document.body.classList.add("dark");

    themeBtn.textContent = "☀";

  } else {

    themeBtn.textContent = "☾";

  }

}

function toggleTheme() {

  document.body.classList.toggle("dark");

  const isDark =
    document.body.classList.contains("dark");

  localStorage.setItem(
    "mezunPortalTheme",
    isDark ? "dark" : "light"
  );

  themeBtn.textContent =
    isDark ? "☀" : "☾";

}

/* ========================================================
   ADMIN GİRİŞİ
   ======================================================== */

async function adminLogin() {

  const email =
    loginEmail.value.trim();

  const password =
    loginPassword.value;

  if (!email || !password) {

    showLoginError(
      "E-posta ve şifre alanlarını doldurunuz."
    );

    return;

  }

  btnLogin.disabled = true;

  btnLogin.textContent =
    "Giriş yapılıyor...";

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    loginError.style.display = "none";

    loginModal.classList.add("hidden");

    adminModal.classList.remove("hidden");

  } catch (error) {

    console.error(
      "Admin giriş hatası:",
      error
    );

    showLoginError(
      "E-posta veya şifre hatalı."
    );

  } finally {

    btnLogin.disabled = false;

    btnLogin.textContent =
      "Giriş Yap";

  }

}

/* ========================================================
   GİRİŞ HATASI
   ======================================================== */

function showLoginError(message) {

  loginError.textContent =
    message;

  loginError.style.display =
    "block";

}

/* ========================================================
   FIRESTORE'A YENİ MEZUN EKLE
   ======================================================== */

async function saveGraduateToDatabase() {

  const name =
    document.getElementById("admName").value.trim();

  const dept =
    document.getElementById("admDept").value;

  const year =
    document.getElementById("admYear").value.trim();

  const city =
    document.getElementById("admCity").value.trim();

  const sektor =
    document.getElementById("admSektor").value.trim();

  const status =
    document.getElementById("admStatus").value;

  const company =
    document.getElementById("admCompany").value.trim();

  const job =
    document.getElementById("admJob").value.trim();

  if (
    !name ||
    !dept ||
    !year ||
    !city ||
    !sektor ||
    !status ||
    !company ||
    !job
  ) {

    alert(
      "Lütfen tüm alanları doldurunuz."
    );

    return;

  }

  btnSaveToDatabase.disabled = true;

  btnSaveToDatabase.textContent =
    "⏳ Veritabanına kaydediliyor...";

  try {

    const newId =
      Date.now();

    const newGraduate = {

      id: newId,

      ad: name,

      bolum: dept,

      yil: year,

      sehir: city,

      sektor: sektor,

      durum: status,

      kurum: company,

      unvan: job

    };

    await addDoc(
      collection(db, "mezunlar"),
      newGraduate
    );

    alert(
      "Mezun kaydı başarıyla veritabanına eklendi."
    );

    document.getElementById("admName").value = "";

    document.getElementById("admYear").value = "";

    document.getElementById("admCity").value = "";

    document.getElementById("admSektor").value = "";

    document.getElementById("admCompany").value = "";

    document.getElementById("admJob").value = "";

    adminModal.classList.add("hidden");

    await fetchGraduatesFromDatabase();

  } catch (error) {

    console.error(
      "Mezun kaydetme hatası:",
      error
    );

    alert(
      "Kayıt sırasında hata oluştu. Konsolu kontrol ediniz."
    );

  } finally {

    btnSaveToDatabase.disabled = false;

    btnSaveToDatabase.textContent =
      "💾 Veritabanına Doğrudan Kaydet (Kalıcı)";

  }

}

/* ========================================================
   AUTH DURUMU
   ======================================================== */

onAuthStateChanged(auth, user => {

  if (user) {

    console.log(
      "Firebase kullanıcısı giriş yaptı:",
      user.email
    );

  } else {

    console.log(
      "Firebase kullanıcısı giriş yapmadı."
    );

  }

});

/* ========================================================
   HTML GÜVENLİK / ESCAPE
   ======================================================== */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

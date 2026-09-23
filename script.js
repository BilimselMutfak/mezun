const $ = (id) => document.getElementById(id);

const stats = $("stats");
const graduates = $("graduates");
const emptyState = $("emptyState");
const resultText = $("resultText");

function uniqueValues(key) {
  return [...new Set(mezunlar.map(x => x[key]))].sort((a,b) => String(a).localeCompare(String(b), "tr"));
}

function fillSelect(id, values) {
  const select = $(id);
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function initials(name) {
  return name.split(" ").slice(0,2).map(x => x[0]).join("").toUpperCase();
}

function renderStats() {
  const total = mezunlar.length;
  const working = mezunlar.filter(x => x.durum === "Çalışıyor").length;
  const graduate = mezunlar.filter(x => x.durum === "Lisansüstü Eğitim").length;
  const entrepreneur = mezunlar.filter(x => x.durum === "Girişimci").length;

  stats.innerHTML = `
    <div class="stat"><div class="number">${total}</div><div class="label">Toplam Mezun</div></div>
    <div class="stat"><div class="number">${working}</div><div class="label">Çalışan Mezun</div></div>
    <div class="stat"><div class="number">${graduate}</div><div class="label">Lisansüstü Eğitim</div></div>
    <div class="stat"><div class="number">${entrepreneur}</div><div class="label">Girişimci Mezun</div></div>
  `;
}

function renderGraduates(list) {
  graduates.innerHTML = list.map(mezun => `
    <article class="card">
      <div class="card-top">
        <div class="avatar">${initials(mezun.ad)}</div>
        <span class="status">${mezun.durum}</span>
      </div>
      <h3>${mezun.ad}</h3>
      <div class="dept">${mezun.bolum}</div>
      <div class="meta">
        <div>📅 ${mezun.yil} mezunu</div>
        <div>📍 ${mezun.sehir}</div>
        <div>🏢 ${mezun.kurum}</div>
        <div>💼 ${mezun.unvan}</div>
      </div>
      <button class="detail-btn" onclick="showProfile(${mezun.id})">Profili Görüntüle</button>
    </article>
  `).join("");

  emptyState.classList.toggle("hidden", list.length !== 0);
}

function filterGraduates() {
  const q = $("searchInput").value.trim().toLocaleLowerCase("tr-TR");
  const department = $("departmentFilter").value;
  const year = $("yearFilter").value;
  const city = $("cityFilter").value;
  const status = $("statusFilter").value;

  const filtered = mezunlar.filter(m => {
    const searchable = `${m.ad} ${m.bolum} ${m.sehir} ${m.sektor} ${m.kurum} ${m.unvan}`.toLocaleLowerCase("tr-TR");
    return (!q || searchable.includes(q))
      && (!department || m.bolum === department)
      && (!year || String(m.yil) === year)
      && (!city || m.sehir === city)
      && (!status || m.durum === status);
  });

  renderGraduates(filtered);
  resultText.textContent = `${filtered.length} mezun gösteriliyor.`;
}

function showProfile(id) {
  const m = mezunlar.find(x => x.id === id);
  if (!m) return;

  $("modalContent").innerHTML = `
    <div class="profile-big">
      <div class="avatar">${initials(m.ad)}</div>
      <h2>${m.ad}</h2>
      <div class="dept">${m.bolum}</div>
    </div>
    <div class="profile-list">
      <div><strong>Mezuniyet:</strong> ${m.yil}</div>
      <div><strong>Şehir:</strong> ${m.sehir}</div>
      <div><strong>Durum:</strong> ${m.durum}</div>
      <div><strong>Sektör:</strong> ${m.sektor}</div>
      <div><strong>Kurum:</strong> ${m.kurum}</div>
      <div><strong>Pozisyon:</strong> ${m.unvan}</div>
    </div>
  `;
  $("modal").classList.remove("hidden");
}

function resetFilters() {
  $("searchInput").value = "";
  ["departmentFilter","yearFilter","cityFilter","statusFilter"].forEach(id => $(id).value = "");
  filterGraduates();
}

function init() {
  fillSelect("departmentFilter", uniqueValues("bolum"));
  fillSelect("yearFilter", uniqueValues("yil").sort((a,b) => b-a));
  fillSelect("cityFilter", uniqueValues("sehir"));
  fillSelect("statusFilter", uniqueValues("durum"));

  renderStats();
  renderGraduates(mezunlar);

  ["searchInput","departmentFilter","yearFilter","cityFilter","statusFilter"]
    .forEach(id => $(id).addEventListener("input", filterGraduates));

  $("resetBtn").addEventListener("click", resetFilters);
  $("closeModal").addEventListener("click", () => $("modal").classList.add("hidden"));
  $("modal").addEventListener("click", e => {
    if (e.target === $("modal")) $("modal").classList.add("hidden");
  });

  $("themeBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    $("themeBtn").textContent = document.body.classList.contains("dark") ? "☀" : "☾";
  });
}

init();

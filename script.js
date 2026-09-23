// ========================================================
// MEZUN PORTALI - SUPABASE + FİLTRELEME + ADMİN PANELİ
// ========================================================


// ========================================================
// 1. SUPABASE BAĞLANTI AYARLARI
// ========================================================

// BURAYA KENDİ SUPABASE PROJECT URL'NİZİ YAZIN
const SUPABASE_URL = "https://yevbibgsmhxgbtutgbmv.supabase.co";

// BURAYA SUPABASE ANON / PUBLIC KEY'İNİZİ YAZIN
const SUPABASE_ANON_KEY = "sb_publishable_euV481YL-C4481-_dPGXOw_0HIrIiSH";


// Supabase bağlantısını oluştur
window. supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ========================================================
// 2. GLOBAL UYGULAMA DEĞİŞKENLERİ
// ========================================================

let localGraduatesData = [];


// ========================================================
// 3. DOM ELEMANLARI
// ========================================================

let graduatesContainer;
let searchInput;
let departmentFilter;
let yearFilter;
let cityFilter;
let statusFilter;
let resetBtn;
let resultText;
let emptyState;
let themeBtn;

let modal;
let closeModal;
let modalContent;


// ========================================================
// 4. ADMİN DOM ELEMANLARI
// ========================================================

let adminLoginLink;
let adminModal;
let closeAdminModal;
let btnSaveToDatabase;


// ========================================================
// 5. DOM HAZIR OLDUĞUNDA UYGULAMAYI BAŞLAT
// ========================================================

document.addEventListener("DOMContentLoaded", () => {

    // ----------------------------------------------------
    // DOM ELEMANLARINI TANIMLA
    // ----------------------------------------------------

    graduatesContainer = document.getElementById("graduates");
    searchInput = document.getElementById("searchInput");
    departmentFilter = document.getElementById("departmentFilter");
    yearFilter = document.getElementById("yearFilter");
    cityFilter = document.getElementById("cityFilter");
    statusFilter = document.getElementById("statusFilter");
    resetBtn = document.getElementById("resetBtn");
    resultText = document.getElementById("resultText");
    emptyState = document.getElementById("emptyState");
    themeBtn = document.getElementById("themeBtn");

    modal = document.getElementById("modal");
    closeModal = document.getElementById("closeModal");
    modalContent = document.getElementById("modalContent");

    adminLoginLink = document.getElementById("adminLoginLink");
    adminModal = document.getElementById("adminModal");
    closeAdminModal = document.getElementById("closeAdminModal");
    btnSaveToDatabase = document.getElementById("btnSaveToDatabase");


    // ----------------------------------------------------
    // ELEMENT KONTROLÜ
    // ----------------------------------------------------

    if (!graduatesContainer) {
        console.error("HATA: #graduates elementi bulunamadı.");
    }

    if (!searchInput) {
        console.error("HATA: #searchInput elementi bulunamadı.");
    }


    // ----------------------------------------------------
    // TEMA AYARINI YÜKLE
    // ----------------------------------------------------

    loadTheme();


    // ----------------------------------------------------
    // EVENT LISTENER'LARI TANIMLA
    // ----------------------------------------------------

    initializeEventListeners();


    // ----------------------------------------------------
    // SUPABASE'DEN MEZUNLARI GETİR
    // ----------------------------------------------------

    fetchGraduatesFromDatabase();

});


// ========================================================
// 6. EVENT LISTENER'LAR
// ========================================================

function initializeEventListeners() {

    // ----------------------------------------------------
    // ARAMA
    // ----------------------------------------------------

    if (searchInput) {
        searchInput.addEventListener("input", filterAndRenderGraduates);
    }


    // ----------------------------------------------------
    // FİLTRELER
    // ----------------------------------------------------

    if (departmentFilter) {
        departmentFilter.addEventListener(
            "change",
            filterAndRenderGraduates
        );
    }

    if (yearFilter) {
        yearFilter.addEventListener(
            "change",
            filterAndRenderGraduates
        );
    }

    if (cityFilter) {
        cityFilter.addEventListener(
            "change",
            filterAndRenderGraduates
        );
    }

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            filterAndRenderGraduates
        );
    }


    // ----------------------------------------------------
    // SIFIRLA BUTONU
    // ----------------------------------------------------

    if (resetBtn) {
        resetBtn.addEventListener("click", resetFilters);
    }


    // ----------------------------------------------------
    // TEMA BUTONU
    // ----------------------------------------------------

    if (themeBtn) {
        themeBtn.addEventListener("click", toggleTheme);
    }


    // ----------------------------------------------------
    // DETAY MODALI
    // ----------------------------------------------------

    if (closeModal) {
        closeModal.addEventListener("click", () => {
            modal.classList.add("hidden");
        });
    }


    // ----------------------------------------------------
    // ADMİN MODALI
    // ----------------------------------------------------

    if (closeAdminModal) {
        closeAdminModal.addEventListener("click", () => {
            adminModal.classList.add("hidden");
        });
    }


    // ----------------------------------------------------
    // ADMİN GİRİŞİ
    // ----------------------------------------------------

    if (adminLoginLink) {
        adminLoginLink.addEventListener("click", handleAdminLogin);
    }


    // ----------------------------------------------------
    // VERİTABANINA KAYDET
    // ----------------------------------------------------

    if (btnSaveToDatabase) {
        btnSaveToDatabase.addEventListener(
            "click",
            saveGraduateToDatabase
        );
    }


    // ----------------------------------------------------
    // MODAL DIŞINA TIKLAYINCA KAPAT
    // ----------------------------------------------------

    window.addEventListener("click", (event) => {

        if (modal && event.target === modal) {
            modal.classList.add("hidden");
        }

        if (adminModal && event.target === adminModal) {
            adminModal.classList.add("hidden");
        }

    });


    // ----------------------------------------------------
    // ESC TUŞU İLE MODALLARI KAPAT
    // ----------------------------------------------------

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            if (modal) {
                modal.classList.add("hidden");
            }

            if (adminModal) {
                adminModal.classList.add("hidden");
            }

        }

    });

}


// ========================================================
// 7. SUPABASE'DEN MEZUNLARI ÇEK
// ========================================================

async function fetchGraduatesFromDatabase() {

    try {

        if (resultText) {
            resultText.textContent =
                "Veriler buluttan yükleniyor...";
        }


        const { data, error } = await supabase
            .from("mezunlar")
            .select("*")
            .order("id", {
                ascending: true
            });


        if (error) {
            throw error;
        }


        // Gelen veriyi hafızaya al
        localGraduatesData = data || [];


        // Filtreleri oluştur
        populateFilterOptions();


        // İstatistikleri oluştur
        calculateAndRenderStats();


        // Mezunları ekrana bas
        filterAndRenderGraduates();


    } catch (error) {

        console.error(
            "Supabase veritabanı hatası:",
            error
        );


        if (resultText) {

            resultText.textContent =
                "Veriler yüklenirken bir hata oluştu.";

        }

    }

}


// ========================================================
// 8. İSTATİSTİKLERİ HESAPLA VE GÖSTER
// ========================================================

function calculateAndRenderStats() {

    const total = localGraduatesData.length;


    // Çalışan + girişimci mezunlar
    const working =
        localGraduatesData.filter((m) => {

            const durum =
                normalizeText(m.durum);

            return (
                durum === "calisiyor" ||
                durum === "girisimci"
            );

        }).length;


    // Bölümler
    const departments =
        new Set(
            localGraduatesData
                .map((m) => m.bolum)
                .filter(Boolean)
        );


    // Şehirler
    const cities =
        new Set(
            localGraduatesData
                .map((m) => m.sehir)
                .filter(Boolean)
        );


    const statsElement =
        document.getElementById("stats");


    if (!statsElement) {
        return;
    }


    statsElement.innerHTML = `

        <div class="stat">

            <div class="number">
                ${total}
            </div>

            <div class="label">
                Toplam Mezun
            </div>

        </div>


        <div class="stat">

            <div class="number">
                ${working}
            </div>

            <div class="label">
                Çalışan Mezun
            </div>

        </div>


        <div class="stat">

            <div class="number">
                ${departments.size}
            </div>

            <div class="label">
                Aktif Bölüm
            </div>

        </div>


        <div class="stat">

            <div class="number">
                ${cities.size}
            </div>

            <div class="label">
                Farklı Şehir
            </div>

        </div>

    `;

}


// ========================================================
// 9. FİLTRE SEÇENEKLERİNİ DOLDUR
// ========================================================

function populateFilterOptions() {

    if (departmentFilter) {
        clearSelectOptions(departmentFilter);
    }

    if (yearFilter) {
        clearSelectOptions(yearFilter);
    }

    if (cityFilter) {
        clearSelectOptions(cityFilter);
    }

    if (statusFilter) {
        clearSelectOptions(statusFilter);
    }


    // ----------------------------------------------------
    // BÖLÜMLER
    // ----------------------------------------------------

    const departments = [
        ...new Set(
            localGraduatesData
                .map((m) => m.bolum)
                .filter(Boolean)
        )
    ].sort((a, b) =>
        String(a).localeCompare(
            String(b),
            "tr"
        )
    );


    // ----------------------------------------------------
    // YILLAR
    // ----------------------------------------------------

    const years = [
        ...new Set(
            localGraduatesData
                .map((m) => m.yil)
                .filter(Boolean)
        )
    ].sort((a, b) => Number(b) - Number(a));


    // ----------------------------------------------------
    // ŞEHİRLER
    // ----------------------------------------------------

    const cities = [
        ...new Set(
            localGraduatesData
                .map((m) => m.sehir)
                .filter(Boolean)
        )
    ].sort((a, b) =>
        String(a).localeCompare(
            String(b),
            "tr"
        )
    );


    // ----------------------------------------------------
    // DURUMLAR
    // ----------------------------------------------------

    const statuses = [
        ...new Set(
            localGraduatesData
                .map((m) => m.durum)
                .filter(Boolean)
        )
    ].sort((a, b) =>
        String(a).localeCompare(
            String(b),
            "tr"
        )
    );


    // ----------------------------------------------------
    // SELECT'LERE EKLE
    // ----------------------------------------------------

    if (departmentFilter) {

        departments.forEach((department) => {

            departmentFilter.appendChild(
                new Option(
                    department,
                    department
                )
            );

        });

    }


    if (yearFilter) {

        years.forEach((year) => {

            yearFilter.appendChild(
                new Option(
                    year,
                    year
                )
            );

        });

    }


    if (cityFilter) {

        cities.forEach((city) => {

            cityFilter.appendChild(
                new Option(
                    city,
                    city
                )
            );

        });

    }


    if (statusFilter) {

        statuses.forEach((status) => {

            statusFilter.appendChild(
                new Option(
                    status,
                    status
                )
            );

        });

    }

}


// ========================================================
// 10. SELECT SEÇENEKLERİNİ TEMİZLE
// ========================================================

function clearSelectOptions(selectElement) {

    if (!selectElement) {
        return;
    }


    while (selectElement.options.length > 1) {

        selectElement.remove(1);

    }

}


// ========================================================
// 11. MEZUNLARI FİLTRELE
// ========================================================

function filterAndRenderGraduates() {

    if (!searchInput) {
        return;
    }


    const query =
        normalizeText(
            searchInput.value
        );


    const selectedDept =
        departmentFilter
            ? departmentFilter.value
            : "";


    const selectedYear =
        yearFilter
            ? yearFilter.value
            : "";


    const selectedCity =
        cityFilter
            ? cityFilter.value
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "";


    const filtered =
        localGraduatesData.filter((m) => {


            // ------------------------------------------------
            // ARAMA
            // ------------------------------------------------

            const searchableText = [

                m.ad,
                m.bolum,
                m.kurum,
                m.sektor,
                m.unvan,
                m.sehir,
                m.durum

            ]
                .filter(Boolean)
                .map(normalizeText)
                .join(" ");


            const matchesSearch =
                !query ||
                searchableText.includes(query);


            // ------------------------------------------------
            // BÖLÜM
            // ------------------------------------------------

            const matchesDept =
                !selectedDept ||
                m.bolum === selectedDept;


            // ------------------------------------------------
            // YIL
            // ------------------------------------------------

            const matchesYear =
                !selectedYear ||
                String(m.yil) === String(selectedYear);


            // ------------------------------------------------
            // ŞEHİR
            // ------------------------------------------------

            const matchesCity =
                !selectedCity ||
                m.sehir === selectedCity;


            // ------------------------------------------------
            // DURUM
            // ------------------------------------------------

            const matchesStatus =
                !selectedStatus ||
                m.durum === selectedStatus;


            return (
                matchesSearch &&
                matchesDept &&
                matchesYear &&
                matchesCity &&
                matchesStatus
            );

        });


    // ----------------------------------------------------
    // KARTLARI OLUŞTUR
    // ----------------------------------------------------

    renderGraduatesCards(filtered);


    // ----------------------------------------------------
    // SONUÇ YAZISI
    // ----------------------------------------------------

    if (!resultText) {
        return;
    }


    if (
        filtered.length ===
        localGraduatesData.length
    ) {

        resultText.textContent =
            "Tüm mezunlar gösteriliyor.";

    } else {

        resultText.textContent =
            `${filtered.length} mezun bulundu.`;

    }

}


// ========================================================
// 12. MEZUN KARTLARINI OLUŞTUR
// ========================================================

function renderGraduatesCards(list) {

    if (!graduatesContainer) {
        return;
    }


    graduatesContainer.innerHTML = "";


    // ----------------------------------------------------
    // SONUÇ YOK
    // ----------------------------------------------------

    if (list.length === 0) {

        if (emptyState) {
            emptyState.classList.remove("hidden");
        }

        return;
    }


    if (emptyState) {
        emptyState.classList.add("hidden");
    }


    // ----------------------------------------------------
    // KARTLARI OLUŞTUR
    // ----------------------------------------------------

    list.forEach((m) => {


        const firstLetter =
            m.ad
                ? String(m.ad)
                    .charAt(0)
                    .toUpperCase()
                : "?";


        const card =
            document.createElement("div");


        card.className = "card";


        card.innerHTML = `

            <div class="card-top">

                <div class="avatar">
                    ${escapeHTML(firstLetter)}
                </div>

                <div class="status">
                    ${escapeHTML(m.durum || "-")}
                </div>

            </div>


            <h3>
                ${escapeHTML(m.ad || "İsimsiz Mezun")}
            </h3>


            <div class="dept">
                ${escapeHTML(m.bolum || "-")}
            </div>


            <div class="meta">

                <div>
                    📍 ${escapeHTML(m.sehir || "-")}
                </div>

                <div>
                    🎓 ${escapeHTML(m.yil || "-")} Mezunu
                </div>

                <div>
                    💼 ${escapeHTML(m.kurum || "-")}
                </div>

            </div>


            <button
                class="detail-btn"
                type="button"
                data-id="${m.id}"
            >
                Detayları Gör
            </button>

        `;


        // ------------------------------------------------
        // DETAY BUTONU
        // ------------------------------------------------

        const detailButton =
            card.querySelector(".detail-btn");


        detailButton.addEventListener(
            "click",
            () => openGraduateDetail(m.id)
        );


        graduatesContainer.appendChild(card);

    });

}


// ========================================================
// 13. MEZUN DETAY MODALI
// ========================================================

window.openGraduateDetail = function (id) {

    const graduate =
        localGraduatesData.find(
            (grad) =>
                String(grad.id) === String(id)
        );


    if (!graduate) {
        return;
    }


    if (!modal || !modalContent) {
        return;
    }


    const firstLetter =
        graduate.ad
            ? String(graduate.ad)
                .charAt(0)
                .toUpperCase()
            : "?";


    modalContent.innerHTML = `

        <div class="profile-big">

            <div
                class="avatar"
                style="
                    width:52px;
                    height:52px;
                    font-size:18px;
                    margin:0 auto;
                    display:grid;
                    place-items:center;
                    border-radius:50%;
                    background:var(--primary);
                    color:white;
                    font-weight:800;
                "
            >
                ${escapeHTML(firstLetter)}
            </div>


            <h2 style="margin:14px 0 4px;">

                ${escapeHTML(
                    graduate.ad || "-"
                )}

            </h2>


            <div
                class="dept"
                style="
                    color:var(--primary);
                    font-weight:700;
                    margin-bottom:20px;
                "
            >

                ${escapeHTML(
                    graduate.bolum || "-"
                )}

            </div>

        </div>


        <div class="profile-list">

            <div>

                <strong>
                    Mezuniyet Yılı:
                </strong>

                <span>
                    ${escapeHTML(
                        graduate.yil || "-"
                    )}
                </span>

            </div>


            <div>

                <strong>
                    Bulunduğu Şehir:
                </strong>

                <span>
                    ${escapeHTML(
                        graduate.sehir || "-"
                    )}
                </span>

            </div>


            <div>

                <strong>
                    Sektör / Alan:
                </strong>

                <span>
                    ${escapeHTML(
                        graduate.sektor || "-"
                    )}
                </span>

            </div>


            <div>

                <strong>
                    Çalışma Durumu:
                </strong>

                <span>
                    ${escapeHTML(
                        graduate.durum || "-"
                    )}
                </span>

            </div>


            <div>

                <strong>
                    Kurum / Şirket:
                </strong>

                <span>
                    ${escapeHTML(
                        graduate.kurum || "-"
                    )}
                </span>

            </div>


            <div>

                <strong>
                    Unvan / Görev:
                </strong>

                <span>
                    ${escapeHTML(
                        graduate.unvan || "-"
                    )}
                </span>

            </div>

        </div>

    `;


    modal.classList.remove("hidden");

};


// ========================================================
// 14. FİLTRELERİ SIFIRLA
// ========================================================

function resetFilters() {

    if (searchInput) {
        searchInput.value = "";
    }


    if (departmentFilter) {
        departmentFilter.value = "";
    }


    if (yearFilter) {
        yearFilter.value = "";
    }


    if (cityFilter) {
        cityFilter.value = "";
    }


    if (statusFilter) {
        statusFilter.value = "";
    }


    filterAndRenderGraduates();

}


// ========================================================
// 15. TEMA SİSTEMİ
// ========================================================

function loadTheme() {

    const savedTheme =
        localStorage.getItem("theme");


    if (savedTheme === "dark") {

        document.body.classList.add("dark");


        if (themeBtn) {
            themeBtn.textContent = "☼";
        }

    } else {

        document.body.classList.remove("dark");


        if (themeBtn) {
            themeBtn.textContent = "☾";
        }

    }

}


// --------------------------------------------------------
// TEMA DEĞİŞTİR
// --------------------------------------------------------

function toggleTheme() {

    const isDark =
        document.body.classList.toggle("dark");


    if (themeBtn) {

        themeBtn.textContent =
            isDark
                ? "☼"
                : "☾";

    }


    localStorage.setItem(
        "theme",
        isDark
            ? "dark"
            : "light"
    );

}


// ========================================================
// 16. ADMİN GİRİŞİ
// ========================================================

function handleAdminLogin(event) {

    event.preventDefault();


    const password =
        prompt(
            "Yönetici giriş şifresini yazınız:"
        );


    // ----------------------------------------------------
    // MEVCUT ŞİFRE
    // ----------------------------------------------------

    if (password === "123456y.") {

        if (adminModal) {
            adminModal.classList.remove("hidden");
        }

    }

    else if (password !== null) {

        alert(
            "Hatalı şifre girdiniz!"
        );

    }

}


// ========================================================
// 17. ADMİN PANELİNDEN MEZUN KAYDET
// ========================================================

async function saveGraduateToDatabase() {

    // ----------------------------------------------------
    // FORM ELEMANLARI
    // ----------------------------------------------------

    const nameInput =
        document.getElementById("admName");

    const deptInput =
        document.getElementById("admDept");

    const yearInput =
        document.getElementById("admYear");

    const cityInput =
        document.getElementById("admCity");

    const sektorInput =
        document.getElementById("admSektor");

    const statusInput =
        document.getElementById("admStatus");

    const companyInput =
        document.getElementById("admCompany");

    const jobInput =
        document.getElementById("admJob");


    // ----------------------------------------------------
    // FORM DEĞERLERİNİ AL
    // ----------------------------------------------------

    const name =
        nameInput
            ? nameInput.value.trim()
            : "";


    const dept =
        deptInput
            ? deptInput.value.trim()
            : "";


    const year =
        yearInput
            ? parseInt(
                yearInput.value.trim(),
                10
            )
            : NaN;


    const city =
        cityInput
            ? cityInput.value.trim()
            : "";


    const sektor =
        sektorInput
            ? sektorInput.value.trim()
            : "";


    const status =
        statusInput
            ? statusInput.value.trim()
            : "";


    const company =
        companyInput
            ? companyInput.value.trim()
            : "";


    const job =
        jobInput
            ? jobInput.value.trim()
            : "";


    // ----------------------------------------------------
    // ZORUNLU ALAN KONTROLÜ
    // ----------------------------------------------------

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
            "Lütfen zorunlu alanların (*) tümünü doldurunuz!"
        );

        return;

    }


    // ----------------------------------------------------
    // YIL KONTROLÜ
    // ----------------------------------------------------

    if (
        Number.isNaN(year) ||
        year < 1900 ||
        year > 2100
    ) {

        alert(
            "Lütfen geçerli bir mezuniyet yılı giriniz."
        );

        return;

    }


    try {

        // ------------------------------------------------
        // BUTONU KİLİTLE
        // ------------------------------------------------

        if (btnSaveToDatabase) {

            btnSaveToDatabase.disabled = true;

            btnSaveToDatabase.textContent =
                "☁️ Buluta Kaydediliyor...";

        }


        // ------------------------------------------------
        // SUPABASE INSERT
        // ------------------------------------------------

        const { data, error } =
            await supabase
                .from("mezunlar")
                .insert([

                    {
                        ad: name,
                        bolum: dept,
                        yil: year,
                        sehir: city,
                        sektor: sektor,
                        durum: status,
                        kurum: company,
                        unvan: job
                    }

                ])
                .select();


        if (error) {
            throw error;
        }


        console.log(
            "Yeni mezun kaydı:",
            data
        );


        // ------------------------------------------------
        // BAŞARILI MESAJ
        // ------------------------------------------------

        alert(
            "Harika! Yeni mezun kaydı bulut veritabanına başarıyla eklendi."
        );


        // ------------------------------------------------
        // FORMU TEMİZLE
        // ------------------------------------------------

        clearAdminForm();


        // ------------------------------------------------
        // ADMİN MODALINI KAPAT
        // ------------------------------------------------

        if (adminModal) {
            adminModal.classList.add("hidden");
        }


        // ------------------------------------------------
        // VERİLERİ YENİDEN ÇEK
        // ------------------------------------------------

        await fetchGraduatesFromDatabase();


    } catch (error) {

        console.error(
            "Kayıt esnasında hata oluştu:",
            error
        );


        alert(
            "Veritabanına kaydedilirken bir hata oluştu:\n\n" +
            error.message
        );


    } finally {

        // ------------------------------------------------
        // BUTONU TEKRAR AKTİF ET
        // ------------------------------------------------

        if (btnSaveToDatabase) {

            btnSaveToDatabase.disabled = false;

            btnSaveToDatabase.textContent =
                "💾 Veritabanına Doğrudan Kaydet (Kalıcı)";

        }

    }

}


// ========================================================
// 18. ADMİN FORMUNU TEMİZLE
// ========================================================

function clearAdminForm() {

    const fields = [

        "admName",
        "admYear",
        "admCity",
        "admSektor",
        "admCompany",
        "admJob"

    ];


    fields.forEach((id) => {

        const element =
            document.getElementById(id);


        if (element) {
            element.value = "";
        }

    });


    // Select alanlarını sıfırla

    const dept =
        document.getElementById("admDept");


    if (dept) {
        dept.value = "";
    }


    const status =
        document.getElementById("admStatus");


    if (status) {
        status.value = "";
    }

}


// ========================================================
// 19. TÜRKÇE KARAKTER DESTEKLİ NORMALİZASYON
// ========================================================

function normalizeText(value) {

    if (value === null || value === undefined) {
        return "";
    }


    return String(value)
        .toLocaleLowerCase("tr-TR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

}


// ========================================================
// 20. GÜVENLİ HTML ÇIKIŞI
// ========================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ========================================================
// 21. GELİŞMİŞ HATA YAKALAMA
// ========================================================

window.addEventListener(
    "error",
    (event) => {

        console.error(
            "Uygulama hatası:",
            event.error || event.message
        );

    }
);


// ========================================================
// 22. SUPABASE BAĞLANTI KONTROLÜ
// ========================================================

console.log(
    "Mezun Portalı JavaScript başarıyla yüklendi."
);

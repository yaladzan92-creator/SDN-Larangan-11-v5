const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
}[ch]));

function getClient() {
  const client = window.SDN11?.client;
  if (!client) {
    const msg = window.SDN11?.error || "Koneksi Supabase belum siap. Periksa koneksi internet lalu muat ulang halaman.";
    throw new Error(msg);
  }
  return client;
}

let cache = {
  rombel: [],
  eskul: [],
  activity: [],
  program: [],
  news: [],
  achievement: [],
  gallery: [],
  document: [],
  schedule: [],
  staging: [],
  sources: [],
  staff: [],
  complaints: []
};
let profile = {};

function applyAdminBranding(profileData = null) {
  const defaults = window.SDN_SITE_DEFAULTS || {};
  const schoolName = profileData?.name || defaults.schoolName || "Sekolah";
  const brandCode = defaults.adminBrandCode || defaults.schoolShortName || "ADM";

  document.title = `Admin | ${schoolName}`;
  if ($("adminBrandName")) $("adminBrandName").textContent = schoolName;
  if ($("adminBrandMark")) $("adminBrandMark").textContent = brandCode;
  if ($("loginBrandMark")) $("loginBrandMark").textContent = brandCode;
  if ($("loginTitle")) $("loginTitle").textContent = `Portal Admin ${schoolName}`;
}

// --- NOTIFICATION & FEEDBACK SYSTEM ---
function notify(message, type = "info", title = "") {
  let container = $("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️"
  };

  const defaultTitles = {
    success: "Berhasil",
    error: "Gagal",
    warning: "Peringatan",
    info: "Informasi"
  };

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "alert");
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || "ℹ️"}</span>
    <div class="toast-body">
      <div class="toast-title">${esc(title || defaultTitles[type] || "Pemberitahuan")}</div>
      <div class="toast-msg">${esc(message)}</div>
    </div>
    <button type="button" class="toast-close" aria-label="Tutup">×</button>
  `;

  const closeBtn = toast.querySelector(".toast-close");
  const removeToast = () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 250);
  };
  if (closeBtn) closeBtn.onclick = removeToast;

  container.appendChild(toast);

  const duration = type === "error" ? 8500 : type === "warning" ? 6000 : 4000;
  const timer = setTimeout(removeToast, duration);
  toast.addEventListener("mouseenter", () => clearTimeout(timer));
}
window.notify = notify;

function setButtonState(btn, state, normalText = "Simpan Perubahan") {
  if (!btn) return;
  btn.classList.remove("btn-loading", "btn-clean", "btn-dirty", "btn-success", "btn-error");
  if (state === "loading") {
    btn.disabled = true;
    btn.textContent = "Menyimpan...";
    btn.classList.add("btn-loading");
  } else if (state === "clean") {
    btn.disabled = true;
    btn.textContent = "Tidak Ada Perubahan";
    btn.classList.add("btn-clean");
  } else if (state === "dirty") {
    btn.disabled = false;
    btn.textContent = "Simpan Perubahan";
    btn.classList.add("btn-dirty");
  } else if (state === "success") {
    btn.disabled = false;
    btn.textContent = "✓ Tersimpan";
    btn.classList.add("btn-success");
  } else if (state === "error") {
    btn.disabled = false;
    btn.textContent = "Gagal — Coba Lagi";
    btn.classList.add("btn-error");
  } else {
    btn.disabled = false;
    btn.textContent = normalText;
  }
}

function showModalMsg(text, type = "error") {
  const el = $("modalMsg");
  if (!el) return;
  el.className = `modal-msg msg show ${type}`;
  el.textContent = text;
}

function clearModalMsg() {
  const el = $("modalMsg");
  if (!el) return;
  el.className = "modal-msg msg";
  el.textContent = "";
}

function setProfileInlineStatus(text, type = "") {
  const statusEl = $("saveProfileInlineStatus");
  const msgEl = $("profileMsg");
  if (statusEl) {
    statusEl.className = "save-inline-status" + (type ? ` show status-${type}` : "");
    statusEl.textContent = text;
  }
  if (msgEl) {
    msgEl.className = "msg" + (type ? ` ${type}` : "");
    msgEl.textContent = text;
  }
}

// --- FIELD VALIDATION & NORMALIZATION ---
function normalizeSocialUrl(url, platform = "") {
  if (!url) return null;
  let val = String(url).trim();
  if (!val) return null;

  const lower = val.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    throw new Error(`URL ${platform} menggunakan protokol berbahaya dan tidak diizinkan.`);
  }

  if (val.startsWith("@")) {
    if (platform === "Instagram") val = `https://instagram.com/${val.slice(1)}`;
    else if (platform === "TikTok") val = `https://tiktok.com/${val}`;
    else if (platform === "YouTube") val = `https://youtube.com/${val}`;
  }

  if (!/^https?:\/\//i.test(val)) {
    val = "https://" + val;
  }

  try {
    const parsed = new URL(val);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error(`URL ${platform} harus menggunakan protokol https:// atau http://.`);
    }
    return parsed.href;
  } catch (err) {
    throw new Error(`Format URL ${platform} tidak valid. Contoh: https://${platform.toLowerCase().replace(/\s+/g, "")}.com/...`);
  }
}

function validateEmail(email) {
  if (!email) return null;
  const val = String(email).trim();
  if (!val) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
    throw new Error("Format alamat email sekolah tidak valid (contoh: info@sekolah.sch.id).");
  }
  return val;
}

function validateNpsn(npsn) {
  if (!npsn) return null;
  const val = String(npsn).trim();
  if (!val) return null;
  if (!/^\d{8}$/.test(val)) {
    throw new Error("NPSN harus berupa 8 digit angka.");
  }
  return val;
}

// --- DIRTY STATE TRACKING FOR MENU VISIBILITY ---
let initialMenuVisibilitySnapshot = "";
const MENU_VIS_KEYS = ["profile", "staff", "programs", "news", "achievements", "gallery", "complaints", "contact", "more", "rombel", "spmb"];
const DEFAULT_MENU_VISIBILITY = { profile: true, staff: true, programs: true, news: true, achievements: true, gallery: true, complaints: true, contact: true, more: true, rombel: true, spmb: true };

const MENU_VIS_ITEMS = [
  { key: "profile", label: "Profil Sekolah", desc: "Mengatur halaman Profil Sekolah, Visi-Misi, dan tombol Kenali Sekolah." },
  { key: "staff", label: "Pendidik & Tenaga Kependidikan", desc: "Mengatur bagian Pendidik, Guru, dan Pengawas Sekolah." },
  { key: "programs", label: "Program Sekolah", desc: "Mengatur bagian daftar Program Sekolah unggulan." },
  { key: "news", label: "Berita", desc: "Mengatur bagian berita dan artikel terbaru sekolah." },
  { key: "achievements", label: "Prestasi", desc: "Mengatur bagian daftar Prestasi dan penghargaan sekolah." },
  { key: "gallery", label: "Galeri", desc: "Mengatur dokumentasi foto kegiatan sekolah." },
  { key: "complaints", label: "Pengaduan", desc: "Mengatur formulir pengaduan masyarakat dan wali murid." },
  { key: "contact", label: "Kontak", desc: "Mengatur informasi kontak, jam operasional, dan peta lokasi." },
  { key: "more", label: "Informasi Lainnya", desc: "Mengatur rombel, eskul, jadwal sekolah, dan dokumen publik." },
  { key: "rombel", label: "Rombongan Belajar", desc: "Mengatur tampilan data rombongan belajar pada bagian Informasi Lainnya." },
  { key: "spmb", label: "Informasi SPMB", desc: "Mengatur bagian promosi Penerimaan Murid Baru." }
];

function getMenuVisibilityFormData() {
  const data = {};
  MENU_VIS_KEYS.forEach(key => {
    const el = $(`vis_${key}`);
    data[key] = el ? el.checked : true;
  });
  return data;
}

function checkMenuVisibilityDirty() {
  const currentSnapshot = JSON.stringify(getMenuVisibilityFormData());
  const isDirty = currentSnapshot !== initialMenuVisibilitySnapshot;
  const btn = $("saveMenuVisibilityBtn");
  if (!btn) return;
  if (btn.classList.contains("btn-loading")) return;

  if (isDirty) {
    setButtonState(btn, "dirty", "Simpan Pengaturan Tampilan");
  } else {
    setButtonState(btn, "clean", "Tidak Ada Perubahan");
  }
}

function renderMenuVisibility() {
  const grid = $("visibilityGrid");
  if (!grid) return;

  const rawVisibility = (profile && typeof profile.menu_visibility === "object" && profile.menu_visibility !== null)
    ? profile.menu_visibility
    : {};
  const visibility = {
    ...DEFAULT_MENU_VISIBILITY,
    ...rawVisibility
  };

  grid.innerHTML = MENU_VIS_ITEMS.map(item => {
    const isChecked = visibility[item.key] !== false;
    return `
      <div class="visibility-item ${isChecked ? "" : "is-off"}" id="vis_container_${item.key}">
        <div class="visibility-info">
          <div class="visibility-info-head">
            <span class="visibility-title">${esc(item.label)}</span>
            <span class="visibility-badge ${isChecked ? "active" : "hidden-state"}" id="vis_badge_${item.key}">
              ${isChecked ? "Aktif" : "Disembunyikan"}
            </span>
          </div>
          <p class="visibility-desc">${esc(item.desc)}</p>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="vis_${item.key}" ${isChecked ? "checked" : ""} onchange="onMenuVisibilityToggle('${item.key}')">
          <span class="toggle-slider"></span>
        </label>
      </div>
    `;
  }).join("");

  initialMenuVisibilitySnapshot = JSON.stringify(getMenuVisibilityFormData());
  checkMenuVisibilityDirty();
}

window.onMenuVisibilityToggle = function(key) {
  const input = $(`vis_${key}`);
  const container = $(`vis_container_${key}`);
  const badge = $(`vis_badge_${key}`);
  if (input && container && badge) {
    if (input.checked) {
      container.classList.remove("is-off");
      badge.textContent = "Aktif";
      badge.className = "visibility-badge active";
    } else {
      container.classList.add("is-off");
      badge.textContent = "Disembunyikan";
      badge.className = "visibility-badge hidden-state";
    }
  }
  checkMenuVisibilityDirty();
};

// --- DIRTY STATE TRACKING FOR DATA SEKOLAH ---
let initialProfileSnapshot = "";

const PROFILE_FIELD_IDS = [
  "schoolName", "schoolNpsn", "schoolStatus", "schoolLevel",
  "schoolAccreditation", "schoolPrincipal", "schoolStudents", "schoolStaff",
  "schoolAddress", "schoolCity", "schoolPhone", "schoolEmail",
  "schoolInstagram", "schoolFacebook", "schoolYoutube", "schoolTiktok",
  "schoolWhatsapp", "schoolMaps", "schoolProfileTitle", "schoolDescription",
  "schoolVision", "schoolMission", "schoolHeroSubtitle", "schoolSpmbTitle",
  "schoolSpmbUrl", "schoolSpmbDescription"
];

function getProfileFormData() {
  const data = {};
  for (const id of PROFILE_FIELD_IDS) {
    data[id] = $(id)?.value?.trim() || "";
  }
  return data;
}

function checkProfileDirty() {
  const currentSnapshot = JSON.stringify(getProfileFormData());
  const isDirty = currentSnapshot !== initialProfileSnapshot;
  const btn = $("saveProfileBtn");
  if (!btn) return;
  if (btn.classList.contains("btn-loading")) return;

  if (isDirty) {
    setButtonState(btn, "dirty", "Simpan Perubahan");
  } else {
    setButtonState(btn, "clean", "Tidak Ada Perubahan");
  }
}

let profileListenersInitialized = false;
function initProfileDirtyTracking() {
  if (profileListenersInitialized) return;
  profileListenersInitialized = true;
  PROFILE_FIELD_IDS.forEach(id => {
    const el = $(id);
    if (el) {
      el.addEventListener("input", checkProfileDirty);
      el.addEventListener("change", checkProfileDirty);
    }
  });
}

const defs = {
  staff: {
    table: "staff_profiles",
    title: "Profil Pendidik & Tenaga Kependidikan",
    fields: [
      ["name", "Nama Lengkap & Gelar *", "text"],
      ["role", "Kategori / Jabatan *", "role_select"],
      ["subject", "Bidang / Mapel (contoh: Guru Kelas IV-A / PJOK / Pembina)", "text"],
      ["photo_url", "URL Foto (Otomatis terisi jika upload file)", "text"],
      ["photo_file", "Upload Foto Profil", "file"],
      ["quote", "Kutipan / Pesan Pribadi (Opsional)", "textarea"],
      ["bio", "Deskripsi Singkat / Profil", "textarea"],
      ["sort_order", "Nomor Urut Tampilan (Angka lebih kecil tampil di awal)", "number"],
      ["published", "Tampilkan di Website Publik", "checkbox"]
    ]
  },
  rombel: {
    table: "class_groups",
    title: "Rombel",
    fields: [
      ["name", "Nama Rombel", "text"],
      ["grade", "Tingkat", "number"],
      ["academic_year", "Tahun Ajaran", "text"],
      ["semester", "Semester", "text"],
      ["student_count", "Jumlah Siswa", "number"],
      ["male_count", "Laki-laki", "number"],
      ["female_count", "Perempuan", "number"],
      ["homeroom_teacher", "Wali Kelas", "text"],
      ["room", "Ruang", "text"],
      ["source_note", "Sumber Data", "text"],
      ["published", "Tampilkan", "checkbox"]
    ]
  },
  eskul: {
    table: "extracurriculars",
    title: "Ekstrakurikuler",
    fields: [
      ["name", "Nama Eskul", "text"],
      ["day", "Hari", "text"],
      ["start_time", "Jam Mulai", "time"],
      ["end_time", "Jam Selesai", "time"],
      ["location", "Lokasi", "text"],
      ["coach", "Pembina", "text"],
      ["trainer", "Pelatih", "text"],
      ["participant_grades", "Kelas Peserta", "text"],
      ["capacity", "Kuota", "number"],
      ["description", "Deskripsi", "textarea"],
      ["image_url", "URL Foto", "text"],
      ["image_file", "Upload Foto", "file"],
      ["active", "Aktif", "checkbox"]
    ]
  },
  activity: {
    table: "extracurricular_activities",
    title: "Kegiatan Eskul",
    fields: [
      ["extracurricular_id", "Eskul", "eskul"],
      ["title", "Judul", "text"],
      ["activity_date", "Tanggal", "date"],
      ["description", "Deskripsi", "textarea"],
      ["image_url", "URL Foto", "text"],
      ["image_file", "Upload Foto", "file"],
      ["published", "Publish", "checkbox"]
    ]
  },
  program: {
    table: "programs",
    title: "Program Sekolah",
    fields: [
      ["title", "Nama Program", "text"],
      ["description", "Deskripsi", "textarea"],
      ["image_url", "URL Foto", "text"],
      ["image_file", "Upload Foto", "file"],
      ["sort_order", "Urutan", "number"],
      ["published", "Tampilkan", "checkbox"]
    ]
  },
  news: {
    table: "news",
    title: "Berita",
    fields: [
      ["title", "Judul", "text"],
      ["published_at", "Tanggal", "date"],
      ["excerpt", "Ringkasan", "textarea"],
      ["content", "Isi", "textarea"],
      ["image_url", "URL Foto", "text"],
      ["image_file", "Upload Foto", "file"],
      ["published", "Publish", "checkbox"]
    ]
  },
  achievement: {
    table: "achievements",
    title: "Prestasi",
    fields: [
      ["title", "Judul", "text"],
      ["category", "Kategori", "text"],
      ["level", "Tingkat", "text"],
      ["year", "Tahun", "number"],
      ["description", "Deskripsi", "textarea"],
      ["image_url", "URL Foto", "text"],
      ["image_file", "Upload Foto", "file"],
      ["published", "Publish", "checkbox"]
    ]
  },
  gallery: {
    table: "gallery",
    title: "Galeri",
    fields: [
      ["title", "Judul Foto", "text"],
      ["image_url", "URL Foto", "text"],
      ["image_file", "Upload Foto", "file"],
      ["published", "Publish", "checkbox"]
    ]
  },
  document: {
    table: "documents",
    title: "Dokumen",
    fields: [
      ["title", "Nama Dokumen", "text"],
      ["category", "Kategori", "text"],
      ["description", "Deskripsi", "textarea"],
      ["file_url", "URL Dokumen", "text"],
      ["file_upload", "Upload File", "file"],
      ["published", "Publish", "checkbox"]
    ]
  },
  schedule: {
    table: "school_schedules",
    title: "Jadwal",
    fields: [
      ["day", "Hari", "text"],
      ["title", "Kegiatan/Judul", "text"],
      ["time_text", "Waktu", "text"],
      ["class_name", "Kelas", "text"],
      ["description", "Keterangan", "textarea"],
      ["sort_order", "Urutan", "number"],
      ["published", "Publish", "checkbox"]
    ]
  }
};

async function authCheck() {
  const loginMsg = $("loginMsg");
  if (!window.SDN11?.configured || !window.SDN11?.client) {
    showLogin();
    if (loginMsg) {
      loginMsg.textContent = window.SDN11?.error || "Koneksi Supabase belum siap. Periksa koneksi internet lalu muat ulang halaman.";
    }
    return;
  }

  try {
    const client = getClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (data?.session) {
      showApp();
    } else {
      showLogin();
    }
  } catch (err) {
    console.error("[SDN11 Admin] authCheck error:", err);
    showLogin();
    if (loginMsg) {
      loginMsg.textContent = err.message || "Gagal memeriksa sesi login.";
    }
  }
}

function showApp() {
  const loginView = $("loginView");
  const appView = $("appView");
  if (loginView) loginView.classList.add("hidden");
  if (appView) appView.classList.remove("hidden");
  loadAll().catch(err => {
    console.error("[SDN11 Admin] loadAll error in showApp:", err);
  });
}

function showLogin() {
  const loginView = $("loginView");
  const appView = $("appView");
  if (loginView) loginView.classList.remove("hidden");
  if (appView) appView.classList.add("hidden");
  applyAdminBranding();
}

const loginForm = $("loginForm");
if (loginForm) {
  loginForm.onsubmit = async e => {
    e.preventDefault();
    const loginMsg = $("loginMsg");
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    let client;
    try {
      client = getClient();
    } catch (err) {
      if (loginMsg) loginMsg.textContent = err.message;
      return;
    }

    const email = $("email")?.value.trim() || "";
    const password = $("password")?.value || "";

    if (!email || !password) {
      if (loginMsg) loginMsg.textContent = "Email dan password wajib diisi.";
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (loginMsg) loginMsg.textContent = "Memeriksa…";

    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        if (loginMsg) loginMsg.textContent = error.message;
        return;
      }
      if (loginMsg) loginMsg.textContent = "";
      showApp();
    } catch (err) {
      console.error("[SDN11 Admin] Login exception:", err);
      if (loginMsg) loginMsg.textContent = err.message || "Terjadi kesalahan saat masuk.";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  };
}

const logoutBtn = $("logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    try {
      const client = getClient();
      await client.auth.signOut();
    } catch (err) {
      console.warn("[SDN11 Admin] Sign out warning:", err);
    } finally {
      showLogin();
    }
  };
}

async function upload(file, folder, isDocument = false) {
  if (!file || !file.size) {
    throw new Error("File tidak valid atau kosong.");
  }

  const client = getClient();
  const bucket = window.SDN11?.bucket || "school-media";

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
  const MAX_DOC_SIZE = 10 * 1024 * 1024;  // 10 MB

  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

  const ALLOWED_DOC_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ];
  const ALLOWED_DOC_EXTS = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];

  const REJECTED_EXTS = [
    ".exe", ".js", ".mjs", ".html", ".htm", ".zip", ".rar", ".7z",
    ".bat", ".cmd", ".sh", ".php", ".py", ".vbs", ".scr", ".com", ".dll", ".apk", ".svg"
  ];

  const fileName = file.name || "file";
  const fileExt = fileName.includes(".") ? "." + fileName.split(".").pop().toLowerCase() : "";

  // Reject executable or dangerous file extensions explicitly
  if (REJECTED_EXTS.includes(fileExt) && !isDocument) {
    throw new Error(`File dengan ekstensi '${fileExt}' dilarang demi keamanan sistem.`);
  }

  if (isDocument) {
    if (file.size > MAX_DOC_SIZE) {
      throw new Error("Ukuran dokumen melebihi batas maksimal 10 MB.");
    }
    if (file.type) {
      if (!ALLOWED_DOC_TYPES.includes(file.type.toLowerCase())) {
        throw new Error(`Format dokumen tidak didukung (MIME: ${file.type}). Harap gunakan PDF, DOC, DOCX, XLS, atau XLSX.`);
      }
    } else {
      if (!ALLOWED_DOC_EXTS.includes(fileExt)) {
        throw new Error("Format file dokumen tidak didukung. Harap gunakan file dengan ekstensi .pdf, .doc, .docx, .xls, atau .xlsx.");
      }
    }
  } else {
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error("Ukuran gambar melebihi batas maksimal 5 MB.");
    }
    if (file.type) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
        throw new Error(`Format file gambar tidak didukung (MIME: ${file.type}). Gunakan format JPG, PNG, atau WebP.`);
      }
    } else {
      if (!ALLOWED_IMAGE_EXTS.includes(fileExt)) {
        throw new Error("Format file gambar tidak didukung. Gunakan file dengan ekstensi .jpg, .jpeg, .png, atau .webp.");
      }
    }
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${folder}/${Date.now()}-${safeName}`;

  const { error } = await client.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined
    });

  if (error) throw error;

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Public URL file gagal dibuat oleh Supabase Storage.");
  }
  return data.publicUrl;
}

async function loadAll() {
  let client;
  try {
    client = getClient();
  } catch (err) {
    console.error("[SDN11 Admin] loadAll gagal:", err.message);
    notify(err.message, "error", "Koneksi Bermasalah");
    return;
  }

  try {
    const [
      pRes,
      rombelRes,
      eskulRes,
      activityRes,
      programRes,
      newsRes,
      achievementRes,
      galleryRes,
      documentRes,
      scheduleRes,
      stagingRes,
      sourcesRes,
      staffRes,
      complaintsRes
    ] = await Promise.all([
      client.from("school_profile").select("*").eq("id", 1).maybeSingle(),
      client.from("class_groups").select("*").order("grade", { ascending: true }),
      client.from("extracurriculars").select("*").order("name", { ascending: true }),
      client.from("extracurricular_activities").select("*").order("activity_date", { ascending: false }),
      client.from("programs").select("*").order("sort_order", { ascending: true }),
      client.from("news").select("*").order("published_at", { ascending: false }),
      client.from("achievements").select("*").order("year", { ascending: false }),
      client.from("gallery").select("*").order("created_at", { ascending: false }),
      client.from("documents").select("*").order("created_at", { ascending: false }),
      client.from("school_schedules").select("*").order("sort_order", { ascending: true }),
      client.from("sync_staging").select("*").order("created_at", { ascending: false }),
      client.from("sync_sources").select("*").order("created_at", { ascending: false }),
      client.from("staff_profiles").select("*").order("sort_order", { ascending: true }),
      client.from("complaints").select("*").order("created_at", { ascending: false })
    ]);

    // Error audit per module
    const moduleChecks = [
      { name: "Data Sekolah", res: pRes },
      { name: "Rombel", res: rombelRes },
      { name: "Ekstrakurikuler", res: eskulRes },
      { name: "Kegiatan Eskul", res: activityRes },
      { name: "Program", res: programRes },
      { name: "Berita", res: newsRes },
      { name: "Prestasi", res: achievementRes },
      { name: "Galeri", res: galleryRes },
      { name: "Dokumen", res: documentRes },
      { name: "Jadwal", res: scheduleRes },
      { name: "Data Staging", res: stagingRes },
      { name: "Sumber Sinkronisasi", res: sourcesRes },
      { name: "Profil Pendidik", res: staffRes },
      { name: "Pengaduan", res: complaintsRes }
    ];

    const failedModules = [];
    for (const m of moduleChecks) {
      if (m.res?.error) {
        console.error(`[SDN11 Admin] Modul ${m.name} gagal dimuat:`, m.res.error.message);
        failedModules.push(m.name);
      }
    }

    if (pRes?.data) {
      profile = pRes.data;
    }

    cache.rombel = rombelRes?.data || [];
    cache.eskul = eskulRes?.data || [];
    cache.activity = activityRes?.data || [];
    cache.program = programRes?.data || [];
    cache.news = newsRes?.data || [];
    cache.achievement = achievementRes?.data || [];
    cache.gallery = galleryRes?.data || [];
    cache.document = documentRes?.data || [];
    cache.schedule = scheduleRes?.data || [];
    cache.staging = stagingRes?.data || [];
    cache.sources = sourcesRes?.data || [];
    cache.staff = staffRes?.data || [];
    cache.complaints = complaintsRes?.data || [];

    fillProfile();
    renderAll();

    if (failedModules.length > 0) {
      notify(
        `Sebagian data gagal dimuat: ${failedModules.join(", ")}. Modul yang berhasil tetap ditampilkan.`,
        "warning",
        "Pemuatan Sebagian"
      );
    }
  } catch (err) {
    console.error("[SDN11 Admin] Error saat memuat data:", err);
    notify("Terjadi kesalahan saat memuat data aplikasi.", "error");
  }
}

function fillProfile() {
  const m = {
    schoolName: "name",
    schoolNpsn: "npsn",
    schoolStatus: "status",
    schoolLevel: "level",
    schoolAccreditation: "accreditation",
    schoolPrincipal: "principal",
    schoolStudents: "students",
    schoolStaff: "staff",
    schoolAddress: "address",
    schoolCity: "city",
    schoolPhone: "phone",
    schoolEmail: "email",
    schoolInstagram: "instagram_url",
    schoolFacebook: "facebook_url",
    schoolYoutube: "youtube_url",
    schoolTiktok: "tiktok_url",
    schoolWhatsapp: "whatsapp_url",
    schoolMaps: "maps_url",
    schoolProfileTitle: "profile_title",
    schoolDescription: "description",
    schoolVision: "vision",
    schoolHeroSubtitle: "hero_subtitle",
    schoolSpmbTitle: "spmb_title",
    schoolSpmbUrl: "spmb_url",
    schoolSpmbDescription: "spmb_description"
  };

  for (const [id, k] of Object.entries(m)) {
    const el = $(id);
    if (el) el.value = profile[k] ?? "";
  }

  // Dynamic branding
  applyAdminBranding(profile);

  const missionEl = $("schoolMission");
  if (missionEl) {
    missionEl.value = Array.isArray(profile.mission) ? profile.mission.join("\n") : "";
  }

  const logoPreview = $("schoolLogoPreview");
  if (logoPreview) {
    const defaults = window.SDN_SITE_DEFAULTS || {};
    const defaultLogo = defaults.logoPath ? ("../" + defaults.logoPath) : "../assets/logo-sekolah.jpeg";
    logoPreview.src = profile.logo_url || defaultLogo;
  }

  const heroPreview = $("schoolHeroPreview");
  if (heroPreview) {
    heroPreview.src = profile.hero_image_url || "../assets/school-hero-placeholder.svg";
  }

  // Record initial snapshot for dirty state detection
  initialProfileSnapshot = JSON.stringify(getProfileFormData());
  initProfileDirtyTracking();
  checkProfileDirty();

  // Render menu & page visibility settings grid
  renderMenuVisibility();
}

const saveProfileBtn = $("saveProfileBtn");
if (saveProfileBtn) {
  saveProfileBtn.onclick = async () => {
    let client;
    try {
      client = getClient();
    } catch (err) {
      setProfileInlineStatus(err.message, "error");
      notify(err.message, "error", "Koneksi Supabase");
      return;
    }

    // Input validation & URL normalization
    let npsnVal, emailVal, igVal, fbVal, ytVal, ttVal, waVal, mapsVal, spmbUrlVal;
    try {
      npsnVal = validateNpsn($("schoolNpsn")?.value);
      emailVal = validateEmail($("schoolEmail")?.value);
      igVal = normalizeSocialUrl($("schoolInstagram")?.value, "Instagram");
      fbVal = normalizeSocialUrl($("schoolFacebook")?.value, "Facebook");
      ytVal = normalizeSocialUrl($("schoolYoutube")?.value, "YouTube");
      ttVal = normalizeSocialUrl($("schoolTiktok")?.value, "TikTok");
      waVal = normalizeSocialUrl($("schoolWhatsapp")?.value, "WhatsApp");
      mapsVal = normalizeSocialUrl($("schoolMaps")?.value, "Google Maps");
      spmbUrlVal = normalizeSocialUrl($("schoolSpmbUrl")?.value, "SPMB");
    } catch (valErr) {
      setProfileInlineStatus(valErr.message, "warning");
      notify(valErr.message, "warning", "Validasi Input");
      return;
    }

    const studentsNum = +$("schoolStudents")?.value;
    if ($("schoolStudents")?.value && (isNaN(studentsNum) || studentsNum < 0)) {
      setProfileInlineStatus("Jumlah siswa tidak boleh negatif.", "warning");
      notify("Jumlah siswa tidak boleh negatif.", "warning", "Validasi Input");
      return;
    }

    const staffNum = +$("schoolStaff")?.value;
    if ($("schoolStaff")?.value && (isNaN(staffNum) || staffNum < 0)) {
      setProfileInlineStatus("Jumlah guru & tendik tidak boleh negatif.", "warning");
      notify("Jumlah guru & tendik tidak boleh negatif.", "warning", "Validasi Input");
      return;
    }

    const payload = {
      id: 1,
      name: $("schoolName")?.value.trim() || "",
      npsn: npsnVal,
      status: $("schoolStatus")?.value.trim() || "",
      level: $("schoolLevel")?.value.trim() || "",
      accreditation: $("schoolAccreditation")?.value.trim() || "",
      principal: $("schoolPrincipal")?.value.trim() || "",
      students: $("schoolStudents")?.value ? studentsNum : null,
      staff: $("schoolStaff")?.value ? staffNum : null,
      address: $("schoolAddress")?.value.trim() || "",
      city: $("schoolCity")?.value.trim() || "",
      phone: $("schoolPhone")?.value.trim() || "",
      email: emailVal,
      instagram_url: igVal,
      facebook_url: fbVal,
      youtube_url: ytVal,
      tiktok_url: ttVal,
      whatsapp_url: waVal,
      maps_url: mapsVal || "",
      profile_title: $("schoolProfileTitle")?.value.trim() || "",
      description: $("schoolDescription")?.value.trim() || "",
      vision: $("schoolVision")?.value.trim() || "",
      mission: ($("schoolMission")?.value || "")
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean),
      hero_subtitle: $("schoolHeroSubtitle")?.value.trim() || "",
      spmb_title: $("schoolSpmbTitle")?.value.trim() || "",
      spmb_url: spmbUrlVal || "",
      spmb_description: $("schoolSpmbDescription")?.value.trim() || "",
      logo_url: profile.logo_url || null,
      hero_image_url: profile.hero_image_url || null,
      updated_at: new Date().toISOString()
    };

    setButtonState(saveProfileBtn, "loading");
    setProfileInlineStatus("Menyimpan data sekolah...", "loading");

    try {
      const { error } = await client.from("school_profile").upsert(payload);
      if (error) throw error;

      // Verify After Save: read-back from database
      const { data: verifiedData, error: readErr } = await client
        .from("school_profile")
        .select("*")
        .eq("id", 1)
        .single();

      if (readErr || !verifiedData) {
        console.warn("[SDN11 Admin] Read-back verification warning:", readErr);
        profile = payload;
        setProfileInlineStatus("Data berhasil dikirim tetapi belum dapat diverifikasi.", "warning");
        notify("Data profil berhasil dikirim, namun verifikasi pembacaan ulang gagal.", "warning");
        setButtonState(saveProfileBtn, "success");
        setTimeout(() => checkProfileDirty(), 2500);
      } else {
        profile = verifiedData;
        fillProfile(); // Refreshes form & resets initial snapshot
        setProfileInlineStatus("Data profil berhasil disimpan dan terverifikasi.", "success");
        notify("Data profil sekolah berhasil disimpan dan diperbarui.", "success");
        setButtonState(saveProfileBtn, "success");
        setTimeout(() => {
          setButtonState(saveProfileBtn, "clean");
          setProfileInlineStatus("");
        }, 2500);
      }
      renderAll();
    } catch (err) {
      console.error("[SDN11 Admin] Gagal simpan profil:", err);
      let userFriendlyMsg = "Gagal menyimpan data sekolah: " + (err.message || "Kesalahan tidak dikenal.");
      if (err.message && (err.message.includes("does not exist") || err.message.includes("column") || err.message.includes("schema cache"))) {
        userFriendlyMsg = "Gagal menyimpan: Kolom database belum kompatibel. Jalankan sql/v5_admin_input_compatibility_patch.sql di SQL Editor Supabase.";
      }
      setProfileInlineStatus(userFriendlyMsg, "error");
      notify(userFriendlyMsg, "error", "Gagal Menyimpan");
      setButtonState(saveProfileBtn, "error");
    }
  };
}

const saveMenuVisibilityBtn = $("saveMenuVisibilityBtn");
if (saveMenuVisibilityBtn) {
  saveMenuVisibilityBtn.onclick = async () => {
    let client;
    try {
      client = getClient();
    } catch (err) {
      notify(err.message, "error", "Koneksi Supabase");
      return;
    }

    const payloadVisibility = getMenuVisibilityFormData();

    setButtonState(saveMenuVisibilityBtn, "loading");
    const statusEl = $("saveMenuVisibilityInlineStatus");
    if (statusEl) {
      statusEl.textContent = "Menyimpan pengaturan...";
      statusEl.className = "save-inline-status show status-loading";
    }

    try {
      // Update only the menu_visibility field on school_profile where id = 1
      const { error } = await client
        .from("school_profile")
        .update({
          menu_visibility: payloadVisibility,
          updated_at: new Date().toISOString()
        })
        .eq("id", 1);

      if (error) throw error;

      // Read-back verification
      const { data: verifiedData, error: readErr } = await client
        .from("school_profile")
        .select("menu_visibility")
        .eq("id", 1)
        .single();

      if (readErr || !verifiedData) {
        console.warn("[SDN11 Admin] Read-back verification warning for menu visibility:", readErr);
        profile.menu_visibility = payloadVisibility;
        if (statusEl) {
          statusEl.textContent = "Berhasil dikirim tetapi belum dapat diverifikasi.";
          statusEl.className = "save-inline-status show status-warning";
        }
        notify("Pengaturan berhasil disimpan, namun verifikasi pembacaan ulang gagal.", "warning");
        setButtonState(saveMenuVisibilityBtn, "success");
        setTimeout(() => checkMenuVisibilityDirty(), 2500);
      } else {
        profile.menu_visibility = verifiedData.menu_visibility;
        initialMenuVisibilitySnapshot = JSON.stringify(profile.menu_visibility);
        if (statusEl) {
          statusEl.textContent = "Pengaturan berhasil disimpan.";
          statusEl.className = "save-inline-status show status-success";
        }
        notify("Pengaturan tampilan berhasil disimpan.", "success");
        setButtonState(saveMenuVisibilityBtn, "success");
        setTimeout(() => {
          setButtonState(saveMenuVisibilityBtn, "clean");
          if (statusEl) {
            statusEl.textContent = "";
            statusEl.className = "save-inline-status";
          }
        }, 2500);
      }
    } catch (err) {
      console.error("[SDN11 Admin] Gagal simpan menu visibility:", err);
      const userFriendlyMsg = "Gagal menyimpan pengaturan tampilan: " + (err.message || "Kesalahan tidak dikenal.");
      if (statusEl) {
        statusEl.textContent = userFriendlyMsg;
        statusEl.className = "save-inline-status show status-error";
      }
      notify(userFriendlyMsg, "error", "Gagal Menyimpan");
      setButtonState(saveMenuVisibilityBtn, "error");
    }
  };
}

function renderAll() {
  if ($("kpiStudents")) $("kpiStudents").textContent = profile.students ?? "—";
  if ($("kpiRombel")) $("kpiRombel").textContent = cache.rombel.length;
  if ($("kpiEskul")) $("kpiEskul").textContent = cache.eskul.length;
  if ($("kpiStaging")) $("kpiStaging").textContent = cache.staging.filter(x => x.status === "pending").length;
  if ($("kpiComplaints")) $("kpiComplaints").textContent = cache.complaints.filter(x => x.status === "new").length;
  if ($("kpiStaff")) $("kpiStaff").textContent = cache.staff.length;

  for (const k of Object.keys(defs)) {
    if (k === "staff") {
      renderStaff();
    } else {
      renderTable(k);
    }
  }
  renderComplaints();
  renderStaging();
  renderSources();
}

function renderStaff() {
  const box = $("staffEditor");
  if (!box) return;

  if (!cache.staff?.length) {
    box.innerHTML = '<p class="empty">Belum ada data profil pendidik. Klik “+ Tambah Profil”.</p>';
    return;
  }

  const roleBadges = {
    principal: '<span class="badge-role badge-principal">Kepala Sekolah</span>',
    teacher: '<span class="badge-role badge-teacher">Guru</span>',
    supervisor: '<span class="badge-role badge-supervisor">Pengawas Sekolah</span>'
  };

  const defaultAvatar = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100%" height="100%" fill="#e2e8f0"/>
  <circle cx="50" cy="38" r="18" fill="#94a3b8"/>
  <path d="M18 86c0-18 14-32 32-32s32 14 32 32" fill="#94a3b8"/>
</svg>
`);

  box.innerHTML = `
    <div class="table-wrap">
      <table class="editor-table">
        <thead>
          <tr>
            <th>Pendidik</th>
            <th>Kategori</th>
            <th>Bidang / Mapel</th>
            <th>Urutan</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${cache.staff.map(s => `
            <tr>
              <td>
                <div class="thumb-cell">
                  <img src="${esc(s.photo_url || defaultAvatar)}" alt="${esc(s.name)}" class="thumb-img" onerror="this.src='${defaultAvatar}'">
                  <div>
                    <b>${esc(s.name)}</b>
                    ${s.quote ? `<div style="font-size:11px;color:#71869a;font-style:italic;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">“${esc(s.quote)}”</div>` : ""}
                  </div>
                </div>
              </td>
              <td>${roleBadges[s.role] || esc(s.role)}</td>
              <td>${esc(s.subject || "—")}</td>
              <td>${s.sort_order ?? 0}</td>
              <td>
                ${s.published
                  ? '<span class="badge-published">Tayang</span>'
                  : '<span class="badge-draft">Draft</span>'
                }
              </td>
              <td>
                <div class="editor-actions">
                  <button class="secondary" onclick="togglePublishStaff('${s.id}', ${s.published})">
                    ${s.published ? "Jadikan Draft" : "Tayangkan"}
                  </button>
                  <button class="secondary" onclick="openEditor('staff','${s.id}')">Edit</button>
                  <button class="danger" onclick="deleteItem('staff','${s.id}')">Hapus</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function togglePublishStaff(id, currentStatus) {
  try {
    const client = getClient();
    const { error } = await client
      .from("staff_profiles")
      .update({ published: !currentStatus, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    notify(
      currentStatus ? "Profil pendidik disimpan sebagai draft." : "Profil pendidik berhasil ditayangkan ke website publik.",
      "success"
    );
    await loadAll();
  } catch (err) {
    console.error("[SDN11 Admin] togglePublishStaff error:", err);
    notify("Gagal mengubah status publish: " + (err.message || "Kesalahan tidak dikenal"), "error");
  }
}
window.togglePublishStaff = togglePublishStaff;

function renderTable(type) {
  const d = defs[type];
  const box = $(type + "Editor");
  if (!box || !d) return;

  const fields = d.fields.filter(f => f[2] !== "file").slice(0, 5);
  if (!cache[type]?.length) {
    box.innerHTML = '<p class="empty">Belum ada data. Klik “+ Tambah”.</p>';
    return;
  }

  box.innerHTML = `
    <div class="table-wrap">
      <table class="editor-table">
        <thead>
          <tr>${fields.map(f => `<th>${esc(f[1])}</th>`).join("")}<th>Aksi</th></tr>
        </thead>
        <tbody>
          ${cache[type].map(x => `
            <tr>
              ${fields.map(f => `<td>${esc(displayValue(f, x[f[0]])) }</td>`).join("")}
              <td>
                <div class="editor-actions">
                  <button class="secondary" onclick="openEditor('${type}','${x.id}')">Edit</button>
                  <button class="danger" onclick="deleteItem('${type}','${x.id}')">Hapus</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function displayValue(f, v) {
  if (f[2] === "checkbox") return v ? "Ya" : "Tidak";
  if (f[2] === "eskul") {
    const x = cache.eskul.find(e => e.id === v);
    return x?.name || "-";
  }
  if ((f[0] === "image_url" || f[0] === "photo_url" || f[0] === "file_url") && v) {
    return String(v).length > 30 ? String(v).slice(0, 27) + "…" : String(v);
  }
  return v ?? "-";
}

document.querySelectorAll("[data-add]").forEach(b => {
  b.onclick = () => openEditor(b.dataset.add, null);
});

function openEditor(type, id) {
  const d = defs[type];
  if (!d) return;

  clearModalMsg();
  const item = id ? cache[type].find(x => String(x.id) === String(id)) : {};
  if ($("modalTitle")) $("modalTitle").textContent = (id ? "Edit " : "Tambah ") + d.title;
  if ($("modalForm")) {
    $("modalForm").innerHTML = d.fields.map(f => fieldHTML(f, item[f[0]], type, item)).join("") + `
      <div class="form-actions">
        <button type="button" class="secondary" onclick="closeModal()">Batal</button>
        <button class="primary" type="submit" id="modalSubmitBtn">Simpan</button>
      </div>
    `;
    $("modalForm").onsubmit = e => saveEditor(e, type, id);
  }
  if ($("modal")) $("modal").classList.remove("hidden");
}
window.openEditor = openEditor;

function fieldHTML(f, v, type, item = {}) {
  const [name, label, kind] = f;
  if (kind === "checkbox") {
    return `<label class="full"><input type="checkbox" name="${name}" ${v !== false ? "checked" : ""}> ${esc(label)}</label>`;
  }
  if (kind === "textarea") {
    return `<label class="full">${esc(label)}<textarea name="${name}">${esc(v || "")}</textarea></label>`;
  }
  if (kind === "role_select") {
    return `
      <label class="full">${esc(label)}
        <select name="${name}" required>
          <option value="principal" ${v === "principal" ? "selected" : ""}>Kepala Sekolah</option>
          <option value="teacher" ${v === "teacher" || !v ? "selected" : ""}>Guru</option>
          <option value="supervisor" ${v === "supervisor" ? "selected" : ""}>Pengawas Sekolah</option>
        </select>
      </label>
    `;
  }
  if (kind === "file") {
    const isDoc = name === "file_upload";
    const existingPhoto = item.photo_url || item.image_url || null;
    const folderMap = {
      program: "programs",
      achievement: "achievements",
      news: "news",
      gallery: "gallery",
      activity: "activities",
      eskul: "extracurriculars",
      staff: "staff"
    };
    const folderName = folderMap[type] || "media";
    return `
      <label class="full">${esc(label)}
        <input type="file" name="${name}" accept="${isDoc ? ".pdf,.doc,.docx,.xls,.xlsx" : "image/jpeg,image/png,image/webp"}">
        <span class="file-note">${isDoc ? "Format dokumen (PDF, DOC, DOCX, XLS, XLSX) maks 10MB." : `Format JPG, PNG, atau WebP maks 5MB. Disimpan ke folder ${folderName}/ bucket school-media.`}</span>
        ${(!isDoc && existingPhoto) ? `<div class="photo-preview-box"><img src="${esc(existingPhoto)}" alt="Preview" loading="lazy"><small>Foto tersimpan saat ini: ${esc(existingPhoto)}</small></div>` : ""}
      </label>
    `;
  }
  if (kind === "eskul") {
    return `
      <label>${esc(label)}
        <select name="${name}" required>
          <option value="">Pilih Eskul</option>
          ${cache.eskul.map(x => `<option value="${x.id}" ${x.id === v ? "selected" : ""}>${esc(x.name)}</option>`).join("")}
        </select>
      </label>
    `;
  }
  return `
    <label>${esc(label)}
      <input type="${kind}" name="${name}" value="${esc(kind === "date" && v ? String(v).slice(0, 10) : (v ?? ""))}">
    </label>
  `;
}

async function saveEditor(e, type, id) {
  e.preventDefault();
  const d = defs[type];
  if (!d) return;

  let client;
  try {
    client = getClient();
  } catch (err) {
    showModalMsg(err.message, "error");
    notify(err.message, "error", "Koneksi Supabase");
    return;
  }

  const submitBtn = e.target.querySelector('button.primary') || $("modalSubmitBtn");
  const fd = new FormData(e.target);

  // Field validation
  const requiredValidation = {
    staff: [["name", "Nama lengkap & gelar wajib diisi."]],
    rombel: [["name", "Nama rombel wajib diisi."]],
    eskul: [["name", "Nama ekstrakurikuler wajib diisi."]],
    activity: [
      ["extracurricular_id", "Ekstrakurikuler wajib dipilih."],
      ["title", "Judul kegiatan wajib diisi."],
      ["activity_date", "Tanggal kegiatan wajib diisi."]
    ],
    program: [["title", "Nama program sekolah wajib diisi."]],
    news: [["title", "Judul berita wajib diisi."]],
    achievement: [["title", "Judul prestasi wajib diisi."]],
    gallery: [["title", "Judul foto galeri wajib diisi."]],
    document: [["title", "Nama dokumen wajib diisi."]],
    schedule: [["title", "Judul / kegiatan jadwal sekolah wajib diisi."]]
  };

  const rules = requiredValidation[type] || [];
  for (const [fName, fMsg] of rules) {
    const rawVal = fd.get(fName);
    if (!rawVal || !String(rawVal).trim()) {
      showModalMsg(fMsg, "warning");
      notify(fMsg, "warning", "Validasi Form");
      const el = e.target.querySelector(`[name="${fName}"]`);
      if (el) el.focus();
      return;
    }
  }

  // Media requirements for new gallery and documents
  if (!id && type === "gallery") {
    const urlVal = fd.get("image_url");
    const fileVal = fd.get("image_file");
    if ((!urlVal || !String(urlVal).trim()) && (!fileVal || !fileVal.size)) {
      showModalMsg("Pilih file foto atau masukkan URL foto untuk galeri.", "warning");
      notify("Pilih file foto atau masukkan URL foto untuk galeri.", "warning", "Validasi Form");
      return;
    }
  }
  if (!id && type === "document") {
    const urlVal = fd.get("file_url");
    const fileVal = fd.get("file_upload");
    if ((!urlVal || !String(urlVal).trim()) && (!fileVal || !fileVal.size)) {
      showModalMsg("Pilih file dokumen atau masukkan URL dokumen.", "warning");
      notify("Pilih file dokumen atau masukkan URL dokumen.", "warning", "Validasi Form");
      return;
    }
  }

  clearModalMsg();
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Menyimpan...";
  }

  try {
    const payload = {};
    for (const f of d.fields) {
      const [name, , kind] = f;
      if (kind === "file") continue;
      if (kind === "checkbox") payload[name] = fd.get(name) === "on";
      else if (kind === "number") payload[name] = fd.get(name) ? +fd.get(name) : null;
      else if (kind === "date" && fd.get(name) && type === "news") {
        payload[name] = fd.get(name) + "T00:00:00+07:00";
      } else {
        payload[name] = fd.get(name) ? String(fd.get(name)).trim() : null;
      }
    }

    const folderMap = {
      program: "programs",
      achievement: "achievements",
      news: "news",
      gallery: "gallery",
      activity: "activities",
      eskul: "extracurriculars",
      staff: "staff"
    };
    const folder = folderMap[type] || type || "media";

    const imageFile = fd.get("image_file");
    if (imageFile && imageFile.size) {
      if (submitBtn) submitBtn.textContent = "Mengunggah foto...";
      payload.image_url = await upload(imageFile, folder, false);
      if (submitBtn) submitBtn.textContent = "Menyimpan data...";
    }
    const docFile = fd.get("file_upload");
    if (docFile && docFile.size) {
      if (submitBtn) submitBtn.textContent = "Mengunggah dokumen...";
      payload.file_url = await upload(docFile, "documents", true);
      if (submitBtn) submitBtn.textContent = "Menyimpan data...";
    }
    const photoFile = fd.get("photo_file");
    if (photoFile && photoFile.size) {
      if (submitBtn) submitBtn.textContent = "Mengunggah foto...";
      payload.photo_url = await upload(photoFile, "staff", false);
      if (submitBtn) submitBtn.textContent = "Menyimpan data...";
    }

    const req = id
      ? client.from(d.table).update(payload).eq("id", id)
      : client.from(d.table).insert(payload);

    const { error } = await req;
    if (error) throw error;

    closeModal();
    notify(`Data ${d.title} berhasil disimpan.`, "success");
    await loadAll();
  } catch (err) {
    console.error("[SDN11 Admin] saveEditor error:", err);
    showModalMsg("Gagal menyimpan: " + (err.message || "Kesalahan tidak dikenal"), "error");
    notify("Gagal menyimpan: " + (err.message || "Kesalahan tidak dikenal"), "error", "Gagal Menyimpan");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Simpan";
    }
  }
}

async function deleteItem(type, id) {
  const d = defs[type];
  const itemTitle = d?.title || "data ini";
  if (!confirm(`Hapus ${itemTitle}? Tindakan ini tidak dapat dibatalkan.`)) return;

  try {
    const client = getClient();
    if (!d) throw new Error("Tipe data tidak dikenal.");
    const { error } = await client.from(d.table).delete().eq("id", id);
    if (error) throw error;
    notify(`Data ${itemTitle} berhasil dihapus.`, "success");
    await loadAll();
  } catch (err) {
    console.error("[SDN11 Admin] deleteItem error:", err);
    notify("Gagal menghapus data: " + (err.message || "Kesalahan tidak dikenal"), "error");
  }
}
window.deleteItem = deleteItem;

function closeModal() {
  clearModalMsg();
  if ($("modal")) $("modal").classList.add("hidden");
}
window.closeModal = closeModal;
if ($("modalClose")) $("modalClose").onclick = closeModal;
if ($("modal")) {
  $("modal").addEventListener("click", e => {
    if (e.target === $("modal")) closeModal();
  });
}

const SYNC_PROFILE_FIELDS = new Set([
  "name",
  "npsn",
  "status",
  "level",
  "accreditation",
  "principal",
  "students",
  "staff",
  "address",
  "city",
  "phone",
  "email",
  "maps_url"
]);

const uploadLogoBtn = $("uploadLogoBtn");
if (uploadLogoBtn) {
  uploadLogoBtn.onclick = async () => {
    const file = $("schoolLogoFile")?.files?.[0];
    if (!file) {
      notify("Pilih file gambar logo terlebih dahulu.", "warning");
      return;
    }
    let client;
    try {
      client = getClient();
    } catch (err) {
      notify(err.message, "error", "Koneksi Supabase");
      return;
    }

    uploadLogoBtn.disabled = true;
    const originalText = uploadLogoBtn.textContent;
    uploadLogoBtn.textContent = "Mengunggah...";

    try {
      const url = await upload(file, "branding", false);
      const { error } = await client
        .from("school_profile")
        .update({ logo_url: url, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
      profile.logo_url = url;
      if ($("schoolLogoPreview")) $("schoolLogoPreview").src = url;
      notify("Logo sekolah berhasil diunggah dan diperbarui di website.", "success");
    } catch (err) {
      console.error("[SDN11 Admin] Gagal upload logo:", err);
      notify("Gagal mengunggah logo: " + (err.message || "Kesalahan tidak dikenal"), "error");
    } finally {
      uploadLogoBtn.disabled = false;
      uploadLogoBtn.textContent = originalText;
    }
  };
}

const uploadHeroBtn = $("uploadHeroBtn");
if (uploadHeroBtn) {
  uploadHeroBtn.onclick = async () => {
    const file = $("schoolHeroFile")?.files?.[0];
    if (!file) {
      notify("Pilih file gambar hero terlebih dahulu.", "warning");
      return;
    }
    let client;
    try {
      client = getClient();
    } catch (err) {
      notify(err.message, "error", "Koneksi Supabase");
      return;
    }

    uploadHeroBtn.disabled = true;
    const originalText = uploadHeroBtn.textContent;
    uploadHeroBtn.textContent = "Mengunggah...";

    try {
      const url = await upload(file, "branding/hero", false);
      const { error } = await client
        .from("school_profile")
        .update({ hero_image_url: url, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
      profile.hero_image_url = url;
      if ($("schoolHeroPreview")) $("schoolHeroPreview").src = url;
      notify("Foto banner hero berhasil diunggah dan diterapkan di beranda.", "success");
    } catch (err) {
      console.error("[SDN11 Admin] Gagal upload foto hero:", err);
      notify("Gagal mengunggah foto banner: " + (err.message || "Kesalahan tidak dikenal"), "error");
    } finally {
      uploadHeroBtn.disabled = false;
      uploadHeroBtn.textContent = originalText;
    }
  };
}

const addSourceBtn = $("addSourceBtn");
if (addSourceBtn) {
  addSourceBtn.onclick = async () => {
    let client;
    try {
      client = getClient();
    } catch (err) {
      notify(err.message, "error", "Koneksi Supabase");
      return;
    }

    const name = $("sourceName")?.value.trim() || "";
    const source_url = $("sourceUrl")?.value.trim() || "";
    const source_type = $("sourceType")?.value || "html";
    const allowed_fields = ($("sourceFields")?.value || "")
      .split(",")
      .map(x => x.trim())
      .filter(x => SYNC_PROFILE_FIELDS.has(x));

    if (!name || !source_url) {
      notify("Nama dan URL sumber wajib diisi.", "warning", "Validasi Input");
      return;
    }

    addSourceBtn.disabled = true;
    const originalText = addSourceBtn.textContent;
    addSourceBtn.textContent = "Menyimpan...";

    try {
      const { error } = await client.from("sync_sources").insert({
        name,
        source_url,
        source_type,
        allowed_fields,
        enabled: true
      });
      if (error) throw error;

      if ($("sourceName")) $("sourceName").value = "";
      if ($("sourceUrl")) $("sourceUrl").value = "";
      if ($("sourceFields")) $("sourceFields").value = "";
      notify("Sumber sinkronisasi berhasil ditambahkan.", "success");
      await loadAll();
    } catch (err) {
      console.error("[SDN11 Admin] addSource error:", err);
      notify("Gagal menyimpan sumber: " + (err.message || "Kesalahan tidak dikenal"), "error");
    } finally {
      addSourceBtn.disabled = false;
      addSourceBtn.textContent = originalText;
    }
  };
}

function renderSources() {
  const el = $("sourceList");
  if (!el) return;
  el.innerHTML = cache.sources.length
    ? cache.sources
        .map(
          x => `
      <div class="source-item">
        <b>${esc(x.name)}</b>
        <small>${esc(x.source_type)} · ${x.enabled ? "aktif" : "nonaktif"}</small>
        <div>${esc(x.source_url)}</div>
        <div class="editor-actions">
          <button class="secondary" onclick="toggleSource('${x.id}',${!x.enabled})">
            ${x.enabled ? "Nonaktifkan" : "Aktifkan"}
          </button>
          <button class="danger" onclick="deleteSource('${x.id}')">Hapus</button>
        </div>
      </div>
    `
        )
        .join("")
    : "<p class='empty'>Belum ada sumber. Daftarkan sumber resmi/tepercaya terlebih dahulu.</p>";
}

async function toggleSource(id, enabled) {
  try {
    const client = getClient();
    const { error } = await client
      .from("sync_sources")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    notify(enabled ? "Sumber sinkronisasi diaktifkan." : "Sumber sinkronisasi dinonaktifkan.", "success");
    await loadAll();
  } catch (err) {
    console.error("[SDN11 Admin] toggleSource error:", err);
    notify("Gagal mengubah status sumber: " + (err.message || "Kesalahan tidak dikenal"), "error");
  }
}
window.toggleSource = toggleSource;

async function deleteSource(id) {
  if (!confirm("Hapus sumber sinkronisasi ini?")) return;
  try {
    const client = getClient();
    const { error } = await client.from("sync_sources").delete().eq("id", id);
    if (error) throw error;
    notify("Sumber sinkronisasi berhasil dihapus.", "success");
    await loadAll();
  } catch (err) {
    console.error("[SDN11 Admin] deleteSource error:", err);
    notify("Gagal menghapus sumber: " + (err.message || "Kesalahan tidak dikenal"), "error");
  }
}
window.deleteSource = deleteSource;

const smartSyncBtn = $("smartSyncBtn");
if (smartSyncBtn) {
  smartSyncBtn.onclick = async () => {
    let client;
    try {
      client = getClient();
    } catch (err) {
      if ($("syncResult")) {
        $("syncResult").innerHTML = `<p class="warn">${esc(err.message)}</p>`;
      }
      notify(err.message, "error", "Koneksi Supabase");
      return;
    }

    smartSyncBtn.disabled = true;
    const originalText = smartSyncBtn.textContent;
    smartSyncBtn.textContent = "Sinkronisasi berjalan...";
    if ($("syncResult")) {
      $("syncResult").innerHTML = "<p>Memeriksa sumber terdaftar…</p>";
    }

    try {
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData?.session) {
        throw new Error("Sesi admin tidak aktif. Silakan login ulang.");
      }

      const { data, error } = await client.functions.invoke("school-sync", {
        body: { mode: "run" }
      });

      if (error) throw error;

      if ($("syncResult")) {
        $("syncResult").innerHTML = `<p>Smart Sync selesai. ${esc(data?.candidates ?? 0)} kandidat perubahan ditemukan dari ${esc(data?.checked ?? 0)} sumber.</p>`;
      }
      notify(`Smart Sync selesai. Ditemukan ${data?.candidates ?? 0} kandidat data baru.`, "success");
      await loadAll();
    } catch (err) {
      console.error("[SDN11 Admin] smartSync error:", err);
      const errMsg = "Smart Sync gagal: " + (err.message || "Pastikan Edge Function school-sync sudah aktif.");
      if ($("syncResult")) {
        $("syncResult").innerHTML = `<p class="warn">${esc(errMsg)}</p>`;
      }
      notify(errMsg, "error", "Smart Sync");
    } finally {
      smartSyncBtn.disabled = false;
      smartSyncBtn.textContent = originalText;
    }
  };
}

function renderStaging() {
  const list = $("stagingList");
  if (!list) return;
  const items = cache.staging.slice(0, 30);
  list.innerHTML = items.length
    ? items
        .map(
          x => `
      <div class="candidate-item">
        <b>${esc(x.field_name || "Kandidat")}</b>
        <small>${esc(x.source_name || x.source_url || "")} · ${new Date(x.fetched_at || x.created_at).toLocaleString("id-ID")}</small>
        ${
          x.field_name
            ? `
          <div class="candidate-values">
            <div><small>Data sekarang</small><br><b>${esc(valueText(x.current_value))}</b></div>
            <div><small>Data sumber</small><br><b>${esc(valueText(x.candidate_value))}</b></div>
          </div>
          <span class="confidence">Confidence ${esc(x.confidence ?? "-")}%</span>
        `
            : `<pre>${esc(JSON.stringify(x.payload, null, 2)).slice(0, 500)}</pre>`
        }
        <div class="editor-actions">
          ${
            x.status === "pending"
              ? `<button class="secondary" onclick="applyCandidate('${x.id}')">Gunakan Data</button>
                 <button class="danger" onclick="rejectCandidate('${x.id}')">Tolak</button>`
              : `<span class="status-pill">${esc(x.status)}</span>`
          }
        </div>
      </div>
    `
        )
        .join("")
    : "<p class='empty'>Belum ada kandidat perubahan.</p>";
}

function valueText(v) {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

async function applyCandidate(id) {
  const x = cache.staging.find(i => i.id === id);
  if (!x || !SYNC_PROFILE_FIELDS.has(x.field_name)) {
    notify("Field ini tidak diizinkan untuk diterapkan otomatis.", "warning");
    return;
  }

  try {
    const client = getClient();
    const value = x.candidate_value;
    const { error: profileError } = await client
      .from("school_profile")
      .update({ [x.field_name]: value, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (profileError) throw profileError;

    const { error: stageError } = await client
      .from("sync_staging")
      .update({ status: "accepted", reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (stageError) throw stageError;

    notify(`Data untuk ${x.field_name} berhasil diterapkan ke profil sekolah.`, "success");
    await loadAll();
  } catch (err) {
    console.error("[SDN11 Admin] applyCandidate error:", err);
    notify("Gagal menerapkan data kandidat: " + (err.message || "Kesalahan tidak dikenal"), "error");
  }
}
window.applyCandidate = applyCandidate;

async function rejectCandidate(id) {
  try {
    const client = getClient();
    const { error } = await client
      .from("sync_staging")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    notify("Kandidat perubahan data telah ditolak.", "success");
    await loadAll();
  } catch (err) {
    console.error("[SDN11 Admin] rejectCandidate error:", err);
    notify("Gagal menolak kandidat: " + (err.message || "Kesalahan tidak dikenal"), "error");
  }
}
window.rejectCandidate = rejectCandidate;

let currentComplaintFilter = "all";

document.querySelectorAll(".complaints-filter button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".complaints-filter button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentComplaintFilter = btn.dataset.filter || "all";
    renderComplaints();
  };
});

function renderComplaints() {
  const box = $("complaintsList");
  if (!box) return;

  const list = currentComplaintFilter === "all"
    ? cache.complaints
    : cache.complaints.filter(c => c.status === currentComplaintFilter);

  if (!list.length) {
    box.innerHTML = `<p class="empty">Tidak ada data pengaduan pada filter ini.</p>`;
    return;
  }

  const statusLabels = {
    new: "Baru",
    reviewing: "Sedang Ditinjau",
    resolved: "Selesai",
    rejected: "Ditolak"
  };

  box.innerHTML = `
    <div class="table-wrap">
      <table class="editor-table">
        <thead>
          <tr>
            <th>Tanggal Masuk</th>
            <th>Nama Pelapor</th>
            <th>Kategori</th>
            <th>Judul Pengaduan</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(c => `
            <tr>
              <td>${new Date(c.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
              <td><b>${esc(c.reporter_name)}</b></td>
              <td><span class="badge-role badge-teacher">${esc(c.category)}</span></td>
              <td><b>${esc(c.title)}</b></td>
              <td><span class="badge-status ${esc(c.status)}">${esc(statusLabels[c.status] || c.status)}</span></td>
              <td>
                <div class="editor-actions">
                  <button class="secondary" onclick="openComplaintDetail('${c.id}')">Buka Detail</button>
                  <button class="danger" onclick="deleteComplaint('${c.id}')">Hapus</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function openComplaintDetail(id) {
  const c = cache.complaints.find(x => String(x.id) === String(id));
  if (!c) return;

  const modal = $("complaintModal");
  const body = $("complaintModalBody");
  if (!modal || !body) return;

  let attachmentHtml = "<span class='hint'>Tidak ada lampiran file.</span>";
  if (c.attachment_url) {
    attachmentHtml = `<span class='hint' id='attachStatus'>Menyiapkan tautan aman...</span>`;
  }

  const statusLabels = {
    new: "Baru",
    reviewing: "Sedang Ditinjau",
    resolved: "Selesai",
    rejected: "Ditolak"
  };

  body.innerHTML = `
    <div class="detail-view">
      <div class="detail-item">
        <label>Waktu Laporan</label>
        <div>${new Date(c.created_at).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })}</div>
      </div>
      <div class="detail-item">
        <label>Nama Pelapor</label>
        <div style="font-size:16px;"><b>${esc(c.reporter_name)}</b></div>
      </div>
      <div class="detail-item" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label>Email</label>
          <div>${c.email ? `<a href="mailto:${esc(c.email)}" style="color:#0d6efd;font-weight:700;">${esc(c.email)}</a>` : "<span class='hint'>Tidak diisi</span>"}</div>
        </div>
        <div>
          <label>Nomor WhatsApp</label>
          <div>${c.whatsapp ? `<a href="https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener" style="color:#16a34a;font-weight:700;">${esc(c.whatsapp)} ↗</a>` : "<span class='hint'>Tidak diisi</span>"}</div>
        </div>
      </div>
      <div class="detail-item">
        <label>Kategori Pengaduan</label>
        <div><span class="badge-role badge-teacher">${esc(c.category)}</span></div>
      </div>
      <div class="detail-item">
        <label>Judul</label>
        <div style="font-size:16px;font-weight:700;color:#102c42;">${esc(c.title)}</div>
      </div>
      <div class="detail-item">
        <label>Isi Pengaduan</label>
        <pre>${esc(c.body)}</pre>
      </div>
      <div class="detail-item">
        <label>Lampiran Pengaduan (Private Storage)</label>
        <div id="attachmentBox">${attachmentHtml}</div>
      </div>
      <form id="complaintDetailForm" style="margin-top:14px;border-top:1px solid #edf1f4;padding-top:18px;">
        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:12px;font-weight:800;color:#536d82;margin-bottom:6px;">Ubah Status Pengaduan:
            <select id="updateStatusSelect" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1;margin-top:6px;">
              <option value="new" ${c.status === "new" ? "selected" : ""}>Baru</option>
              <option value="reviewing" ${c.status === "reviewing" ? "selected" : ""}>Sedang Ditinjau</option>
              <option value="resolved" ${c.status === "resolved" ? "selected" : ""}>Selesai</option>
              <option value="rejected" ${c.status === "rejected" ? "selected" : ""}>Ditolak</option>
            </select>
          </label>
        </div>
        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:12px;font-weight:800;color:#536d82;margin-bottom:6px;">Catatan Internal Admin:
            <textarea id="updateAdminNote" style="width:100%;min-height:95px;padding:10px;border-radius:8px;border:1px solid #cbd5e1;margin-top:6px;" placeholder="Tulis catatan penanganan internal (hanya terlihat oleh admin)...">${esc(c.admin_note || "")}</textarea>
          </label>
          <small class="hint">Catatan ini TIDAK PERNAH ditampilkan di halaman website publik.</small>
        </div>
        <div class="form-actions" style="display:flex;justify-content:space-between;align-items:center;margin-top:18px;">
          <button type="button" class="danger" onclick="deleteComplaint('${c.id}')">Hapus Pengaduan</button>
          <div style="display:flex;gap:8px;">
            <button type="button" class="secondary" onclick="closeComplaintModal()">Tutup</button>
            <button type="submit" class="primary" id="saveComplaintBtn">Simpan Perubahan</button>
          </div>
        </div>
      </form>
    </div>
  `;

  modal.classList.remove("hidden");

  // Fetch signed URL if attachment exists
  if (c.attachment_url) {
    const attachBox = $("attachmentBox");
    try {
      const client = getClient();
      let fileUrl = c.attachment_url;
      if (!fileUrl.startsWith("http")) {
        const { data, error } = await client.storage
          .from("complaint-attachments")
          .createSignedUrl(c.attachment_url, 3600);
        if (error) throw error;
        fileUrl = data?.signedUrl || fileUrl;
      }
      if (attachBox) {
        attachBox.innerHTML = `
          <a href="${esc(fileUrl)}" target="_blank" rel="noopener" class="attachment-btn">
            📎 Buka / Unduh Lampiran Pengaduan ↗
          </a>
        `;
      }
    } catch (err) {
      console.warn("[SDN11 Admin] createSignedUrl error:", err);
      if (attachBox) {
        attachBox.innerHTML = `<span class="warn">Gagal memuat lampiran: ${esc(err.message)}</span>`;
      }
    }
  }

  const form = $("complaintDetailForm");
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const saveBtn = $("saveComplaintBtn");
      const originalText = saveBtn ? saveBtn.textContent : "Simpan";
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Menyimpan...";
      }

      const newStatus = $("updateStatusSelect")?.value;
      const newNote = $("updateAdminNote")?.value?.trim() || null;

      try {
        const client = getClient();
        const { error } = await client
          .from("complaints")
          .update({
            status: newStatus,
            admin_note: newNote,
            updated_at: new Date().toISOString()
          })
          .eq("id", c.id);

        if (error) throw error;

        closeComplaintModal();
        notify("Status pengaduan berhasil diperbarui.", "success");
        await loadAll();
      } catch (err) {
        console.error("[SDN11 Admin] update complaint error:", err);
        notify("Gagal memperbarui status pengaduan: " + (err.message || "Kesalahan tidak dikenal"), "error");
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = originalText;
        }
      }
    };
  }
}
window.openComplaintDetail = openComplaintDetail;

async function deleteComplaint(id) {
  if (!confirm("Hapus data pengaduan ini secara permanen?")) return;
  try {
    const client = getClient();
    const { error } = await client.from("complaints").delete().eq("id", id);
    if (error) throw error;
    closeComplaintModal();
    notify("Pengaduan berhasil dihapus.", "success");
    await loadAll();
  } catch (err) {
    console.error("[SDN11 Admin] deleteComplaint error:", err);
    notify("Gagal menghapus pengaduan: " + (err.message || "Kesalahan tidak dikenal"), "error");
  }
}
window.deleteComplaint = deleteComplaint;

function closeComplaintModal() {
  if ($("complaintModal")) $("complaintModal").classList.add("hidden");
}
window.closeComplaintModal = closeComplaintModal;
if ($("complaintModalClose")) $("complaintModalClose").onclick = closeComplaintModal;
if ($("complaintModal")) {
  $("complaintModal").addEventListener("click", e => {
    if (e.target === $("complaintModal")) closeComplaintModal();
  });
}

// Safe top-level initialization
applyAdminBranding();
authCheck().catch(err => {
  console.error("[SDN11 Admin] Top-level authCheck error:", err);
});

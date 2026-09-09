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
  announcement: [],
  achievement: [],
  gallery: [],
  document: [],
  schedule: [],
  staging: [],
  sources: []
};
let profile = {};

const defs = {
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
  announcement: {
    table: "announcements",
    title: "Pengumuman",
    fields: [
      ["title", "Judul", "text"],
      ["published_at", "Tanggal", "date"],
      ["body", "Isi", "textarea"],
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

  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".svg"];

  const fileName = file.name || "file";
  const fileExt = fileName.includes(".") ? "." + fileName.split(".").pop().toLowerCase() : "";

  if (isDocument) {
    if (file.size > MAX_DOC_SIZE) {
      throw new Error("Ukuran dokumen melebihi batas maksimal 10 MB.");
    }
  } else {
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error("Ukuran gambar melebihi batas maksimal 5 MB.");
    }
    const mimeValid = file.type ? ALLOWED_IMAGE_TYPES.includes(file.type) : false;
    const extValid = ALLOWED_IMAGE_EXTS.includes(fileExt);
    if (!mimeValid && !extValid) {
      throw new Error("Format file gambar tidak didukung. Gunakan format JPG, PNG, WebP, atau SVG.");
    }
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const randomId = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  const path = `${folder}/${Date.now()}-${randomId}-${safeName}`;

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
      announcementRes,
      achievementRes,
      galleryRes,
      documentRes,
      scheduleRes,
      stagingRes,
      sourcesRes
    ] = await Promise.all([
      client.from("school_profile").select("*").eq("id", 1).maybeSingle(),
      client.from("class_groups").select("*").order("grade", { ascending: true }),
      client.from("extracurriculars").select("*").order("name", { ascending: true }),
      client.from("extracurricular_activities").select("*").order("activity_date", { ascending: false }),
      client.from("programs").select("*").order("sort_order", { ascending: true }),
      client.from("news").select("*").order("published_at", { ascending: false }),
      client.from("announcements").select("*").order("published_at", { ascending: false }),
      client.from("achievements").select("*").order("year", { ascending: false }),
      client.from("gallery").select("*").order("created_at", { ascending: false }),
      client.from("documents").select("*").order("created_at", { ascending: false }),
      client.from("school_schedules").select("*").order("sort_order", { ascending: true }),
      client.from("sync_staging").select("*").order("created_at", { ascending: false }),
      client.from("sync_sources").select("*").order("created_at", { ascending: false })
    ]);

    if (pRes.error) {
      console.warn("[SDN11 Admin] school_profile load error:", pRes.error.message);
    } else if (pRes.data) {
      profile = pRes.data;
    }

    cache.rombel = rombelRes.data || [];
    cache.eskul = eskulRes.data || [];
    cache.activity = activityRes.data || [];
    cache.program = programRes.data || [];
    cache.news = newsRes.data || [];
    cache.announcement = announcementRes.data || [];
    cache.achievement = achievementRes.data || [];
    cache.gallery = galleryRes.data || [];
    cache.document = documentRes.data || [];
    cache.schedule = scheduleRes.data || [];
    cache.staging = stagingRes.data || [];
    cache.sources = sourcesRes.data || [];

    fillProfile();
    renderAll();
  } catch (err) {
    console.error("[SDN11 Admin] Error saat memuat data:", err);
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

  const missionEl = $("schoolMission");
  if (missionEl) {
    missionEl.value = Array.isArray(profile.mission) ? profile.mission.join("\n") : "";
  }

  const logoPreview = $("schoolLogoPreview");
  if (logoPreview) {
    logoPreview.src = profile.logo_url || "../assets/logo-sekolah.jpeg";
  }

  const heroPreview = $("schoolHeroPreview");
  if (heroPreview) {
    heroPreview.src = profile.hero_image_url || "https://cdn-sekolah.annibuku.com/20607216/1.jpg";
  }
}

const saveProfileBtn = $("saveProfileBtn");
if (saveProfileBtn) {
  saveProfileBtn.onclick = async () => {
    let client;
    try {
      client = getClient();
    } catch (err) {
      if ($("profileMsg")) $("profileMsg").textContent = err.message;
      return;
    }

    const payload = {
      id: 1,
      name: $("schoolName")?.value || "",
      npsn: $("schoolNpsn")?.value || "",
      status: $("schoolStatus")?.value || "",
      level: $("schoolLevel")?.value || "",
      accreditation: $("schoolAccreditation")?.value || "",
      principal: $("schoolPrincipal")?.value || "",
      students: +$("schoolStudents")?.value || null,
      staff: +$("schoolStaff")?.value || null,
      address: $("schoolAddress")?.value || "",
      city: $("schoolCity")?.value || "",
      phone: $("schoolPhone")?.value || "",
      email: $("schoolEmail")?.value || "",
      instagram_url: $("schoolInstagram")?.value || null,
      facebook_url: $("schoolFacebook")?.value || null,
      youtube_url: $("schoolYoutube")?.value || null,
      tiktok_url: $("schoolTiktok")?.value || null,
      whatsapp_url: $("schoolWhatsapp")?.value || null,
      maps_url: $("schoolMaps")?.value || "",
      profile_title: $("schoolProfileTitle")?.value || "",
      description: $("schoolDescription")?.value || "",
      vision: $("schoolVision")?.value || "",
      mission: ($("schoolMission")?.value || "")
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean),
      hero_subtitle: $("schoolHeroSubtitle")?.value || "",
      spmb_title: $("schoolSpmbTitle")?.value || "",
      spmb_url: $("schoolSpmbUrl")?.value || "",
      spmb_description: $("schoolSpmbDescription")?.value || "",
      logo_url: profile.logo_url || null,
      hero_image_url: profile.hero_image_url || null,
      updated_at: new Date().toISOString()
    };

    saveProfileBtn.disabled = true;
    if ($("profileMsg")) $("profileMsg").textContent = "Menyimpan profil…";

    try {
      const { error } = await client.from("school_profile").upsert(payload);
      if (error) throw error;
      profile = payload;
      if ($("profileMsg")) $("profileMsg").textContent = "Profil berhasil disimpan.";
      renderAll();
    } catch (err) {
      console.error("[SDN11 Admin] Gagal simpan profil:", err);
      if ($("profileMsg")) $("profileMsg").textContent = "Gagal menyimpan: " + err.message;
    } finally {
      saveProfileBtn.disabled = false;
    }
  };
}

function renderAll() {
  if ($("kpiStudents")) $("kpiStudents").textContent = profile.students ?? "—";
  if ($("kpiRombel")) $("kpiRombel").textContent = cache.rombel.length;
  if ($("kpiEskul")) $("kpiEskul").textContent = cache.eskul.length;
  if ($("kpiStaging")) $("kpiStaging").textContent = cache.staging.filter(x => x.status === "pending").length;

  for (const k of Object.keys(defs)) {
    renderTable(k);
  }
  renderStaging();
  renderSources();
}

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
  return v ?? "-";
}

document.querySelectorAll("[data-add]").forEach(b => {
  b.onclick = () => openEditor(b.dataset.add, null);
});

function openEditor(type, id) {
  const d = defs[type];
  if (!d) return;

  const item = id ? cache[type].find(x => String(x.id) === String(id)) : {};
  if ($("modalTitle")) $("modalTitle").textContent = (id ? "Edit " : "Tambah ") + d.title;
  if ($("modalForm")) {
    $("modalForm").innerHTML = d.fields.map(f => fieldHTML(f, item[f[0]], type)).join("") + `
      <div class="form-actions">
        <button type="button" class="secondary" onclick="closeModal()">Batal</button>
        <button class="primary" type="submit">Simpan</button>
      </div>
    `;
    $("modalForm").onsubmit = e => saveEditor(e, type, id);
  }
  if ($("modal")) $("modal").classList.remove("hidden");
}
window.openEditor = openEditor;

function fieldHTML(f, v, type) {
  const [name, label, kind] = f;
  if (kind === "checkbox") {
    return `<label class="full"><input type="checkbox" name="${name}" ${v !== false ? "checked" : ""}> ${esc(label)}</label>`;
  }
  if (kind === "textarea") {
    return `<label class="full">${esc(label)}<textarea name="${name}">${esc(v || "")}</textarea></label>`;
  }
  if (kind === "file") {
    return `<label class="full">${esc(label)}<input type="file" name="${name}"><span class="file-note">File akan disimpan ke Supabase Storage.</span></label>`;
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
    alert(err.message);
    return;
  }

  const submitBtn = e.target.querySelector('button.primary');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const fd = new FormData(e.target);
    const payload = {};
    for (const f of d.fields) {
      const [name, , kind] = f;
      if (kind === "file") continue;
      if (kind === "checkbox") payload[name] = fd.get(name) === "on";
      else if (kind === "number") payload[name] = fd.get(name) ? +fd.get(name) : null;
      else if (kind === "date" && fd.get(name) && ["news", "announcement"].includes(type)) {
        payload[name] = fd.get(name) + "T00:00:00+07:00";
      } else {
        payload[name] = fd.get(name) || null;
      }
    }

    const imageFile = fd.get("image_file");
    if (imageFile && imageFile.size) {
      payload.image_url = await upload(imageFile, type, false);
    }
    const docFile = fd.get("file_upload");
    if (docFile && docFile.size) {
      payload.file_url = await upload(docFile, "documents", true);
    }

    const req = id
      ? client.from(d.table).update(payload).eq("id", id)
      : client.from(d.table).insert(payload);

    const { error } = await req;
    if (error) throw error;

    closeModal();
    await loadAll();
  } catch (err) {
    console.error("[SDN11 Admin] saveEditor error:", err);
    alert(err.message || "Gagal menyimpan data.");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function deleteItem(type, id) {
  if (!confirm("Hapus data ini?")) return;
  try {
    const client = getClient();
    const d = defs[type];
    if (!d) throw new Error("Tipe data tidak dikenal.");
    const { error } = await client.from(d.table).delete().eq("id", id);
    if (error) throw error;
    await loadAll();
  } catch (err) {
    console.error("[SDN11 Admin] deleteItem error:", err);
    alert(err.message || "Gagal menghapus data.");
  }
}
window.deleteItem = deleteItem;

function closeModal() {
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
      if ($("profileMsg")) $("profileMsg").textContent = "Pilih file logo terlebih dahulu.";
      return;
    }
    let client;
    try {
      client = getClient();
    } catch (err) {
      if ($("profileMsg")) $("profileMsg").textContent = err.message;
      return;
    }

    uploadLogoBtn.disabled = true;
    if ($("profileMsg")) $("profileMsg").textContent = "Mengupload logo…";

    try {
      const url = await upload(file, "branding", false);
      const { error } = await client
        .from("school_profile")
        .update({ logo_url: url, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
      profile.logo_url = url;
      if ($("schoolLogoPreview")) $("schoolLogoPreview").src = url;
      if ($("profileMsg")) $("profileMsg").textContent = "Logo berhasil diupload dan dipakai di website.";
    } catch (err) {
      console.error("[SDN11 Admin] Gagal upload logo:", err);
      if ($("profileMsg")) $("profileMsg").textContent = "Gagal upload logo: " + err.message;
    } finally {
      uploadLogoBtn.disabled = false;
    }
  };
}

const uploadHeroBtn = $("uploadHeroBtn");
if (uploadHeroBtn) {
  uploadHeroBtn.onclick = async () => {
    const file = $("schoolHeroFile")?.files?.[0];
    if (!file) {
      if ($("profileMsg")) $("profileMsg").textContent = "Pilih file foto hero terlebih dahulu.";
      return;
    }
    let client;
    try {
      client = getClient();
    } catch (err) {
      if ($("profileMsg")) $("profileMsg").textContent = err.message;
      return;
    }

    uploadHeroBtn.disabled = true;
    if ($("profileMsg")) $("profileMsg").textContent = "Mengupload foto hero…";

    try {
      const url = await upload(file, "branding/hero", false);
      const { error } = await client
        .from("school_profile")
        .update({ hero_image_url: url, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
      profile.hero_image_url = url;
      if ($("schoolHeroPreview")) $("schoolHeroPreview").src = url;
      if ($("profileMsg")) $("profileMsg").textContent = "Foto hero berhasil diupload dan dipakai di beranda.";
    } catch (err) {
      console.error("[SDN11 Admin] Gagal upload foto hero:", err);
      if ($("profileMsg")) $("profileMsg").textContent = "Gagal upload foto hero: " + err.message;
    } finally {
      uploadHeroBtn.disabled = false;
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
      alert(err.message);
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
      alert("Nama dan URL sumber wajib diisi.");
      return;
    }

    addSourceBtn.disabled = true;
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
      await loadAll();
    } catch (err) {
      console.error("[SDN11 Admin] addSource error:", err);
      alert(err.message || "Gagal menyimpan sumber.");
    } finally {
      addSourceBtn.disabled = false;
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
    await loadAll();
  } catch (err) {
    console.error("[SDN11 Admin] toggleSource error:", err);
    alert(err.message || "Gagal mengubah status sumber.");
  }
}
window.toggleSource = toggleSource;

async function deleteSource(id) {
  if (!confirm("Hapus sumber ini?")) return;
  try {
    const client = getClient();
    const { error } = await client.from("sync_sources").delete().eq("id", id);
    if (error) throw error;
    await loadAll();
  } catch (err) {
    console.error("[SDN11 Admin] deleteSource error:", err);
    alert(err.message || "Gagal menghapus sumber.");
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
      return;
    }

    smartSyncBtn.disabled = true;
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
      await loadAll();
    } catch (err) {
      console.error("[SDN11 Admin] smartSync error:", err);
      if ($("syncResult")) {
        $("syncResult").innerHTML = `<p class="warn">Smart Sync gagal: ${esc(err.message)}. Pastikan Edge Function school-sync sudah dideploy dan V4 patch SQL sudah dijalankan.</p>`;
      }
    } finally {
      smartSyncBtn.disabled = false;
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
    alert("Field ini tidak diizinkan untuk diterapkan otomatis.");
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

    await loadAll();
  } catch (err) {
    console.error("[SDN11 Admin] applyCandidate error:", err);
    alert(err.message || "Gagal menerapkan data kandidat.");
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
    await loadAll();
  } catch (err) {
    console.error("[SDN11 Admin] rejectCandidate error:", err);
    alert(err.message || "Gagal menolak kandidat.");
  }
}
window.rejectCandidate = rejectCandidate;

// Safe top-level initialization
authCheck().catch(err => {
  console.error("[SDN11 Admin] Top-level authCheck error:", err);
});

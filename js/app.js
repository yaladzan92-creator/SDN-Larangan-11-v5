const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
}[c]));
const dateID = d => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "";

// Generate fallback SVG dynamically based on config defaults
const getSchoolShortName = () => window.SDN_SITE_DEFAULTS?.schoolShortName || "Sekolah";
const imageFallback = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560"><rect width="100%" height="100%" fill="#e9eef4"/><text x="50%" y="48%" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="28">${getSchoolShortName()}</text><text x="50%" y="56%" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="18">Gambar belum tersedia</text></svg>`);
const mediaImg = (url, alt, cls) => `<img class="${cls}" src="${esc(url || imageFallback)}" alt="${esc(alt || "")}" loading="lazy" onerror="this.onerror=null;this.src='${imageFallback}'">`;

const defaultAvatar = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100%" height="100%" fill="#e2e8f0"/>
  <circle cx="50" cy="38" r="18" fill="#94a3b8"/>
  <path d="M18 86c0-18 14-32 32-32s32 14 32 32" fill="#94a3b8"/>
</svg>
`);

const fallbackProfile = {
  name: window.SDN_SITE_DEFAULTS?.schoolName || "SDN Larangan 11",
  npsn: window.SDN_SITE_DEFAULTS?.npsn || "20607216",
  status: "Negeri",
  level: window.SDN_SITE_DEFAULTS?.level || "Sekolah Dasar",
  accreditation: "A",
  students: null,
  staff: null,
  principal: "Fetty Meriyanti",
  address: window.SDN_SITE_DEFAULTS?.address || "Jl. H. Majuk No. 180, Larangan Utara, Kecamatan Larangan, Kota Tangerang, Banten 15154",
  city: window.SDN_SITE_DEFAULTS?.city || "Kota Tangerang",
  description: `${window.SDN_SITE_DEFAULTS?.schoolName || "SDN Larangan 11"} merupakan sekolah dasar negeri yang berdedikasi tinggi di ${window.SDN_SITE_DEFAULTS?.city || "Kota Tangerang"}.`,
  vision: "Membentuk generasi yang religius, disiplin, jujur, kreatif dan berkarakter yang peduli terhadap lingkungan.",
  mission: ["Religius", "Disiplin", "Jujur", "Kreatif", "Berkarakter", "Peduli Lingkungan"],
  logo_url: window.SDN_SITE_DEFAULTS?.logoPath || "assets/logo-sekolah.jpeg",
  hero_image_url: "assets/school-hero-placeholder.svg",
  spmb_title: "Informasi SPMB",
  spmb_description: "Informasi penerimaan murid baru dapat diperbarui melalui Admin.",
  spmb_url: "https://spmb.tangerangkota.go.id/",
  menu_visibility: {
    profile: true,
    staff: true,
    programs: true,
    news: true,
    achievements: true,
    gallery: true,
    complaints: true,
    contact: true,
    more: true,
    spmb: true
  }
};

const DEFAULT_MENU_VISIBILITY = {
  profile: true,
  staff: true,
  programs: true,
  news: true,
  achievements: true,
  gallery: true,
  complaints: true,
  contact: true,
  more: true,
  spmb: true
};

function setElementVisibility(target, visible) {
  const elements = typeof target === "string" ? document.querySelectorAll(target) : [target];
  elements.forEach(el => {
    if (!el) return;
    if (visible) {
      el.hidden = false;
      el.classList.remove("is-hidden");
    } else {
      el.hidden = true;
      el.classList.add("is-hidden");
    }
  });
}

const PUBLIC_SECTIONS = {
  profile: {
    navHref: "#profil",
    selectors: ["#profil", ".vision"],
    heroAction: true
  },
  staff: {
    navHref: "#pendidik",
    selectors: ["#pendidik"]
  },
  programs: {
    navHref: "#program",
    selectors: ["#program"]
  },
  news: {
    navHref: "#berita",
    selectors: ["#berita"]
  },
  achievements: {
    navHref: "#prestasi",
    selectors: ["#prestasi"]
  },
  gallery: {
    navHref: "#galeri",
    selectors: ["#galeri"]
  },
  complaints: {
    navHref: "#pengaduan",
    selectors: ["#pengaduan"]
  },
  contact: {
    navHref: "#kontak",
    selectors: ["#kontak"]
  },
  more: {
    navHref: "#lainnya",
    selectors: ["#lainnya"]
  },
  spmb: {
    navHref: null,
    selectors: [".cta-spmb"]
  }
};

function applyMenuVisibility(profile) {
  const rawVisibility = (profile && typeof profile.menu_visibility === "object" && profile.menu_visibility !== null)
    ? profile.menu_visibility
    : {};
  const visibility = {
    ...DEFAULT_MENU_VISIBILITY,
    ...rawVisibility
  };

  Object.entries(PUBLIC_SECTIONS).forEach(([key, config]) => {
    const isVisible = visibility[key] !== false;
    
    // Toggle nav link if navHref is present
    if (config.navHref) {
      const navSelector = `#navMenu a[href="${config.navHref}"]`;
      setElementVisibility(navSelector, isVisible);
    }
    
    // Toggle other selectors
    if (config.selectors) {
      config.selectors.forEach(sel => {
        setElementVisibility(sel, isVisible);
      });
    }

    // Toggle hero actions if configured
    if (config.heroAction) {
      setElementVisibility(`.hero .actions a[href="${config.navHref}"]`, isVisible);
    }
  });

  // Future option: split more into rombel, extracurriculars, activities, schedules, documents.
}

const fallbackStaff = [];

let allStaffData = [];

async function q(table, select = "*", filters = []) {
  if (!window.SDN11?.configured || !window.SDN11?.client) return [];
  try {
    let req = SDN11.client.from(table).select(select);
    for (const f of filters) {
      if (f.op === "eq") req = req.eq(f.col, f.val);
      if (f.op === "order") req = req.order(f.col, { ascending: f.asc ?? false });
      if (f.op === "limit") req = req.limit(f.val);
    }
    const { data, error } = await req;
    if (error) {
      console.warn(`[SDN11 ${table}]`, error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn(`[SDN11 ${table} Exception]`, err?.message || err);
    return [];
  }
}

const fallbackImg = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="100%" height="100%" fill="#dfe7ed"/><text x="50%" y="50%" text-anchor="middle" fill="#667085" font-family="Arial" font-size="26">' + getSchoolShortName() + '</text></svg>');
function img(url, title) {
  return `<img src="${esc(url || fallbackImg)}" alt="${esc(title || "")}" onerror="this.onerror=null;this.src='${fallbackImg}'">`;
}

async function init() {
  if ($("year")) $("year").textContent = new Date().getFullYear();

  let p = fallbackProfile;
  let rombel = [];
  let eskul = [];
  let activities = [];
  let programs = [];
  let news = [];
  let achievements = [];
  let gallery = [];
  let documents = [];
  let schedules = [];
  let staff = [];

  if (window.SDN11?.configured && window.SDN11?.client) {
    const [pr, r, e, a, pg, n, ac, g, d, s, st] = await Promise.all([
      SDN11.client.from("school_profile").select("*").eq("id", 1).maybeSingle(),
      q("class_groups", "*", [{ op: "eq", col: "published", val: true }, { op: "order", col: "grade", asc: true }]),
      q("extracurriculars", "*", [{ op: "eq", col: "active", val: true }, { op: "order", col: "name", asc: true }]),
      q("extracurricular_activities", "*, extracurriculars(name)", [{ op: "eq", col: "published", val: true }, { op: "order", col: "activity_date", asc: false }, { op: "limit", val: 6 }]),
      q("programs", "*", [{ op: "eq", col: "published", val: true }, { op: "order", col: "sort_order", asc: true }]),
      q("news", "*", [{ op: "eq", col: "published", val: true }, { op: "order", col: "published_at", asc: false }, { op: "limit", val: 6 }]),
      q("achievements", "*", [{ op: "eq", col: "published", val: true }, { op: "order", col: "year", asc: false }, { op: "limit", val: 8 }]),
      q("gallery", "*", [{ op: "eq", col: "published", val: true }, { op: "order", col: "created_at", asc: false }, { op: "limit", val: 12 }]),
      q("documents", "*", [{ op: "eq", col: "published", val: true }, { op: "order", col: "created_at", asc: false }]),
      q("school_schedules", "*", [{ op: "eq", col: "published", val: true }, { op: "order", col: "sort_order", asc: true }]),
      q("staff_profiles", "*", [{ op: "eq", col: "published", val: true }, { op: "order", col: "sort_order", asc: true }])
    ]);

    if (pr.data) p = { ...p, ...pr.data };
    rombel = r;
    eskul = e;
    activities = a;
    programs = pg;
    news = n;
    achievements = ac;
    gallery = g;
    documents = d;
    schedules = s;
    staff = st;
  }

  allStaffData = (Array.isArray(staff) && staff.length > 0) ? staff : [];

  renderProfile(p);
  renderStaff(allStaffData);
  initStaffTabs();
  initComplaintForm();
  renderPrograms(programs);
  renderNews(news);
  renderAchievements(achievements);
  renderGallery(gallery);
  renderRombel(rombel);
  renderEskul(eskul);
  renderActivities(activities);
  renderSchedules(schedules);
  renderDocuments(documents);

  $("menuBtn")?.addEventListener("click", () => $("navMenu").classList.toggle("open"));
}

function applyPageMetadata(p) {
  const name = p.name || window.SDN_SITE_DEFAULTS?.schoolName || "SDN Larangan 11";
  const city = p.city || window.SDN_SITE_DEFAULTS?.city || "Kota Tangerang";
  const district = p.district || window.SDN_SITE_DEFAULTS?.district || "Kecamatan Larangan";
  const titleText = `${name} | ${city}`;
  const descText = p.description || `Portal resmi informasi dan layanan ${name}, ${district}, ${city}.`;

  document.title = titleText;

  // Meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute("content", descText);
  }

  // OG Title
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute("content", titleText);
  }

  // OG Description
  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) {
    ogDesc.setAttribute("content", descText);
  }
}

function renderProfile(p) {
  const name = p.name || window.SDN_SITE_DEFAULTS?.schoolName || "SDN Larangan 11";
  const logo = p.logo_url || window.SDN_SITE_DEFAULTS?.logoPath || "assets/logo-sekolah.jpeg";

  if ($("brandLogo")) {
    $("brandLogo").src = logo;
    $("brandLogo").alt = `Logo ${name}`;
  }
  if ($("footerLogo")) {
    $("footerLogo").src = logo;
    $("footerLogo").alt = `Logo ${name}`;
  }
  if ($("brandName")) $("brandName").textContent = (p.short_name || window.SDN_SITE_DEFAULTS?.schoolShortName || name).toUpperCase();
  if ($("brandSubtitle")) $("brandSubtitle").textContent = `${window.SDN_SITE_DEFAULTS?.district || "Kecamatan Larangan"} · ${p.city || window.SDN_SITE_DEFAULTS?.city || "Kota Tangerang"}`;
  if ($("topbarMeta")) $("topbarMeta").textContent = `NPSN ${p.npsn || window.SDN_SITE_DEFAULTS?.npsn || "—"} · ${p.city || window.SDN_SITE_DEFAULTS?.city || "Kota Tangerang"}`;
  
  const topbarSpan = document.querySelector(".topbar-inner span:first-child");
  if (topbarSpan) {
    topbarSpan.textContent = `Portal Informasi ${name}`;
  }

  if ($("heroSchool")) $("heroSchool").textContent = name;
  if ($("heroSubtitle")) $("heroSubtitle").textContent = p.hero_subtitle || p.vision || "";
  if ($("heroImg")) {
    $("heroImg").src = p.hero_image_url || "assets/school-hero-placeholder.svg";
    $("heroImg").alt = `Gedung ${name}`;
  }
  
  const heroBadge = document.querySelector(".hero-copy .badge");
  if (heroBadge) {
    heroBadge.textContent = `${p.level || window.SDN_SITE_DEFAULTS?.level || "Sekolah Dasar Negeri"} · ${p.village || window.SDN_SITE_DEFAULTS?.village || "Larangan Utara"}`;
  }

  if ($("statNpsn")) $("statNpsn").textContent = p.npsn || "—";
  if ($("statStatus")) $("statStatus").textContent = p.status || "—";
  if ($("statStudents")) $("statStudents").textContent = p.students ?? "—";
  if ($("statStaff")) $("statStaff").textContent = p.staff ?? "—";
  
  if ($("profileTitle")) $("profileTitle").textContent = p.profile_title || `Berakar di ${window.SDN_SITE_DEFAULTS?.village || "Larangan Utara"}, tumbuh bersama masyarakat.`;
  if ($("profileDescription")) $("profileDescription").textContent = p.description || "";
  
  if ($("profilePhoto")) {
    $("profilePhoto").src = p.profile_photo_url || "assets/school-profile-placeholder.svg";
    $("profilePhoto").alt = `Profil ${name}`;
  }
  
  if ($("profileInfo")) {
    $("profileInfo").innerHTML = [
      ["Nama", name],
      ["NPSN", p.npsn],
      ["Status", p.status],
      ["Jenjang", p.level],
      ["Kepala Sekolah", p.principal]
    ].filter(x => x[1]).map(([a, b]) => `<div><span>${esc(a)}</span><strong>${esc(b)}</strong></div>`).join("");
  }

  if ($("visionText")) $("visionText").textContent = p.vision || "";
  const m = Array.isArray(p.mission) && p.mission.length ? p.mission : fallbackProfile.mission;
  if ($("missionText")) $("missionText").innerHTML = m.map(x => `<p>${esc(x)}</p>`).join("");
  if ($("contactSchool")) $("contactSchool").textContent = name;
  if ($("contactAddress")) $("contactAddress").textContent = p.address || "";
  if ($("mapLink")) $("mapLink").href = p.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + (p.city || ""))}`;
  
  if ($("contactInfo")) {
    $("contactInfo").innerHTML = [
      ["NPSN", p.npsn],
      ["Status", p.status],
      ["Jenjang", p.level],
      ["Akreditasi", p.accreditation]
    ].filter(x => x[1]).map(([a, b]) => `<div><span>${esc(a)}</span><strong>${esc(b)}</strong></div>`).join("");
  }

  if ($("spmbTitle")) $("spmbTitle").textContent = p.spmb_title || "Informasi SPMB";
  if ($("spmbDescription")) $("spmbDescription").textContent = p.spmb_description || "";
  if ($("spmbLink")) $("spmbLink").href = p.spmb_url || "#";
  if ($("footerSchool")) $("footerSchool").textContent = name;
  if ($("footerCity")) $("footerCity").textContent = (p.city || window.SDN_SITE_DEFAULTS?.city || "Kota Tangerang") + ` · Provinsi ${window.SDN_SITE_DEFAULTS?.province || "Banten"}`;

  const copyrightEl = document.querySelector(".copyright");
  if (copyrightEl) {
    const year = new Date().getFullYear();
    copyrightEl.innerHTML = `&copy; ${year} ${name}`;
  }

  if ($("socialLinks")) {
    const socials = [
      ["Instagram", p.instagram_url, "◎"],
      ["Facebook", p.facebook_url, "f"],
      ["YouTube", p.youtube_url, "▶"],
      ["TikTok", p.tiktok_url, "♪"],
      ["WhatsApp", p.whatsapp_url, "◉"]
    ].filter(x => x[1]);
    $("socialLinks").innerHTML = socials.length
      ? socials.map(([sName, url, icon]) => `<a class="social-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(sName)}"><span>${icon}</span>${esc(sName)}</a>`).join("")
      : '<span class="muted">Media sosial belum ditambahkan.</span>';
  }

  // Apply metadata/SEO
  applyPageMetadata(p);

  // Apply visibility settings to navigation and sections
  applyMenuVisibility(p);
}

/* ================================================================
   STAFF PROFILES (PROFIL PENDIDIK)
   ================================================================ */

function renderStaff(items) {
  const container = $("staffList");
  if (!container) return;

  if (!items || !items.length) {
    container.innerHTML = `
      <div class="empty text-center" style="padding: 38px 24px; text-align: center; background: #fff; border: 1px dashed var(--line); border-radius: 18px; margin: 10px 0;">
        <p style="font-size: 16px; font-weight: 700; color: var(--navy); margin: 0 0 6px;">Profil pendidik belum tersedia.</p>
        <p style="font-size: 14px; color: var(--muted); margin: 0;">Informasi profil Kepala Sekolah, Guru, dan Pengawas akan ditampilkan setelah diperbarui oleh Admin.</p>
      </div>
    `;
    return;
  }

  const roleLabels = {
    principal: "Kepala Sekolah",
    teacher: "Dewan Guru",
    supervisor: "Pengawas Sekolah"
  };

  const roleBadgeClasses = {
    principal: "badge-principal",
    teacher: "badge-teacher",
    supervisor: "badge-supervisor"
  };

  // Sort: principal first, then sort_order
  const sorted = [...items].sort((a, b) => {
    if (a.role === "principal" && b.role !== "principal") return -1;
    if (b.role === "principal" && a.role !== "principal") return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  container.innerHTML = `
    <div class="staff-grid">
      ${sorted.map(s => {
        const isPrincipal = s.role === "principal";
        const photoSrc = (s.photo_url && s.photo_url.trim()) ? s.photo_url.trim() : defaultAvatar;
        const quote = s.quote ? String(s.quote).trim() : "";
        const bio = s.bio ? String(s.bio).trim() : "";
        const subject = s.subject ? String(s.subject).trim() : "";
        return `
          <article class="staff-card ${isPrincipal ? "staff-card-principal" : ""}" data-role="${esc(s.role)}">
            <div class="staff-photo-wrap">
              <img src="${esc(photoSrc)}" alt="${esc(s.name)}" class="staff-photo" loading="lazy" onerror="this.onerror=null;this.src='${defaultAvatar}'">
              <span class="staff-badge ${roleBadgeClasses[s.role] || "badge-teacher"}">${esc(roleLabels[s.role] || s.role)}</span>
            </div>
            <div class="staff-info">
              <h3 class="staff-name">${esc(s.name)}</h3>
              ${subject ? `<p class="staff-subject">${esc(subject)}</p>` : ""}
              ${quote ? `<blockquote class="staff-quote">“${esc(quote)}”</blockquote>` : ""}
              ${bio ? `<p class="staff-bio">${esc(bio)}</p>` : ""}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function initStaffTabs() {
  const tabs = document.querySelectorAll("#staffTabs .staff-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const role = tab.dataset.role;

      if (role === "all") {
        renderStaff(allStaffData);
      } else {
        const filtered = allStaffData.filter(s => s.role === role);
        if (!filtered.length) {
          const container = $("staffList");
          if (container) {
            const roleName = role === "principal" ? "Kepala Sekolah" : role === "supervisor" ? "Pengawas Sekolah" : "Dewan Guru";
            container.innerHTML = `
              <div class="empty text-center" style="padding: 36px 24px; text-align: center; background: #fff; border: 1px dashed var(--line); border-radius: 18px; margin: 10px 0;">
                <p style="font-size: 16px; font-weight: 700; color: var(--navy); margin: 0 0 6px;">Profil pendidik belum tersedia.</p>
                <p style="font-size: 14px; color: var(--muted); margin: 0;">Informasi profil ${roleName} akan ditampilkan setelah diperbarui oleh Admin.</p>
              </div>
            `;
          }
        } else {
          renderStaff(filtered);
        }
      }
    });
  });
}

/* ================================================================
   PUBLIC COMPLAINT FORM (HALAMAN PENGADUAN)
   ================================================================ */

function initComplaintForm() {
  const form = $("publicComplaintForm");
  const msgEl = $("complaintMsg");
  const submitBtn = $("submitComplaintBtn");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (msgEl) {
      msgEl.className = "form-status";
      msgEl.textContent = "";
    }

    // 1. Anti-bot Honeypot check
    const honeypotVal = $("compWebsite")?.value?.trim();
    if (honeypotVal) {
      console.warn("[SDN11] Bot submission rejected via honeypot.");
      // Do NOT insert into Supabase; simulate normal acceptance to deceive automated bots
      form.reset();
      showComplaintMsg("Pengaduan Anda berhasil dikirim! Laporan ini bersifat privat dan akan segera ditindaklanjuti oleh pihak sekolah. Terima kasih atas kepedulian Anda terhadap SDN Larangan 11.", "success");
      return;
    }

    // 2. JavaScript consent verification
    const consentChecked = $("compConsent")?.checked;
    if (!consentChecked) {
      showComplaintMsg("Anda wajib mencentang persetujuan pernyataan bahwa informasi yang disampaikan adalah benar.", "error");
      $("compConsent")?.focus();
      return;
    }

    const reporterName = $("compName")?.value.trim();
    const email = $("compEmail")?.value.trim() || null;
    const whatsapp = $("compWhatsapp")?.value.trim() || null;
    const category = $("compCategory")?.value;
    const title = $("compTitle")?.value.trim();
    const body = $("compBody")?.value.trim();
    const fileInput = $("compAttachment");
    const file = fileInput?.files?.[0];

    // 3. Client-side length and presence validations
    if (!reporterName) {
      showComplaintMsg("Silakan masukkan nama lengkap Anda.", "error");
      $("compName")?.focus();
      return;
    }
    if (reporterName.length > 150) {
      showComplaintMsg("Nama lengkap terlalu panjang (maksimal 150 karakter).", "error");
      $("compName")?.focus();
      return;
    }

    if (email && email.length > 254) {
      showComplaintMsg("Alamat email terlalu panjang (maksimal 254 karakter).", "error");
      $("compEmail")?.focus();
      return;
    }

    if (whatsapp && whatsapp.length > 30) {
      showComplaintMsg("Nomor WhatsApp terlalu panjang (maksimal 30 karakter).", "error");
      $("compWhatsapp")?.focus();
      return;
    }

    if (!category) {
      showComplaintMsg("Silakan pilih kategori pengaduan.", "error");
      $("compCategory")?.focus();
      return;
    }

    if (!title) {
      showComplaintMsg("Silakan masukkan judul pengaduan.", "error");
      $("compTitle")?.focus();
      return;
    }
    if (title.length > 200) {
      showComplaintMsg("Judul pengaduan terlalu panjang (maksimal 200 karakter).", "error");
      $("compTitle")?.focus();
      return;
    }

    if (!body) {
      showComplaintMsg("Silakan tulis uraian lengkap pengaduan Anda.", "error");
      $("compBody")?.focus();
      return;
    }
    if (body.length > 5000) {
      showComplaintMsg("Uraian pengaduan terlalu panjang (maksimal 5.000 karakter).", "error");
      $("compBody")?.focus();
      return;
    }

    // 4. Attachment validation (Max 5MB, specific types: JPG, PNG, WebP, PDF)
    if (file) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"
      ];
      if (!allowedTypes.includes(file.type)) {
        showComplaintMsg("Tipe file lampiran tidak didukung. Harap gunakan format JPG, PNG, WebP, atau PDF.", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showComplaintMsg("Ukuran file lampiran melebihi batas maksimal 5 MB.", "error");
        return;
      }
    }

    if (!window.SDN11?.configured || !window.SDN11?.client) {
      showComplaintMsg("Sistem database sedang dalam pemeliharaan. Silakan hubungi nomor kontak sekolah secara langsung.", "error");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Mengirimkan Pengaduan...";
    }

    try {
      let attachmentUrl = null;

      // Handle file upload to private bucket complaint-attachments
      if (file) {
        const fileExt = file.name.split(".").pop().toLowerCase();
        const safeId = Date.now() + "_" + Math.random().toString(36).substring(2, 8);
        const filePath = `${safeId}.${fileExt}`;

        const { data: uploadData, error: uploadErr } = await SDN11.client.storage
          .from("complaint-attachments")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (uploadErr) {
          console.warn("[SDN11] File upload warning:", uploadErr.message);
          // If storage bucket is not yet provisioned, we still allow sending complaint text
        } else if (uploadData?.path) {
          attachmentUrl = uploadData.path;
        }
      }

      // Insert into complaints table
      const { error: insertErr } = await SDN11.client
        .from("complaints")
        .insert({
          reporter_name: reporterName,
          email: email,
          whatsapp: whatsapp,
          category: category,
          title: title,
          body: body,
          attachment_url: attachmentUrl,
          status: "new"
        });

      if (insertErr) throw insertErr;

      // Success
      form.reset();
      showComplaintMsg("Pengaduan Anda berhasil dikirim! Laporan ini bersifat privat dan akan segera ditindaklanjuti oleh pihak sekolah. Terima kasih atas kepedulian Anda terhadap SDN Larangan 11.", "success");
    } catch (err) {
      console.warn("[SDN11] Complaint submit error:", err?.message || err);
      showComplaintMsg("Gagal mengirim pengaduan: " + (err.message || "Terjadi kendala jaringan."), "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Kirim Pengaduan";
      }
    }
  });

  function showComplaintMsg(text, type) {
    if (!msgEl) return;
    msgEl.className = "form-status " + type;
    msgEl.textContent = text;
    msgEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

/* ================================================================
   OTHER SECTIONS (PROGRAMS, NEWS, ETC.)
   ================================================================ */

function renderPrograms(items) {
  if ($("programList")) {
    $("programList").innerHTML = items.length
      ? items.map((v, i) => {
          const numStr = String(i + 1).padStart(2, "0");
          if (v.image_url) {
            return `
              <article class="content-card program-card">
                ${img(v.image_url, v.title || v.name)}
                <div class="body">
                  <span class="program-num-badge">Program ${numStr}</span>
                  <h3>${esc(v.title || v.name)}</h3>
                  <p>${esc(v.description || "")}</p>
                </div>
              </article>
            `;
          }
          return `
            <article class="feature">
              <div class="num">${numStr}</div>
              <h3>${esc(v.title || v.name)}</h3>
              <p>${esc(v.description || "")}</p>
            </article>
          `;
        }).join("")
      : '<div class="empty text-center w-full" style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--muted);">Program sekolah belum dipublikasikan.</div>';
  }
}

function renderNews(items) {
  if ($("newsList")) {
    $("newsList").innerHTML = items.length
      ? items.map(x => `<article class="content-card">${img(x.image_url, x.title)}<div class="body"><small>${dateID(x.published_at) || "INFORMASI"}</small><h3>${esc(x.title)}</h3><p>${esc(x.excerpt || "")}</p></div></article>`).join("")
      : '<div class="empty">Belum ada berita yang dipublikasikan.</div>';
  }
}

function renderAchievements(items) {
  if ($("achievementList")) {
    $("achievementList").innerHTML = items.length
      ? items.map(x => {
          const metaParts = [x.category, x.level, x.year].filter(Boolean).map(esc);
          const metaStr = metaParts.join(" · ");
          if (x.image_url) {
            return `
              <article class="content-card achievement-card-media">
                ${img(x.image_url, x.title)}
                <div class="body">
                  ${metaStr ? `<small class="achievement-meta">${metaStr}</small>` : ""}
                  <h3>${esc(x.title)}</h3>
                  ${x.description ? `<p class="achievement-desc">${esc(x.description)}</p>` : ""}
                </div>
              </article>
            `;
          }
          return `
            <article class="achievement-card">
              <strong>${esc(x.title)}</strong>
              ${(x.category || x.level) ? `<p>${esc([x.category, x.level].filter(Boolean).join(" · "))}</p>` : ""}
              ${x.description ? `<p class="achievement-desc">${esc(x.description)}</p>` : ""}
              ${x.year ? `<small>${esc(x.year)}</small>` : ""}
            </article>
          `;
        }).join("")
      : '<div class="empty">Belum ada prestasi yang dipublikasikan.</div>';
  }
}

function renderGallery(items) {
  if ($("galleryList")) {
    $("galleryList").innerHTML = items.length
      ? items.map(x => `<figure>${img(x.image_url, x.title)}<figcaption>${esc(x.title || "Kegiatan Sekolah")}</figcaption></figure>`).join("")
      : '<div class="empty">Belum ada foto galeri.</div>';
  }
}

function renderRombel(items) {
  if ($("rombelList")) {
    $("rombelList").innerHTML = items.length
      ? `<table class="data-table"><thead><tr><th>Rombel</th><th>Tingkat</th><th>Siswa</th><th>Wali Kelas</th><th>Ruang</th></tr></thead><tbody>${items.map(x => `<tr><td>${esc(x.name)}</td><td>${esc(x.grade)}</td><td>${esc(x.student_count ?? "-")}</td><td>${esc(x.homeroom_teacher || "-")}</td><td>${esc(x.room || "-")}</td></tr>`).join("")}</tbody></table>`
      : '<div class="empty">Data rombongan belajar belum tersedia.</div>';
  }
}

function renderEskul(items) {
  const el = $("eskulList");
  if (!el) return;
  if (!items.length) {
    el.innerHTML = '<div class="empty">Data ekstrakurikuler belum tersedia.</div>';
    return;
  }
  el.innerHTML = items.map(x => `<article class="content-card eskul-card">${mediaImg(x.image_url, x.name, "eskul-image")}<div class="body"><h3>${esc(x.name)}</h3><p><b>${esc(x.day || "-")}</b>${x.start_time ? ` · ${esc(x.start_time)}` : ""}</p><p>${esc(x.description || "")}</p></div></article>`).join("");
}

function renderActivities(items) {
  if ($("eskulActivityList")) {
    $("eskulActivityList").innerHTML = items.length
      ? items.map(x => `<article class="content-card">${x.image_url ? img(x.image_url, x.title) : ""}<div class="body"><small>${dateID(x.activity_date)}</small><h3>${esc(x.title)}</h3><p>${esc(x.description || "")}</p></div></article>`).join("")
      : '<div class="empty">Belum ada kegiatan ekstrakurikuler.</div>';
  }
}

function renderSchedules(items) {
  if ($("scheduleList")) {
    $("scheduleList").innerHTML = items.length
      ? items.slice(0, 9).map(x => `<article class="generic-card"><small>${esc(x.day || "")}</small><h3>${esc(x.title)}</h3><p>${esc(x.time_text || "")}${x.class_name ? " · " + esc(x.class_name) : ""}</p></article>`).join("")
      : '<div class="empty">Jadwal belum tersedia.</div>';
  }
}

function renderDocuments(items) {
  if ($("documentList")) {
    $("documentList").innerHTML = items.length
      ? items.map(x => `<article class="generic-card"><h3>${esc(x.title)}</h3><p>${esc(x.description || "")}</p><a class="admin-link" href="${esc(x.file_url || "#")}" target="_blank" rel="noopener">Buka Dokumen →</a></article>`).join("")
      : '<div class="empty">Belum ada dokumen publik.</div>';
  }
}

init();

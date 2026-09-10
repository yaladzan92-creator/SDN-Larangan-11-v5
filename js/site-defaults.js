// Site Defaults and Fallback Identity Config
// Change these values when adapting the template for another school.

window.SDN_SITE_DEFAULTS = {
  schoolName: "SDN Larangan 11",
  schoolShortName: "SDN LARANGAN 11",
  adminBrandCode: "L11",
  npsn: "20607216",
  city: "Kota Tangerang",
  district: "Kecamatan Larangan",
  village: "Larangan Utara",
  province: "Banten",
  address: "Jl. H. Majuk No. 180, Larangan Utara, Kecamatan Larangan, Kota Tangerang, Banten 15154",
  level: "Sekolah Dasar Negeri",
  logoPath: "assets/logo-sekolah.jpeg",
  adminLogoPath: "../assets/logo-sekolah.jpeg"
};

// Legacy configuration aliases for backward compatibility
if (window.SDN11_CONFIG) {
  // Legacy alias retained for backward compatibility.
  window.SDN_CONFIG = window.SDN11_CONFIG;
}

(() => {
  const cfg = window.SDN11_CONFIG || {};

  const isString = v => typeof v === "string";
  const isValidUrl = isString(cfg.SUPABASE_URL) && cfg.SUPABASE_URL.startsWith("https://") && cfg.SUPABASE_URL.trim().length > 10;
  const isValidKey = isString(cfg.SUPABASE_ANON_KEY) && cfg.SUPABASE_ANON_KEY.trim().length > 20;
  const hasConfig = isValidUrl && isValidKey;

  const hasLibrary = typeof window.supabase !== "undefined" && window.supabase !== null && typeof window.supabase.createClient === "function";

  let client = null;
  let configured = false;
  let error = null;

  if (!hasConfig) {
    configured = false;
    client = null;
    error = "Konfigurasi Supabase tidak valid atau belum diisi dengan benar.";
    console.error("[SDN11 Supabase] Konfigurasi Supabase tidak valid.");
  } else if (!hasLibrary) {
    configured = false;
    client = null;
    error = "Koneksi Supabase belum siap. Periksa koneksi internet lalu muat ulang halaman.";
    console.error("[SDN11 Supabase] Supabase JS gagal dimuat. Periksa CDN atau koneksi internet.");
  } else {
    try {
      client = window.supabase.createClient(cfg.SUPABASE_URL.trim(), cfg.SUPABASE_ANON_KEY.trim(), {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      configured = true;
      error = null;
    } catch (err) {
      client = null;
      configured = false;
      error = (err && err.message) ? err.message : "Gagal menginisialisasi Supabase client.";
      console.error("[SDN11 Supabase] Error saat inisialisasi client:", err);
    }
  }

  const sdn11State = {
    configured,
    client,
    bucket: (isString(cfg.STORAGE_BUCKET) && cfg.STORAGE_BUCKET.trim()) ? cfg.STORAGE_BUCKET.trim() : "school-media",
    error,
    getClient() {
      if (!this.client) {
        throw new Error(this.error || "Koneksi Supabase belum siap. Periksa koneksi internet lalu muat ulang halaman.");
      }
      return this.client;
    }
  };

  window.SDN11 = sdn11State;
})();


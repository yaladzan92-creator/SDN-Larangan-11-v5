import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Dynamic config endpoint to allow overriding via environment variables
app.get(['/js/config.js', '/admin/js/config.js'], (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://wmaujhootjritclkyvef.supabase.co';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_1PfxKwAGXRWpMh_MiZJF6Q_FDDyxods';
  const storageBucket = process.env.STORAGE_BUCKET || 'school-media';

  res.type('application/javascript');
  res.send(`window.SDN11_CONFIG = {
  SUPABASE_URL: ${JSON.stringify(supabaseUrl)},
  SUPABASE_ANON_KEY: ${JSON.stringify(supabaseAnonKey)},
  STORAGE_BUCKET: ${JSON.stringify(storageBucket)}
};
`);
});

// Serve admin directory explicitly with index.html
app.use('/admin', express.static(path.join(__dirname, 'admin'), {
  index: 'index.html'
}));

// Serve static assets and files from the root
app.use(express.static(__dirname, {
  index: 'index.html'
}));

// Handle client routing fallbacks
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`[SDN Larangan 11] Server running on http://${HOST}:${PORT}`);
});

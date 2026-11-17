export async function register() {
  // Only set DNS in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const dns = require('dns');
      const existing = typeof dns.getServers === 'function' ? dns.getServers() : [];
      const fallbacks = ['8.8.8.8', '1.1.1.1', '8.8.4.4'];
      const combined = Array.from(new Set([...existing, ...fallbacks]));
      dns.setServers(combined);
      console.log('✅ DNS configured with system + Google/Cloudflare DNS fallbacks');
    } catch (e: any) {
      console.warn('⚠️ Could not configure custom DNS servers:', e.message);
    }
  }
}

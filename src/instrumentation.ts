export async function register() {
  // Only set DNS in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dns = require('dns');
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log('✅ DNS configured to use Google DNS (8.8.8.8)');
  }
}


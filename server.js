// server.js - Custom Node.js server with Socket.IO for IdzemeVypic
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const os = require('os');
const qrcode = require('qrcode');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname: 'localhost', port });
const handle = app.getRequestHandler();

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Make io globally available for API routes
  global.io = io;

  // Load socket handlers
  const { registerSocketHandlers } = require('./src/server/socketHandlers');
  registerSocketHandlers(io);

  httpServer.listen(port, hostname, async () => {
    const localIPs = getLocalIPs();
    console.log('\n');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║           🎮 IdzemeVypic Server 🎮            ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Local:   http://localhost:${port}              ║`);
    for (const ip of localIPs) {
      console.log(`║  Network: http://${ip}:${port}             ║`);
    }
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');

    if (localIPs.length > 0) {
      const networkUrl = `http://${localIPs[0]}:${port}`;
      console.log(`📱 Naskenuj QR kód pre pripojenie z mobilu:`);
      console.log(`   ${networkUrl}\n`);
      try {
        const qr = await qrcode.toString(networkUrl, { type: 'terminal', small: true });
        console.log(qr);
      } catch (e) {
        console.log('(QR kód sa nedal vygenerovať)');
      }
    }
    console.log('\n✅ Server beží! Stlač Ctrl+C pre zastavenie.\n');
  });
});

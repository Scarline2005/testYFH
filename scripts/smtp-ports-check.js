require('dotenv').config();
const net = require('net');
const nodemailer = require('nodemailer');

const env = (key, fallback = '') => String(process.env[key] ?? fallback).trim();
const envBool = (key, fallback = false) => env(key, String(fallback)).toLowerCase() === 'true';

const host = env('SMTP_HOST');
const user = env('SMTP_USER');
const pass = env('SMTP_PASS');
const ports = [25, 465, 587];

if (!host) {
  console.error('[SMTP PORTS] SMTP_HOST manquant.');
  process.exit(1);
}

const testTcpPort = (port, timeoutMs = 8000) =>
  new Promise((resolve) => {
    const startedAt = Date.now();
    const socket = net.createConnection({ host, port });
    let done = false;

    const finish = (result) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve({
        port,
        ...result,
        latency_ms: Date.now() - startedAt,
      });
    };

    socket.setTimeout(timeoutMs);
    socket.on('connect', () => finish({ tcp_ok: true }));
    socket.on('timeout', () => finish({ tcp_ok: false, error: 'ETIMEDOUT' }));
    socket.on('error', (error) => finish({ tcp_ok: false, error: error?.code || error?.message || 'UNKNOWN' }));
  });

const smtpVerify = async (port) => {
  const secure = port === 465;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: port === 587,
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 20000,
    logger: true,
    debug: true,
    tls: {
      servername: host,
      minVersion: 'TLSv1.2',
      rejectUnauthorized: envBool('SMTP_TLS_REJECT_UNAUTHORIZED', true),
    },
  });

  try {
    await transporter.verify();
    return { smtp_verify_ok: true };
  } catch (error) {
    return {
      smtp_verify_ok: false,
      errorCode: error?.code || null,
      responseCode: error?.responseCode || null,
      command: error?.command || null,
      response: error?.response || null,
      message: error?.message || null,
    };
  }
};

async function run() {
  for (const port of ports) {
    const tcp = await testTcpPort(port);
    console.log('[SMTP PORTS] TCP', tcp);
    if (!tcp.tcp_ok) continue;
    const verify = await smtpVerify(port);
    console.log('[SMTP PORTS] SMTP', { port, ...verify });
  }
}

run().catch((error) => {
  console.error('[SMTP PORTS] FAILED', error);
  process.exit(2);
});

require('dotenv').config();
const nodemailer = require('nodemailer');

const env = (key, fallback = '') => String(process.env[key] ?? fallback).trim();
const envBool = (key, fallback = false) => env(key, String(fallback)).toLowerCase() === 'true';

const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_TO'];
const missing = requiredEnv.filter((key) => !env(key));

if (missing.length) {
  console.error(`[SMTP TEST] Variables manquantes: ${missing.join(', ')}`);
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: env('SMTP_HOST'),
  port: Number(env('SMTP_PORT')),
  secure: envBool('SMTP_SECURE', false),
  requireTLS: envBool('SMTP_REQUIRE_TLS', false),
  auth: {
    user: env('SMTP_USER'),
    pass: env('SMTP_PASS'),
  },
  connectionTimeout: 12000,
  greetingTimeout: 12000,
  socketTimeout: 20000,
  logger: true,
  debug: true,
  tls: {
    servername: env('SMTP_HOST'),
    minVersion: 'TLSv1.2',
    rejectUnauthorized: envBool('SMTP_TLS_REJECT_UNAUTHORIZED', true),
  },
});

async function run() {
  try {
    await transporter.verify();
    console.log('[SMTP TEST] verify: OK');
  } catch (error) {
    console.error('[SMTP TEST] verify: FAILED', {
      code: error?.code,
      responseCode: error?.responseCode,
      command: error?.command,
      response: error?.response,
      message: error?.message,
    });
    process.exit(2);
  }

  try {
    const info = await transporter.sendMail({
      from: `"YFH SMTP Test" <${env('SMTP_FROM', env('SMTP_USER'))}>`,
      to: env('MAIL_TO'),
      subject: '[TEST] Youth Foundation Haiti SMTP',
      text: `Test SMTP envoye le ${new Date().toISOString()}`,
    });
    console.log('[SMTP TEST] sendMail: OK', {
      messageId: info?.messageId,
      response: info?.response,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });
  } catch (error) {
    console.error('[SMTP TEST] sendMail: FAILED', {
      code: error?.code,
      responseCode: error?.responseCode,
      command: error?.command,
      response: error?.response,
      message: error?.message,
      stack: error?.stack,
    });
    process.exit(3);
  }
}

run();

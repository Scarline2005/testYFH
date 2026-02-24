require('dotenv').config();
const sgMail = require('@sendgrid/mail');

const env = (key, fallback = '') => String(process.env[key] ?? fallback).trim();

const requiredEnv = ['SENDGRID_API_KEY', 'MAIL_FROM', 'MAIL_TO'];
const missing = requiredEnv.filter((key) => !env(key));

if (missing.length) {
  console.error(`[SENDGRID TEST] Variables manquantes: ${missing.join(', ')}`);
  process.exit(1);
}

sgMail.setApiKey(env('SENDGRID_API_KEY'));

async function run() {
  try {
    const [response] = await sgMail.send({
      from: {
        email: env('MAIL_FROM'),
        name: 'YFH SendGrid Test',
      },
      to: [{ email: env('MAIL_TO') }],
      subject: '[TEST] Youth Foundation Haiti SendGrid',
      text: `Test SendGrid envoye le ${new Date().toISOString()}`,
    });
    console.log('[SENDGRID TEST] send: OK', {
      statusCode: response?.statusCode,
      headers: response?.headers,
    });
  } catch (error) {
    console.error('[SENDGRID TEST] send: FAILED', {
      code: error?.code,
      statusCode: error?.response?.statusCode,
      responseHeaders: error?.response?.headers,
      responseBody: error?.response?.body,
      message: error?.message,
      stack: error?.stack,
    });
    process.exit(2);
  }
}

run();

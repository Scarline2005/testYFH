const {
  generateRequestId,
  jsonResponse,
  log,
  getEnvSummary,
} = require('./_shared/mail');

exports.handler = async () => {
  const requestId = generateRequestId();
  const envSummary = getEnvSummary();

  log('info', requestId, 'Health check requested', {
    smtp_configured: envSummary.missing_env.length === 0,
  });

  return jsonResponse(200, {
    ok: true,
    service: 'yfh-netlify-mail',
    env: process.env.CONTEXT || process.env.NODE_ENV || 'unknown',
    smtp_configured: envSummary.missing_env.length === 0,
    ...envSummary,
    request_id: requestId,
    now: new Date().toISOString(),
  });
};

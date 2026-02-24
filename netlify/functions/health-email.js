const {
  generateRequestId,
  jsonResponse,
  log,
  verifyTransport,
  getEnvSummary,
} = require('./_shared/mail');

exports.handler = async () => {
  const requestId = generateRequestId();
  const status = await verifyTransport();
  const envSummary = getEnvSummary();

  if (!status.ok) {
    log('error', requestId, 'SMTP health check failed', {
      code: status.code,
      details: status.details || null,
      smtp_host: envSummary.smtp_host,
      smtp_port: envSummary.smtp_port,
      smtp_secure: envSummary.smtp_secure,
      smtp_require_tls: envSummary.smtp_require_tls,
    });
    return jsonResponse(500, {
      ok: false,
      ...status,
      ...envSummary,
      request_id: requestId,
    });
  }

  log('info', requestId, 'SMTP health check passed', {
    smtp_host: envSummary.smtp_host,
    smtp_port: envSummary.smtp_port,
    smtp_secure: envSummary.smtp_secure,
    smtp_require_tls: envSummary.smtp_require_tls,
  });

  return jsonResponse(200, {
    ok: true,
    ...status,
    ...envSummary,
    request_id: requestId,
  });
};

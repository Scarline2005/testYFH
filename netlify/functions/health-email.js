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
    log('error', requestId, 'SendGrid health check failed', {
      code: status.code,
      details: status.details || null,
      provider: envSummary.provider,
    });
    return jsonResponse(500, {
      ok: false,
      ...status,
      ...envSummary,
      request_id: requestId,
    });
  }

  log('info', requestId, 'SendGrid health check passed', {
    provider: envSummary.provider,
  });

  return jsonResponse(200, {
    ok: true,
    ...status,
    ...envSummary,
    request_id: requestId,
  });
};

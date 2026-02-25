const {
  generateRequestId,
  jsonResponse,
  log,
  processContactForm,
} = require('./_shared/mail');

const parseBody = (rawBody) => {
  const body = String(rawBody || '');
  const params = new URLSearchParams(body);
  return Object.fromEntries(params.entries());
};

exports.handler = async (event) => {
  const requestId = generateRequestId();

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {
      ok: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed',
      request_id: requestId,
    });
  }

  try {
    const body = parseBody(event.body);
    const result = await processContactForm(body, requestId);
    return jsonResponse(200, {
      ...result,
      request_id: requestId,
    });
  } catch (error) {
    const code = error.code === 'VALIDATION_ERROR' ? 400 : 500;
    return jsonResponse(code, {
      ok: false,
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || "Une erreur interne est survenue.",
      request_id: requestId,
    });
  }
};

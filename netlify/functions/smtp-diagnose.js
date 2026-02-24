const net = require('net');
const nodemailer = require('nodemailer');
const {
  env,
  envBool,
  generateRequestId,
  jsonResponse,
  log,
  smtpConfig,
  missingEnv,
} = require('./_shared/mail');

const requireToken = (event) => {
  const expected = env('DIAGNOSTIC_TOKEN');
  if (!expected) return null;
  const received = event.headers['x-diagnostic-token'] || event.headers['X-Diagnostic-Token'];
  if (received !== expected) {
    return {
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Token de diagnostic invalide.',
    };
  }
  return null;
};

const testTcpPort = (host, port, timeoutMs = 8000) =>
  new Promise((resolve) => {
    const startedAt = Date.now();
    const socket = net.createConnection({ host, port });
    let settled = false;

    const done = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({
        ...result,
        latency_ms: Date.now() - startedAt,
      });
    };

    socket.setTimeout(timeoutMs);
    socket.on('connect', () => done({ ok: true }));
    socket.on('timeout', () => done({ ok: false, error: 'ETIMEDOUT' }));
    socket.on('error', (error) => done({ ok: false, error: error?.code || error?.message || 'UNKNOWN' }));
  });

const testSmtpVerify = async (host, port, authUser, authPass) => {
  const secure = port === 465;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: port === 587,
    auth: authUser && authPass ? { user: authUser, pass: authPass } : undefined,
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 20000,
    logger: envBool('SMTP_LOGGER', true),
    debug: envBool('SMTP_DEBUG', true),
    tls: {
      servername: host,
      minVersion: 'TLSv1.2',
      rejectUnauthorized: envBool('SMTP_TLS_REJECT_UNAUTHORIZED', true),
    },
  });

  try {
    await transporter.verify();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      errorCode: error?.code || null,
      responseCode: error?.responseCode || null,
      command: error?.command || null,
      response: error?.response || null,
      message: error?.message || null,
    };
  }
};

exports.handler = async (event) => {
  const requestId = generateRequestId();
  const authError = requireToken(event);
  if (authError) {
    return jsonResponse(401, {
      ...authError,
      request_id: requestId,
    });
  }

  if (missingEnv.length) {
    return jsonResponse(500, {
      ok: false,
      code: 'SMTP_NOT_CONFIGURED',
      message: `Configuration SMTP manquante: ${missingEnv.join(', ')}`,
      request_id: requestId,
    });
  }

  const host = smtpConfig.host;
  const authUser = smtpConfig.user;
  const authPass = smtpConfig.pass;
  const ports = [25, 465, 587];

  const tcpResults = [];
  const smtpResults = [];

  for (const port of ports) {
    const tcp = await testTcpPort(host, port);
    tcpResults.push({ port, ...tcp });
    if (tcp.ok) {
      const smtp = await testSmtpVerify(host, port, authUser, authPass);
      smtpResults.push({ port, ...smtp });
    } else {
      smtpResults.push({ port, ok: false, skipped: true, reason: `TCP failed: ${tcp.error}` });
    }
  }

  const configuredPort = smtpConfig.port;
  const configuredVerify = await testSmtpVerify(host, configuredPort, authUser, authPass);

  const payload = {
    ok: true,
    host,
    configured_port: configuredPort,
    configured_secure: smtpConfig.secure,
    configured_require_tls: smtpConfig.requireTLS,
    tcp_tests: tcpResults,
    smtp_verify_tests: smtpResults,
    configured_smtp_verify: configuredVerify,
    request_id: requestId,
    now: new Date().toISOString(),
  };

  log('info', requestId, 'SMTP diagnostics executed', payload);
  return jsonResponse(200, payload);
};

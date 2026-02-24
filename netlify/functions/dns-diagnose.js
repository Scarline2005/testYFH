const dns = require('dns').promises;
const {
  env,
  generateRequestId,
  jsonResponse,
  log,
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

const safeResolveTxt = async (name) => {
  try {
    const values = await dns.resolveTxt(name);
    return { ok: true, records: values.map((parts) => parts.join('')) };
  } catch (error) {
    return { ok: false, error: error?.code || error?.message || 'UNKNOWN' };
  }
};

const hasSpf = (records) => records.some((line) => line.toLowerCase().startsWith('v=spf1'));
const hasDmarc = (records) => records.some((line) => line.toLowerCase().startsWith('v=dmarc1'));

exports.handler = async (event) => {
  const requestId = generateRequestId();
  const authError = requireToken(event);
  if (authError) {
    return jsonResponse(401, {
      ...authError,
      request_id: requestId,
    });
  }

  const domain = env('EXPECTED_SENDER_DOMAIN', env('MAIL_DOMAIN', 'youthfoundationhaiti.org'));
  const selectorsRaw = env('DKIM_SELECTORS', 'default,mail,google');
  const selectors = selectorsRaw.split(',').map((value) => value.trim()).filter(Boolean);

  const rootTxt = await safeResolveTxt(domain);
  const dmarcTxt = await safeResolveTxt(`_dmarc.${domain}`);

  const dkim = [];
  for (const selector of selectors) {
    const fqdn = `${selector}._domainkey.${domain}`;
    const result = await safeResolveTxt(fqdn);
    dkim.push({ selector, fqdn, ...result });
  }

  const rootRecords = rootTxt.ok ? rootTxt.records : [];
  const dmarcRecords = dmarcTxt.ok ? dmarcTxt.records : [];

  const payload = {
    ok: true,
    domain,
    checks: {
      spf: {
        present: rootTxt.ok && hasSpf(rootRecords),
        records: rootRecords,
      },
      dmarc: {
        present: dmarcTxt.ok && hasDmarc(dmarcRecords),
        records: dmarcRecords,
      },
      dkim,
    },
    request_id: requestId,
    now: new Date().toISOString(),
  };

  log('info', requestId, 'DNS diagnostics executed', payload);
  return jsonResponse(200, payload);
};

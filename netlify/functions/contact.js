const {
  generateRequestId,
  jsonResponse,
  log,
  smtpConfig,
  createTransporter,
  missingEnv,
  diagnoseSmtpError,
  assertSenderDomain,
} = require('./_shared/mail');

const field = (value) => String(value || '').trim();
const escapeHtml = (value) =>
  field(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const parseBody = (rawBody) => {
  const body = String(rawBody || '');
  const params = new URLSearchParams(body);
  return Object.fromEntries(params.entries());
};

const buildEmailHtml = (data) => `
  <h2>Nouvelle inscription - Youth Foundation Haiti</h2>
  <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
    <tr><th align="left">Nom complet</th><td>${escapeHtml(data.full_name)}</td></tr>
    <tr><th align="left">Email</th><td>${escapeHtml(data.email)}</td></tr>
    <tr><th align="left">Date de naissance</th><td>${escapeHtml(data.birth_date)}</td></tr>
    <tr><th align="left">Adresse complete</th><td>${escapeHtml(data.full_address)}</td></tr>
    <tr><th align="left">Telephone / WhatsApp</th><td>${escapeHtml(data.whatsapp_phone)}</td></tr>
    <tr><th align="left">Sexe</th><td>${escapeHtml(data.gender)}</td></tr>
    <tr><th align="left">Niveau d'etudes</th><td>${escapeHtml(data.education_level)}</td></tr>
    <tr><th align="left">Profession / Statut</th><td>${escapeHtml(data.profession_status)}</td></tr>
  </table>
`;

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

  if (missingEnv.length) {
    log('error', requestId, 'SMTP missing env for contact submission', { missingEnv });
    return jsonResponse(500, {
      ok: false,
      code: 'SMTP_NOT_CONFIGURED',
      message: `Configuration SMTP manquante: ${missingEnv.join(', ')}`,
      request_id: requestId,
    });
  }

  const senderError = assertSenderDomain();
  if (senderError) {
    log('error', requestId, 'Sender domain mismatch', senderError);
    return jsonResponse(500, {
      ok: false,
      ...senderError,
      request_id: requestId,
    });
  }

  const body = parseBody(event.body);
  const fullName = field(body.full_name);
  const email = field(body.email);
  const birthDate = field(body.birth_date);
  const fullAddress = field(body.full_address);
  const whatsappPhone = field(body.whatsapp_phone);
  const gender = field(body.gender);
  const genderOther = field(body.gender_other);
  const education = field(body.education_level);
  const educationOther = field(body.education_other);
  const profession = field(body.profession_status);

  const finalGender = gender === 'Autre' ? genderOther : gender;
  const finalEducation = education === 'Autre' ? educationOther : education;
  const required = [fullName, email, birthDate, fullAddress, whatsappPhone, finalGender, finalEducation, profession];

  if (required.some((value) => !value)) {
    return jsonResponse(400, {
      ok: false,
      code: 'VALIDATION_REQUIRED_FIELDS',
      message: 'Veuillez remplir tous les champs obligatoires.',
      request_id: requestId,
    });
  }

  const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicEmailRegex.test(email)) {
    return jsonResponse(400, {
      ok: false,
      code: 'VALIDATION_EMAIL_INVALID',
      message: "L'adresse email est invalide.",
      request_id: requestId,
    });
  }

  const transporter = createTransporter();
  try {
    const info = await transporter.sendMail({
      from: `"YFH Formulaire" <${smtpConfig.mailFrom}>`,
      to: smtpConfig.mailTo,
      replyTo: email,
      subject: 'Nouvelle inscription - Youth Foundation Haiti',
      text: [
        `Nom complet: ${fullName}`,
        `Email: ${email}`,
        `Date de naissance: ${birthDate}`,
        `Adresse complete: ${fullAddress}`,
        `Telephone / WhatsApp: ${whatsappPhone}`,
        `Sexe: ${finalGender}`,
        `Niveau d'etudes: ${finalEducation}`,
        `Profession / Statut: ${profession}`,
      ].join('\n'),
      html: buildEmailHtml({
        full_name: fullName,
        email,
        birth_date: birthDate,
        full_address: fullAddress,
        whatsapp_phone: whatsappPhone,
        gender: finalGender,
        education_level: finalEducation,
        profession_status: profession,
      }),
    });

    log('info', requestId, 'Contact form email sent', {
      messageId: info?.messageId || null,
      smtpResponse: info?.response || null,
      envelope: info?.envelope || null,
      accepted: info?.accepted || [],
      rejected: info?.rejected || [],
      pending: info?.pending || [],
      to: smtpConfig.mailTo,
      from: smtpConfig.mailFrom,
    });

    return jsonResponse(200, {
      ok: true,
      code: 'EMAIL_SENT',
      message: 'Votre inscription a ete envoyee avec succes.',
      request_id: requestId,
      smtp: {
        messageId: info?.messageId || null,
        accepted: info?.accepted || [],
        rejected: info?.rejected || [],
        response: info?.response || null,
      },
    });
  } catch (error) {
    const diagnostic = diagnoseSmtpError(error);
    const smtpError = {
      code: diagnostic.code,
      errorCode: error?.code || null,
      responseCode: error?.responseCode || null,
      command: error?.command || null,
      response: error?.response || null,
      message: error?.message || null,
      stack: error?.stack || null,
    };

    log('error', requestId, 'SMTP send failed', smtpError);

    return jsonResponse(500, {
      ok: false,
      code: diagnostic.code,
      message: diagnostic.message,
      request_id: requestId,
      smtp_error: smtpError,
    });
  }
};

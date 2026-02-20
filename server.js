const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config({ override: true });

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Local dev CORS support (e.g. frontend served on another port)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

const env = (key) => String(process.env[key] || '').trim();

const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_TO'];
const missingEnv = requiredEnv.filter((key) => !env(key));

let transporter = null;
if (!missingEnv.length) {
  transporter = nodemailer.createTransport({
    host: env('SMTP_HOST'),
    port: Number(env('SMTP_PORT')),
    secure: String(env('SMTP_SECURE') || 'false') === 'true',
    auth: {
      user: env('SMTP_USER'),
      pass: env('SMTP_PASS'),
    },
  });
}

const field = (value) => String(value || '').trim();

const buildEmailHtml = (data) => `
  <h2>Nouvelle inscription - Youth Foundation Haiti</h2>
  <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
    <tr><th align="left">Nom complet</th><td>${data.full_name}</td></tr>
    <tr><th align="left">Email</th><td>${data.email}</td></tr>
    <tr><th align="left">Date de naissance</th><td>${data.birth_date}</td></tr>
    <tr><th align="left">Adresse complete</th><td>${data.full_address}</td></tr>
    <tr><th align="left">Telephone / WhatsApp</th><td>${data.whatsapp_phone}</td></tr>
    <tr><th align="left">Sexe</th><td>${data.gender}</td></tr>
    <tr><th align="left">Niveau d'etudes</th><td>${data.education_level}</td></tr>
    <tr><th align="left">Profession / Statut</th><td>${data.profession_status}</td></tr>
  </table>
`;

app.post('/api/contact', async (req, res) => {
  if (!transporter) {
    return res.status(500).json({
      ok: false,
      message: `Configuration SMTP manquante: ${missingEnv.join(', ')}`,
    });
  }

  const fullName = field(req.body.full_name);
  const email = field(req.body.email);
  const birthDate = field(req.body.birth_date);
  const fullAddress = field(req.body.full_address);
  const whatsappPhone = field(req.body.whatsapp_phone);
  const gender = field(req.body.gender);
  const genderOther = field(req.body.gender_other);
  const education = field(req.body.education_level);
  const educationOther = field(req.body.education_other);
  const profession = field(req.body.profession_status);

  const finalGender = gender === 'Autre' ? genderOther : gender;
  const finalEducation = education === 'Autre' ? educationOther : education;

  const required = [
    fullName,
    email,
    birthDate,
    fullAddress,
    whatsappPhone,
    finalGender,
    finalEducation,
    profession,
  ];

  if (required.some((value) => !value)) {
    return res.status(400).json({
      ok: false,
      message: 'Veuillez remplir tous les champs obligatoires.',
    });
  }

  try {
    await transporter.sendMail({
      from: `"YFH Formulaire" <${env('SMTP_USER')}>`,
      to: env('MAIL_TO'),
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

    return res.json({
      ok: true,
      message: 'Votre inscription a ete envoyee avec succes.',
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Echec d'envoi de l'email. Verifiez la configuration SMTP.",
      error: error.message,
    });
  }
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`YFH server running on http://localhost:${port}`);
});

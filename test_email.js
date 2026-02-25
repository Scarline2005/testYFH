require('dotenv').config();
const { processContactForm } = require('./netlify/functions/_shared/mail');

console.log('🔍 Test de configuration Email (SendGrid)...');

if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ ERREUR: SENDGRID_API_KEY manquant dans le fichier .env');
  process.exit(1);
}

(async () => {
  try {
    console.log(`📧 Tentative d'envoi de ${process.env.MAIL_FROM} vers ${process.env.MAIL_TO}...`);
    
    const result = await processContactForm({
      full_name: 'Testeur Local',
      email: 'test@example.com',
      birth_date: '2000-01-01',
      full_address: '123 Rue Test',
      whatsapp_phone: '+50900000000',
      gender: 'Masculin',
      education_level: 'Autre',
      education_other: 'Test',
      profession_status: 'Developpeur'
    }, 'TEST-' + Date.now());
    
    console.log('✅ SUCCÈS :', result.message);
    console.log('👉 Vérifiez votre boîte de réception (et les spams).');
  } catch (error) {
    console.error('❌ ÉCHEC :', error.message);
    // Note: Les détails techniques sont affichés dans la console par la fonction processContactForm
  }
})();

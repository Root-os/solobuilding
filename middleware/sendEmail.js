const nodemailer = require('nodemailer');
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = require('../config/config');

const sendEmail = async (to, subject, text, html = null) => {
  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT == 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject,
    text,
    ...(html && { html }), // Include html only if provided
  };

try {
  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent to ${to}: ${info.messageId}`);
  return { success: true, message: 'Email sent successfully!' };
} catch (error) {
  console.error('❌ Error sending email:', error);
  return { success: false, error: error.message };
}

};

module.exports = sendEmail;
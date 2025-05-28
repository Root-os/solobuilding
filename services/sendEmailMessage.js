const sendEmail = require('../middleware/sendEmail');

const sendEmailMessage = async ({ email, fullName, title, body }) => {
  const subject = title;

  // Plain text version
  const text = `Hello ${fullName},\n\n${body}\n\nRegards,\nApartment Management Team`;

  // Basic HTML version without template
  const html = `
    <p>Hello ${fullName},</p>
    <p>${body}</p>
    <p>Regards,<br>Apartment Management Team</p>
  `;

  // Send email
  return await sendEmail(email, subject, text, html);
};

module.exports = sendEmailMessage;

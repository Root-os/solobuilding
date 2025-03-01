const nodemailer = require('nodemailer');
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = require('../config/config'); // Import centralized config

const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_PORT == 465, // Secure if using port 465 (true/false)
        auth: {
          user: EMAIL_USER,  
          pass: EMAIL_PASS
        },
    });

    const mailOptions = {
        from: EMAIL_FROM, 
        to,
        subject,
        text,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: 'Email sent successfully!' };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = sendEmail;


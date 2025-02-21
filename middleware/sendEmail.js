const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        secure: process.env.EMAIL_SECURE, 
        port:  process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,  
          pass: process.env.EMAIL_PASS
        },
    });

    const mailOptions = {
        from: `"${process.env.EMAIL_SENDER_NAME}" <${process.env.EMAIL_USER}>`,
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

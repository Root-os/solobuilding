const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsAppMessage = async ({ phone, message }) => {
  try {
    console.log("=== WhatsApp Debug Start ===");
    console.log("FROM:", process.env.TWILIO_WHATSAPP_NUMBER);
    console.log("TO:", phone);
    console.log("MESSAGE:", message);

    const response = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${phone}`,
      body: message,
    });

    console.log("WhatsApp sent successfully");
    console.log("SID:", response.sid);
    console.log("STATUS:", response.status);
    console.log("=== WhatsApp Debug End ===");

    return response;
  } catch (error) {
    console.error("=== WhatsApp Error ===");

    console.error("MESSAGE:", error.message);

    if (error.code) {
      console.error("CODE:", error.code);
    }

    if (error.moreInfo) {
      console.error("MORE INFO:", error.moreInfo);
    }

    console.error(error);

    throw error;
  }
};

module.exports = sendWhatsAppMessage;
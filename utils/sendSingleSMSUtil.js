const axios = require("axios");
require("dotenv").config();
function createSingleSMSUtil({ token }) {
  const baseUrl = "https://api.geezsms.com/api/v1";

  async function sendSingleSMS({ phone, msg, shortcode_id, callback }) {
    callback = callback || process.env.GEEZSMS_WEBHOOK_URL;
    if (!phone || !msg) throw new Error("Phone and message are required");
    if (phone.startsWith("09")) {
      phone = phone.replace(/^09/, "2519");
    } else if (phone.startsWith("07")) {
      phone = phone.replace(/^07/, "2517");
    } else if (!phone.startsWith("251")) {
      throw new Error("Phone number must start with 09, 07, or 251");
    }
    if (!phone.match(/^251(9|7)\d{7,8}$/))
      throw new Error("Phone must be in format 251[9|7]xxxxxxxx[x]");

    const url = `${baseUrl}/sms/send`;
    const formData = new URLSearchParams();
    formData.append("token", token);
    formData.append("phone", phone);
    formData.append("msg", msg);
    if (shortcode_id) formData.append("shortcode_id", shortcode_id);
    if (callback) formData.append("callback", callback);

    try {
      const response = await axios.post(url, formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to send SMS");
    }
  }

  return { sendSingleSMS };
}

module.exports = createSingleSMSUtil;

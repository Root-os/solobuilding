const axios = require("axios");

function createOtpUtil({ token }) {
  const baseUrl = "https://api.geezsms.com/api/v1";

  async function sendOtp({ phone, shortcode_id }) {
    if (!phone) throw new Error("Phone is required");
    if (!phone.match(/^251(09|07)\d{7,8}$/))
      throw new Error("Phone must be in format 251[09|07]xxxxxxxx[x]");

    const url = `${baseUrl}/sms/otp`;
    const formData = new URLSearchParams();
    formData.append("token", token);
    formData.append("phone", phone);
    if (shortcode_id) formData.append("shortcode_id", shortcode_id);

    try {
      const response = await axios.post(url, formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to send OTP");
    }
  }

  return { sendOtp };
}

module.exports = createOtpUtil;

const axios = require("axios");

function createBulkSMSUtil({ token }) {
  const baseUrl = "https://api.geezsms.com/api/v1";

  async function sendBulkSMS({ contacts, msg, sender_id, notify_url }) {
    if (!contacts || !msg) throw new Error("Contacts and message are required");
    if (!Array.isArray(contacts) || contacts.length === 0)
      throw new Error("Contacts must be a non-empty array");

    const normalizedContacts = contacts.map((phone) => {
      if (phone.startsWith("09")) {
        return phone.replace(/^09/, "2519");
      } else if (phone.startsWith("07")) {
        return phone.replace(/^07/, "2517");
      } else if (!phone.startsWith("251")) {
        throw new Error(`Phone ${phone} must start with 09, 07, or 251`);
      }
      return phone;
    });

    if (!normalizedContacts.every((phone) => phone.match(/^251(9|7)\d{7,8}$/)))
      throw new Error("All contacts must be in format 251[9|7]xxxxxxxx[x]");

    // Format contacts as objects with phone_number
    const formattedContacts = normalizedContacts.map((phone) => ({
      phone_number: phone,
    }));

    const url = `${baseUrl}/sms/send/bulk`;
    const body = { token, contacts: formattedContacts, msg };
    if (sender_id) body.sender_id = sender_id;
    if (notify_url) body.notify_url = notify_url;

    try {
      const response = await axios.post(url, body, {
        headers: { "Content-Type": "application/json" },
      });
      // Log response for debugging
      console.log(
        "GeezSMS bulk response:",
        JSON.stringify(response.data, null, 2)
      );
      return {
        error: response.data.error || false,
        msg: response.data.msg || "BULK_SMS_SENT_SUCCESSFULLY",
        data: response.data.data || { api_log_id: null },
      };
    } catch (error) {
      console.error(
        "GeezSMS bulk error:",
        JSON.stringify(error.response?.data || error.message, null, 2)
      );
      throw new Error(
        error.response?.data?.msg || `Failed to send bulk SMS: ${error.message}`
      );
    }
  }

  return { sendBulkSMS };
}

module.exports = createBulkSMSUtil;

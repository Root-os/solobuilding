const formatWhatsAppPhone = (phone) => {
  if (phone.startsWith("09")) {
    return "+251" + phone.substring(1);
  }

  if (!phone.startsWith("+")) {
    return `+${phone}`;
  }

  return phone;
};

const formatSMSPhone = (phone) => {
  if (phone.startsWith("+251")) {
    return phone.substring(1);
  }

  if (phone.startsWith("09")) {
    return "251" + phone.substring(1);
  }

  return phone;
};

module.exports = {
  formatWhatsAppPhone,
  formatSMSPhone,
};
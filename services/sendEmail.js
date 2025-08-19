const fs = require("fs").promises;
const path = require("path");
const sendEmail = require("../middleware/sendEmail"); // Adjust the path as needed

const sendTenantWelcomeEmail = async ({
  email,
  fullName,
  generatedPassword,
  phoneNumber,
  floorNumber,
  unitNumber,
  leaseStartDate,
  leaseEndDate,
  downloadApk,
}) => {
  const subject = "Welcome to Your Tenant Portal – Login Credentials";
  // const loginUrl = 'https://apartmentfront.bruktiethiotour.com/tenant-login';
  const loginUrl = process.env.TENANT_PORTAL_URL;

  // Plain text version
  const text = `Hello ${fullName},

Welcome to the tenant portal! Your login credentials:

Email: ${email}
Password: ${generatedPassword}

Please log in and change your password immediately:
${loginUrl}

Regards,
Apartment Management Team`;

  // Load HTML template
  const templatePath = path.join(__dirname, "./emailtemplate.html");
  let html;
  try {
    html = await fs.readFile(templatePath, "utf-8");
  } catch (error) {
    console.error("Error reading email template:", error);
    throw new Error("Failed to load email template");
  }

  const leaseEndDateDisplay = leaseEndDate || "not specified yet";

  // Replace placeholders in HTML
  html = html
    .replace("{{fullName}}", fullName)
    .replace("{{email}}", email)
    .replace("{{generatedPassword}}", generatedPassword)
    .replace("{{loginUrl}}", loginUrl)
    .replace("{{phoneNumber}}", phoneNumber)
    .replace("{{floorNumber}}", floorNumber)
    .replace("{{unitNumber}}", unitNumber)
    .replace("{{leaseStartDate}}", leaseStartDate)
    .replace("{{leaseEndDate}}", leaseEndDateDisplay)
    .replace("{{downloadApk}}", downloadApk);

  // Send email
  return await sendEmail(email, subject, text, html);
};

module.exports = sendTenantWelcomeEmail;

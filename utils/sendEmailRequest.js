const sendEmail = require("../middleware/sendEmail");

const sendTenantPaymentRequestEmail = async ({
  email,
  fullName,
  billType,
  amount,
  dueDate,
  paymentLink,
  floorNumber,
  unitNumber,
  loginUrl,
  message,
}) => {
  const subject = "New Payment Request";

  const text = `
Hello ${fullName},

A new ${billType} payment request has been created.

Floor: ${floorNumber}
Unit: ${unitNumber}
Amount: ${amount}
Due Date: ${dueDate}

${message ? `Message: ${message}` : ""}

View payment request:
${paymentLink}

Login:
${loginUrl}

Thank you.
`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Payment Request Notice</h2>

      <p>Hello <strong>${fullName}</strong>,</p>

      <p>
        A new <strong>${billType}</strong> payment request has been created.
      </p>

      <ul>
        <li><strong>Floor:</strong> ${floorNumber}</li>
        <li><strong>Unit:</strong> ${unitNumber}</li>
        <li><strong>Amount:</strong> ${amount}</li>
        <li><strong>Due Date:</strong> ${dueDate}</li>
      </ul>

      ${
        message
          ? `<p><strong>Message:</strong> ${message}</p>`
          : ""
      }

      <p>
        <a href="${paymentLink}">
          View Payment Request
        </a>
      </p>

      <p>
        <a href="${loginUrl}">
          Login to Tenant Portal
        </a>
      </p>

      <br />

      <p>Thank you.</p>
    </div>
  `;

  return await sendEmail(email, subject, text, html);
};

module.exports = sendTenantPaymentRequestEmail;
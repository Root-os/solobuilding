const PaymentRequest = require("../models/paymentRequests");
const PaymentSetting = require("../models/paymentSetting");
const { getCBE_TransactionDetail } = require("../utils/cbepdfParser");

// helpers (copied from your controller)
const digitsOnly = (s) => String(s || "").replace(/\D/g, "");
const lastN = (s, n) => s.slice(-n);
const toAmount = (v) => parseFloat(String(v).replace(/[^\d.]/g, ""));

async function verifyCBE(paymentRequestId, transactionNumber) {
  // 1. Load payment request
  const request = await PaymentRequest.findByPk(paymentRequestId);
  if (!request) throw new Error("Payment request not found");

  if (request.status !== "pending") {
    throw new Error("Payment request already processed");
  }

  // 2. Load CBE payment setting
  const setting = await PaymentSetting.findOne({
    where: { paymentMethod: "cbe" },
  });
  console.log("CBE Setting:", setting);
  if (!setting) throw new Error("CBE payment setting not configured");

  // 3. Parse receipt
  const parsed = await getCBE_TransactionDetail(transactionNumber);
  if (parsed.error) throw new Error(parsed.error);

  // 4. Validate receiver account (LAST 4 DIGITS)
  const expectedLast4 = lastN(
    digitsOnly(setting.receiverAccountNumber),
    4
  );
  console.log("Expected Last4:", expectedLast4, "from setting account:", setting.receiverAccountNumber);
  const actualLast4 = lastN(
    digitsOnly(parsed.receiverAccount),
    4
  );

  if (expectedLast4 !== actualLast4) {
    console.log("Expected Last4:", expectedLast4, "Actual Last4:", actualLast4);
    throw new Error("Payment was sent to a wrong CBE account" );
  }

  // 5. Validate receiver name
  const expectedName = setting.receiverName.trim().toLowerCase();
  const actualName = parsed.receiver.trim().toLowerCase();

  if (expectedName && expectedName !== actualName) {
    throw new Error(`Receiver name mismatch (${parsed.receiver})`);
  }

  // 6. Validate amount
  const fetchedAmount = toAmount(parsed.transferredAmount);
  if (
    !Number.isFinite(fetchedAmount) ||
    Math.abs(fetchedAmount - request.amount) > 0.01
  ) {
    throw new Error(
      `Amount mismatch. Expected ${request.amount}, got ${fetchedAmount}`
    );
  }

  // 7. Approve payment request
  await request.update({
    status: "approved",
    transactionNumber,
    bank: "cbe",
  });

  return {
    approved: true,
    parsed,
  };
}

module.exports = { verifyCBE };

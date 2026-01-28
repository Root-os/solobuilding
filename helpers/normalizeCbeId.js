/**
 * Normalize transaction number before verification
 * - Only applies to CBE
 * - If bare FT (12 chars), append last 8 digits of receiver account
 */
const digitsOnly = (s) => String(s || "").replace(/\D/g, "");
const lastN = (s, n) => s.slice(-n);

const normalizeTransactionNumber = ({
  paymentMethod,
  transactionNumber,
  paymentSetting,
}) => {
  if (
    !paymentMethod ||
    !transactionNumber ||
    !paymentSetting
  ) {
    return transactionNumber;
  }

  if (paymentMethod.toLowerCase() !== "cbe") {
    return transactionNumber;
  }

  const trimmed = String(transactionNumber).trim().toUpperCase();

  // Bare FT case: FT + 10 chars = 12 total
  const isBareFT =
    trimmed.startsWith("FT") &&
    trimmed.length === 12 &&
    /^[A-Z0-9]+$/.test(trimmed);

  if (!isBareFT) {
    return transactionNumber;
  }

  const accountDigits = digitsOnly(paymentSetting.receiverAccountNumber);
  if (!accountDigits || accountDigits.length < 8) {
    throw new Error("Invalid CBE receiver account configuration");
  }

  const last8 = lastN(accountDigits, 8);

  return trimmed + last8;
};

module.exports = { normalizeTransactionNumber };

const { Tenant, TenantRentCollection } = require("../models");

const toDateUTC = (dateStr) => {
  const [y, m, d] = dateStr.split("-");
  return new Date(Date.UTC(y, m - 1, d));
};

exports.collectFirstRent = async ({
  tenantId,
  leaseStartDate,
  leaseEndDate,
  paymentMethod = "cash",
}) => {
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) throw new Error("Tenant not found");

  const paymentDateObj = toDateUTC(leaseStartDate);
  const nextDueDateObj = toDateUTC(leaseEndDate);

  const dailyRate = tenant.amount / 30;
  const totalDays =
    Math.round((nextDueDateObj - paymentDateObj) / (1000 * 60 * 60 * 24)) + 1;

  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;

  let paidDays = "";
  if (months > 0) paidDays += `${months} month${months > 1 ? "s" : ""} `;
  if (days > 0) paidDays += `${days} day${days > 1 ? "s" : ""}`;
  paidDays = paidDays.trim();

  const amountPaid = dailyRate * totalDays;

  const rentPayment = await TenantRentCollection.create({
    tenantId,
    paymentDate: leaseStartDate,
    nextDueDate: leaseEndDate,
    paymentMethod,
    paidDays,
    amountPaid,
    status: "Paid",
    punishment: 0,
    isPaid: false,
  });

  tenant.paymentStatus = "paid";
  tenant.leaseEndDate = leaseEndDate;
  await tenant.save();

  return rentPayment;
};

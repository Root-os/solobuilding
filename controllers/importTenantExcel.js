const XLSX = require("xlsx");
const bcrypt = require("bcryptjs");
const Tenant = require("../models/tenant");
const Floor = require("../models/floor");
const Unit = require("../models/unit");
const excelUpload = require("../middleware/excelUploads");
const sendTenantWelcomeEmail = require("../services/sendEmail");
const createSingleSMSUtil = require("../utils/sendSingleSMSUtil");
const { toGregorian } = require("ethiopian-date"); 

exports.importTenants = async (req, res) => {
  try {
    excelUpload(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: "Excel file is required" });

      const workbook = XLSX.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { raw: false, cellDates: true });

      const results = [];

      // --- Helper to parse dates (EC -> GC, GC, or default GC) ---
      const parseDate = (value) => {
        if (!value) return null;

        // If already a Date object from Excel
        if (value instanceof Date && !isNaN(value)) return value;

        const val = value.toString().trim().toUpperCase();

        // EC suffix (convert to GC)
        if (val.endsWith("EC")) {
          const [m, d, y] = val.replace("EC", "").split("/").map(Number);
          const [gy, gm, gd] = toGregorian(y, m, d);
          return new Date(Date.UTC(gy, gm - 1, gd));
        }

        // GC suffix
        if (val.endsWith("GC")) {
          const [m, d, y] = val.replace("GC", "").split("/").map(Number);
          return new Date(Date.UTC(y, m - 1, d));
        }

        // Unsuffixed: treat as GC
        const parts = val.split("/").map(s => Number(s.trim()));
        if (parts.length === 3) {
          let [m, d, y] = parts;

          if (!m || !d || !y) {
            throw new Error(`Invalid date format: "${value}"`);
          }

          // 🔥 Fix Excel 2-digit year issue
          if (y < 100) {
            y += y >= 70 ? 1900 : 2000;
          }

          return new Date(Date.UTC(y, m - 1, d));
        }
        throw new Error(`Unrecognized date format: "${value}"`);
      };

      for (const row of rows) {
        try {
          // --- Parse dates ---
          const leaseStartDate = parseDate(row["Lease Start Date"]);
          const leaseEndDate = parseDate(row["Lease End Date"]);
          const contractEndDate = parseDate(row["Contract End Date"]);

          // --- Resolve floor & unit ---
          const floor = await Floor.findOne({ where: { floorNumber: row.Floor } });
          if (!floor) throw new Error(`Floor "${row.Floor}" not found`);

          const unit = await Unit.findOne({
            where: { unitNumber: row["Unit Number"], floorId: floor.id },
          });
          if (!unit) throw new Error(`Unit "${row["Unit Number"]}" not found on Floor "${row.Floor}"`);
          if (unit.status !== "available") throw new Error(`Unit "${unit.unitNumber}" is not available`);

          // --- Check tenant existence by phoneNumber ---
          const existingTenant = await Tenant.findOne({ where: { phoneNumber: row["Phone Number"] } });

          // Allow same phone if fullName matches, else prevent
          if (existingTenant && existingTenant.fullName !== row["Full Name"]) {
            results.push({
              row: row["Full Name"],
              success: false,
              error: "Phone number already exists with a different full name",
            });
            continue; // skip creation
          }

          // --- Generate password ---
          let password = null;
          let hashedPassword;
          const shouldNotify = !existingTenant;

          if (existingTenant && existingTenant.fullName === row["Full Name"]) {
            hashedPassword = existingTenant.password; // reuse existing
          } else {
            password = Math.floor(1000 + Math.random() * 9000).toString();
            hashedPassword = await bcrypt.hash(password, 10);
          }

          // --- Create tenant record ---
          const tenant = await Tenant.create({
            fullName: row["Full Name"],
            phoneNumber: row["Phone Number"],
            email: row.Email || null,
            nationalId: row["National ID"] || null,
            tin: row.TIN || null,
            amount: row.Rent || 0,
            advance: row.Advance || 0,
            leaseStartDate,
            leaseEndDate,
            contractEndDate,
            additionalNotes: row["Additional Notes"] || null,
            password: hashedPassword,
            floorId: floor.id,
            unitId: unit.id,
            status: "active",
          });

          // --- Update unit status ---
          await Unit.update({ status: "occupied" }, { where: { id: unit.id } });

          // --- Send email if new tenant ---
          // if (shouldNotify && tenant.email) {
          //   try {
          //     await sendTenantWelcomeEmail({
          //       email: tenant.email,
          //       fullName: tenant.fullName,
          //       generatedPassword: password,
          //       phoneNumber: tenant.phoneNumber,
          //       floorNumber: floor.floorNumber,
          //       unitNumber: unit.unitNumber,
          //       leaseStartDate,
          //       leaseEndDate,
          //       loginUrl: process.env.TENANT_PORTAL_URL,
          //       downloadApk: process.env.DOWNLOAD_APK_URL,
          //     });
          //   } catch (emailErr) {
          //     console.error("Email failed:", emailErr.message);
          //   }
          // }

          // --- Send SMS if new tenant ---
          // if (shouldNotify) {
          //   try {
          //     const smsUtil = createSingleSMSUtil({ token: process.env.GEEZSMS_TOKEN });
          //     const smsMessage =
          //       `Welcome ${tenant.fullName}!\n` +
          //       `Your tenant account is created.\n` +
          //       `Floor: ${floor.floorNumber}, Unit: ${unit.unitNumber}\n` +
          //       `Phone: ${tenant.phoneNumber}\n` +
          //       `Rented from: ${leaseStartDate?.toLocaleDateString() || "N/A"} To ${leaseEndDate?.toLocaleDateString() || "N/A"}\n` +
          //       `Username: ${tenant.email || tenant.phoneNumber}\nPassword: ${password}\n` +
          //       `Please log in: ${process.env.TENANT_PORTAL_URL}\n` +
          //       `Download app: ${process.env.DOWNLOAD_APK_URL}`;

          //     await smsUtil.sendSingleSMS({
          //       phone: tenant.phoneNumber,
          //       msg: smsMessage,
          //       callback: process.env.GEEZSMS_WEBHOOK_URL,
          //     });
          //   } catch (smsErr) {
          //     console.error("SMS failed:", smsErr.message);
          //   }
          // }

          results.push({ row: tenant.fullName, success: true, password });
        } catch (rowError) {
          results.push({ row: row["Full Name"] || "Unknown", success: false, error: rowError.message });
        }
      }

      res.json({ success: true, results });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

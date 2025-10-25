const { toEthiopian, toGregorian } = require("ethiopian-date");

exports.convertCalendar = (req, res) => {
  const { year, month, day, target } = req.query;

  if (!year || !month || !day || !target) {
    return res.status(400).json({ error: "Missing query parameters" });
  }

  try {
    let result;

    if (target === "EC") {
      // Gregorian → Ethiopian
      const [ey, em, ed] = toEthiopian(+year, +month, +day);
      result = { calendar: "Ethiopian", date: `${ey}-${em}-${ed}` };
    } else if (target === "GC") {
      // Ethiopian → Gregorian
      const [gy, gm, gd] = toGregorian(+year, +month, +day);
      result = { calendar: "Gregorian", date: `${gy}-${gm}-${gd}` };
    } else {
      return res.status(400).json({ error: "Invalid target. Use 'EC' or 'GC'." });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
};

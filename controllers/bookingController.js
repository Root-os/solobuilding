const Booking = require('../models/bookRoom');
const Unit = require('../models/unit');

exports.createBooking = async (req, res) => {
  try {
    const { unitId, fullName, phoneNumber, email, startDate, endDate } = req.body;

    // Check if unit exists
    const unit = await Unit.findByPk(unitId);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Create booking
    const booking = await Booking.create({
      unitId,
      fullName,
      phoneNumber,
      email,
      startDate,
      endDate
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({ include: Unit });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await booking.destroy();
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
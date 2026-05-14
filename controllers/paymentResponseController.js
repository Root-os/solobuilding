const PaymentResponse = require('../models/verifiedPayments');
const PaymentSetting = require('../models/paymentSetting');



exports.getAllPaymentResponses = async (req, res) => {
  try {
    const responses = await PaymentResponse.findAll({
      order: [['createdAt', 'DESC']],
      include:[
        {
          model: PaymentSetting,
          attributes: ['paymentMethod']
        }
      ]
    });

    return res.status(200).json({
      success: true,
      data: responses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment responses',
      error: error.message,
    });
  }
};

exports.getPaymentResponsesByRequestId = async (req, res) => {
  const { paymentRequestId } = req.params;

  try {
    const responses = await PaymentResponse.findAll({
      where: { paymentRequestId },
      order: [['createdAt', 'DESC']],
      include:[
        {
          model: PaymentSetting,
          attributes: ['paymentMethod']
        }
      ]
    });

    if (!responses.length) {
      return res.status(404).json({
        success: false,
        message: 'No payment responses found for this payment request',
      });
    }

    return res.status(200).json({
      success: true,
      data: responses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment responses',
      error: error.message,
    });
  }
};

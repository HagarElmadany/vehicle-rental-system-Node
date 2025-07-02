// middlewares/verifyPaymobHmac.js
const crypto = require('crypto');

function verifyPaymobHmac(req, res, next) {
  try {
    const raw = req.rawBody;
    const received = req.headers['hmac'];
    const payload = JSON.parse(raw);
    
    const secret = payload.type === 'payout'
      ? process.env.PAYMOB_PAYOUT_SECRET
      : process.env.PAYMOB_MERCHANT_SECRET;

    const computed = crypto.createHmac('sha512', secret).update(raw).digest('hex');

    if (computed !== received) {
      return res.status(400).send('Invalid HMAC');
    }

    next();
  } catch (error) {
    return res.status(400).send('Invalid Payload');
  }
}

module.exports = verifyPaymobHmac;

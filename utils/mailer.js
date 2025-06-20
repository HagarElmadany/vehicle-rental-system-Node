const nodemailer = require("nodemailer");

exports.sendConfirmationEmail = async (to, bookingId, amount) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Booking Confirmation",
    html: `<h3>Booking Confirmed</h3><p>Booking ID: ${bookingId}</p><p>Amount Paid: ${amount} EGP</p>`
  };

  await transporter.sendMail(mailOptions);
};

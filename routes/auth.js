const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer"); //for the forget password functionality
const User = require('../models/User');
const Client = require('../models/Client');
const Agent = require('../models/Agent');
const upload = require('../middleware/upload');  // Multer middleware
require('dotenv').config();

const router = express.Router();

const registerUser = async (req, res, role) => {
  try {
    const {
      email,
      password,
      phone_number,
      location,
      first_name,
      last_name,
      company_name,
      opening_hours,
      lat,
      lng
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Step 1: Create base user
    const user = new User({
      email,
      password: hashedPassword,
      role,
    });
    await user.save();

    // Step 2: Create role-specific profile
    let profile = null;
    if (role === 'client') {
      profile = new Client({
        user_id: user._id,
        first_name,
        last_name,
        phone_number,
        location,
        driver_license: req.file?.path,
        lat,
        lng
      });
    } else if (role === 'agent') {
      profile = new Agent({
        user_id: user._id,
        company_name,
        phone_number,
        location,
        ID_document: req.file?.path,
        lat,
        lng,
        opening_hours
      });
    }

    if (profile) await profile.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profileId: profile?._id
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


router.post('/register/client', upload.single('driver_license'), (req, res) => registerUser(req, res, 'client'));
router.post('/register/agent', upload.single('ID_document'), (req, res) => registerUser(req, res, 'agent'));


// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { userId: 'admin_static_id', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.status(200).json({
        token,
        user: {
          id: 'admin_static_id',
          name: 'Admin',
          email,
          role: 'admin'
        }
      });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


//POST /forgot-password forgotting assword
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const resetLink = `http://localhost:3000/reset-password/${token}`; // must adjust to our frontend URL /**************************/

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset',
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. The link will expire in 15 minutes.</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) return res.status(500).json({ error: 'Failed to send email' });
      res.status(200).json({ message: 'Password reset email sent successfully' });
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


//POST /reset-password Reseting assword
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid or expired token" });
  }
});


module.exports = router;

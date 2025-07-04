const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Client = require('../models/Client');
const Agent = require('../models/Agent');
const { verifyDriverLicense } = require('../services/verifyLicenseService');


require('dotenv').config();

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

    // For clients, check and validate license first
    if (role === 'client') {
      if (!req.file) {
        return res.status(400).json({ error: "Driver license image is required." });
      }

      const licenseResult = await verifyDriverLicense(req.file.path, req.file.mimetype);
      if (!licenseResult.is_driver_license) {
        return res.status(400).json({
          error: "Invalid driver's license uploaded.",
          extractedInfo: licenseResult
        });
      }
    }

    // All validations passed → now hash password and save user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ email, password: hashedPassword, role });
    await user.save();

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

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

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
    res.status(500).json({ error: 'Server error' });
  }
};


const login = async (req, res) => {
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
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check if user is banned
    if (user.banned) {
      return res.status(403).json({ error: 'Your account has been banned.' });
    }

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
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

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

    transporter.sendMail(mailOptions, (error) => {
      if (error) return res.status(500).json({ error: 'Failed to send email' });
      res.status(200).json({ message: 'Password reset email sent successfully' });
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    if (!password) return res.status(400).json({ error: "Password is required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });

  } catch (err) {
    res.status(400).json({ error: "Invalid or expired token" });
  }
};

const getClientProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Access denied: Not a client' });
    }

    const user = await User.findById(userId).select('-password');
    const clientProfile = await Client.findOne({ user_id: userId });

    if (!clientProfile) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    res.status(200).json({ user, profile: clientProfile });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    let isProfileComplete = false;

    if (user.role === 'client') {
      const client = await Client.findOne({ user_id: user._id });
      isProfileComplete = client && client.phone_number && client.location;
    } else if (user.role === 'agent') {
      const agent = await Agent.findOne({ user_id: user._id });
      isProfileComplete = agent && agent.phone_number && agent.location && agent.opening_hours;
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    if (isProfileComplete) {
      return res.redirect(`http://localhost:4200/home?token=${token}`);
    } else {
      return res.redirect(`http://localhost:4200/complete-profile?token=${token}`);
    }
  } catch (error) {
    res.redirect('http://localhost:4200/login');
  }
};

const completeGoogleProfile = async (req, res) => {
  
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    const {
      phone_number,
      location,
      lat,
      lng,
      company_name,
      opening_hours
    } = req.body;

    if (!role || !phone_number || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let profile;

    if (role === 'client') {
      const client = await Client.findOne({ user_id: userId });
      if (!client) return res.status(404).json({ error: 'Client not found' });

      client.phone_number = phone_number;
      client.location = location;
      client.driver_license = req.file?.path || client.driver_license;
      client.lat = lat;
      client.lng = lng;

      await client.save();
    } else if (role === 'agent') {
      profile = new Agent({
        user_id: userId,
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

    const newToken = jwt.sign(
      { userId, role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Profile completed successfully',
      token: newToken
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  registerUser,
  login,
  forgotPassword,
  resetPassword,
  getClientProfile,
  googleCallback,
  completeGoogleProfile
 
};
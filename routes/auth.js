const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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



module.exports = router;

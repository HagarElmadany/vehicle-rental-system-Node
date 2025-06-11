const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/verifyToken');
const authController = require('../controllers/AuthController');
const passport = require('passport');

// Register routes
router.post('/register/client', upload.single('driver_license'), (req, res) => authController.registerUser(req, res, 'client'));
router.post('/register/agent', upload.single('ID_document'), (req, res) => authController.registerUser(req, res, 'agent'));

// Login
router.post('/login', authController.login);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password/:token', authController.resetPassword);

// Get client profile
router.get('/client/profile', verifyToken, authController.getClientProfile);


router.get('/google', (req, res, next) => {
  const role = req.query.role; // 'client' or 'agent'
  const state = JSON.stringify({ role });
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state
  })(req, res, next);
});

// Google OAuth2 callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  authController.googleCallback
);

// Complete Google Profile
router.post('/google/complete-profile',
  verifyToken,
  upload.single('driver_license'),
  authController.completeGoogleProfile
);

module.exports = router;

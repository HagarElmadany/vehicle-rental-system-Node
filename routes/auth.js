const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/verifyToken');
const authController = require('../controllers/AuthController');

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

// Google OAuth login
router.post('/google/login', authController.googleOAuthLogin);

// Complete Google profile (after login)
router.post('/google/complete-profile', verifyToken, authController.completeGoogleProfile);

module.exports = router;

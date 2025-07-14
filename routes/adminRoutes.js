// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/verifyToken');
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/isAdmin'); 

console.log(adminController)

router.patch('/approve/client/:id', authMiddleware, isAdmin, adminController.approveClient);
router.patch('/approve/agent/:id', authMiddleware, isAdmin, adminController.approveAgent);
router.patch('/reject/client/:id', authMiddleware, isAdmin, adminController.rejectClient);
router.patch('/reject/agent/:id', authMiddleware, isAdmin,  adminController.rejectAgent);
router.patch('/ban/client/:id', authMiddleware, isAdmin,  adminController.banClient);
router.patch('/suspend/client/:id', authMiddleware, isAdmin,  adminController.suspendClientForMonth);
router.patch('/unban/client/:id', authMiddleware, isAdmin,  adminController.unbanClient);
router.patch('/unsuspend/client/:id', authMiddleware, isAdmin,  adminController.unsuspendClient);
router.patch('/ban/agent/:id', authMiddleware, isAdmin,  adminController.banAgent);
router.patch('/suspend/agent/:id', authMiddleware, isAdmin,  adminController.suspendAgentForMonth);
router.patch('/unban/agent/:id', authMiddleware, isAdmin,  adminController.unbanAgent);
router.patch('/unsuspend/agent/:id', authMiddleware, isAdmin,  adminController.unsuspendAgent);
router.get('/clients', authMiddleware, isAdmin, adminController.getAllClients);
router.get('/agents', authMiddleware, isAdmin, adminController.getAllAgents);

module.exports = router;
    
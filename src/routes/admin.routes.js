const express = require('express');
const router = express.Router();

const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const { login, loginSchema } = require('../controllers/admin/auth.controller');
const { createSeller, createSellerSchema, listSellers } = require('../controllers/admin/seller.controller');

// Public routes
router.post('/login', validate(loginSchema), login);

// Protected routes (Admin only)
router.use(authMiddleware);
router.use(requireRole('admin'));

router.post('/sellers', validate(createSellerSchema), createSeller);
router.get('/sellers', listSellers);

module.exports = router;

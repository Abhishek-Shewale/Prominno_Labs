const express = require('express');
const router = express.Router();

const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');

const { login, loginSchema } = require('../controllers/seller/auth.controller');
const { addProduct, listProducts, getProductPdf, deleteProduct } = require('../controllers/seller/product.controller');


router.post('/login', validate(loginSchema), login);


router.use(authMiddleware);
router.use(requireRole('seller'));


router.post('/products', upload.array('brandImages'), addProduct);
router.get('/products', listProducts);
router.get('/products/:id/pdf', getProductPdf);
router.delete('/products/:id', deleteProduct);

module.exports = router;

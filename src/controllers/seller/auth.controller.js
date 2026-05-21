const Joi = require('joi');
const Seller = require('../../models/Seller.model');
const { comparePassword } = require('../../utils/hash.util');
const { generateToken } = require('../../utils/jwt.util');
const { successResponse, errorResponse } = require('../../utils/response.util');

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const seller = await Seller.findOne({ email });
        if (!seller) {
            return errorResponse(res, 401, 'Invalid email or password');
        }

        const isMatch = await comparePassword(password, seller.password);
        if (!isMatch) {
            return errorResponse(res, 401, 'Invalid email or password');
        }

        const token = generateToken({ id: seller._id, role: seller.role });

        return successResponse(res, 200, 'Login successful', {
            accessToken: token,
            role: seller.role,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    loginSchema,
    login,
};

const Joi = require('joi');
const Admin = require('../../models/Admin.model');
const { comparePassword } = require('../../utils/hash.util');
const { generateToken } = require('../../utils/jwt.util');
const { successResponse, errorResponse } = require('../../utils/response.util');

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});


const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return errorResponse(res, 401, 'Invalid email or password');
        }

        const isMatch = await comparePassword(password, admin.password);
        if (!isMatch) {
            return errorResponse(res, 401, 'Invalid email or password');
        }

        const token = generateToken({ id: admin._id, role: admin.role });

        return successResponse(res, 200, 'Login successful', {
            accessToken: token,
            role: admin.role,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    loginSchema,
    login,
};

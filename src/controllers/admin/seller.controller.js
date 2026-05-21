const Joi = require('joi');
const Seller = require('../../models/Seller.model');
const { hashPassword } = require('../../utils/hash.util');
const { successResponse, errorResponse } = require('../../utils/response.util');

const createSellerSchema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    mobileNo: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    country: Joi.string().required(),
    state: Joi.string().required(),
    skills: Joi.array().items(Joi.string()).min(1).required(),
    password: Joi.string().min(8).required(),
});

const createSeller = async (req, res, next) => {
    try {
        const { name, email, mobileNo, country, state, skills, password } = req.body;

        const existingSeller = await Seller.findOne({ email });
        if (existingSeller) {
            return errorResponse(res, 409, 'Seller with this email already exists');
        }

        const hashedPassword = await hashPassword(password);

        const seller = await Seller.create({
            name,
            email,
            mobileNo,
            country,
            state,
            skills,
            password: hashedPassword,
        });

        // Remove password from response
        const sellerData = seller.toObject();
        delete sellerData.password;

        return successResponse(res, 201, 'Seller created successfully', sellerData);
    } catch (error) {
        next(error);
    }
};

const listSellers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const sellers = await Seller.find().select('-password').skip(skip).limit(limit);
        const total = await Seller.countDocuments();

        return successResponse(res, 200, 'Sellers retrieved successfully', {
            sellers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSellerSchema,
    createSeller,
    listSellers,
};

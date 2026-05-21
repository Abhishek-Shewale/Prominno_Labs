const Joi = require('joi');
const Product = require('../../models/Product.model');
const { successResponse, errorResponse } = require('../../utils/response.util');
const { generateProductPDF } = require('../../utils/pdf.util');
const fs = require('fs');

const addProductSchema = Joi.object({
    productName: Joi.string().min(2).required(),
    description: Joi.string().required(),
    brands: Joi.array().items(
        Joi.object({
            brandName: Joi.string().required(),
            detail: Joi.string().required(),
            price: Joi.number().min(0).required(),
            // image will be handled by multer and verified manually
        })
    ).min(1).required(),
});

const addProduct = async (req, res, next) => {
    try {
        // Parse brands from string to object since it comes as multipart/form-data
        // e.g., brands[0][brandName]=Dell, brands[0][price]=1000
        // Or if sent as JSON string in a field: brands='[{"brandName":"Dell"...}]'
        
        let parsedBrands = [];
        
        if (req.body.brands) {
            // If sent as nested form-data objects (e.g. by Postman) it might already be parsed by express middleware or body parser
            // Or we might need to construct it
            // Let's assume the client sends JSON stringified 'brands' field, OR we manually parse the nested keys
            
            if (typeof req.body.brands === 'string') {
                try {
                    parsedBrands = JSON.parse(req.body.brands);
                } catch (e) {
                    return errorResponse(res, 400, 'Invalid brands format, must be valid JSON');
                }
            } else if (Array.isArray(req.body.brands)) {
                parsedBrands = req.body.brands;
            } else {
                // Manually parse if it comes as brands[0][brandName]
                const brandsObj = req.body.brands;
                const keys = Object.keys(brandsObj);
                keys.forEach(k => {
                   parsedBrands[k] = brandsObj[k]; 
                });
                // filter out empty elements if any
                parsedBrands = parsedBrands.filter(b => b != null);
            }
        }

        const dataToValidate = {
            productName: req.body.productName,
            description: req.body.description,
            brands: parsedBrands.map(b => ({
                brandName: b.brandName,
                detail: b.detail,
                price: parseFloat(b.price)
            }))
        };

        const { error } = addProductSchema.validate(dataToValidate, { abortEarly: false });
        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.context.key,
                message: detail.message,
            }));
            // Cleanup uploaded files
            if (req.files) {
                req.files.forEach(f => fs.unlinkSync(f.path));
            }
            return errorResponse(res, 400, 'Validation Error', errors);
        }

        // Attach image paths to brands
        // We expect req.files array (multer array) or fields
        // Since each brand needs an image, let's assume the files are sent as 'brandImages'
        // and they correspond in order to the brands array.
        
        if (!req.files || req.files.length !== dataToValidate.brands.length) {
            if (req.files) req.files.forEach(f => fs.unlinkSync(f.path));
            return errorResponse(res, 400, `Expected ${dataToValidate.brands.length} images, got ${req.files ? req.files.length : 0}`);
        }

        const brandsWithImages = dataToValidate.brands.map((brand, index) => {
            return {
                ...brand,
                image: `/uploads/${req.files[index].filename}`
            };
        });

        const product = await Product.create({
            sellerId: req.user.id,
            productName: dataToValidate.productName,
            description: dataToValidate.description,
            brands: brandsWithImages,
        });

        return successResponse(res, 201, 'Product added successfully', product);
    } catch (error) {
        if (req.files) req.files.forEach(f => fs.unlinkSync(f.path));
        next(error);
    }
};

const listProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const products = await Product.find({ sellerId: req.user.id })
            .skip(skip)
            .limit(limit);
        
        const total = await Product.countDocuments({ sellerId: req.user.id });

        // Add pdfUrl to response
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const productsWithPdfUrl = products.map(p => {
            const prodObj = p.toObject();
            prodObj.pdfUrl = `${baseUrl}/api/seller/products/${p._id}/pdf`;
            return prodObj;
        });

        return successResponse(res, 200, 'Products retrieved successfully', {
            products: productsWithPdfUrl,
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

const getProductPdf = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await Product.findOne({ _id: id, sellerId: req.user.id });
        if (!product) {
            return errorResponse(res, 404, 'Product not found or unauthorized');
        }

        generateProductPDF(product, res);
    } catch (error) {
        next(error);
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await Product.findOne({ _id: id, sellerId: req.user.id });
        if (!product) {
            return errorResponse(res, 404, 'Product not found or unauthorized');
        }

        // Delete associated images
        product.brands.forEach(brand => {
            const imagePath = `../..${brand.image}`;
            const fullPath = require('path').join(__dirname, imagePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        });

        await Product.deleteOne({ _id: id });

        return successResponse(res, 200, 'Product deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addProductSchema,
    addProduct,
    listProducts,
    getProductPdf,
    deleteProduct,
};

const { verifyToken } = require('../utils/jwt.util');
const { errorResponse } = require('../utils/response.util');

const authMiddleware = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return errorResponse(res, 401, 'Not authorized to access this route');
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded; // { id, role }
        next();
    } catch (error) {
        return errorResponse(res, 401, 'Invalid or expired token');
    }
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return errorResponse(res, 403, `Forbidden: You do not have ${role} privileges`);
        }
        next();
    };
};

module.exports = {
    authMiddleware,
    requireRole,
};

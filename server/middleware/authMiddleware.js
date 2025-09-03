// /server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ message: 'No token, autorización denegada' });
    }

    try {
        const decoded = jwt.verify(token, 'secretKey');
        req.user = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

module.exports = auth;

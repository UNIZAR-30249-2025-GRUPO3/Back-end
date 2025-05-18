const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function isAuthenticated(req, res, next) {

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'No tienes sesión activa'
        });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.user = decoded;
        
        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Token inválido o expirado'
        });
    }
}

function gerenteAuthorized(req, res, next) {
    if (req.user.role.includes('gerente')) {
        return next();
    } else {
        return res.status(403).json({
            error: 'No tienes permisos de gerente'
        });
    }
}

module.exports = { isAuthenticated, gerenteAuthorized };
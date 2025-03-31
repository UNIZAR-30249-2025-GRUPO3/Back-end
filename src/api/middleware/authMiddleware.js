function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.status(401).json({
            error: 'No hay sesión activa'
        });
    }
}

function gerenteAuthorized(req, res, next) {
    if (req.session.user.role.includes('gerente')) {
        return next();
    } else {
        return res.status(403).json({
            error: 'No tienes permisos de gerente'
        });
    }
}

module.exports = { isAuthenticated, gerenteAuthorized };
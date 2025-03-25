function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.status(401).json({
            error: 'No session'
        });
    }
}

function gerenteAuthorized(req, res, next) {
    if (req.session.user.role === 'gerente') {
        return next();
    } else {
        return res.status(403).json({
            error: 'No admin permission'
        });
    }
}

module.exports = { isAuthenticated, gerenteAuthorized };
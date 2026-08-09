function requireAdmin(req, res, next) {

    if (
        req.session &&
        req.session.admin &&
        req.session.admin.loggedIn === true
    ) {
        return next();
    }

    return res.status(401).json({
        success: false,
        message: "Administrator login required."
    });
}

module.exports = requireAdmin;
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.createToken = function (fn, ln, id) {
    return _createToken(fn, ln, id);
};

const _createToken = function (fn, ln, id) {
    try {
        const user = { id: id, firstName: fn, lastName: ln };

        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '20m'
        });

        return { accessToken: accessToken, error: '' };
    } catch (e) {
        return { error: e.message };
    }
};

exports.isExpired = function (token) {
    try {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        return false;
    } catch (err) {
        return true;
    }
};

exports.refresh = function (token) {
    try {
        const ud = jwt.decode(token, { complete: true });

        const userId = ud.payload.id;
        const firstName = ud.payload.firstName;
        const lastName = ud.payload.lastName;

        return _createToken(firstName, lastName, userId);
    } catch (e) {
        return { error: e.message };
    }
};
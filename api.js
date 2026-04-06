require('express');
require('mongodb');
const tokenHandler = require('./createJWT.js');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.setApp = function (app, client) {

    // Step 1: Register — hash password, store pending user, email a 6-digit code
    app.post('/api/register', async (req, res) => {
        const { firstName, lastName, email, username, password } = req.body;

        if (!firstName || !lastName || !email || !username || !password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        try {
            const db = client.db('COP4331Cards');

            const existingUser = await db.collection('users').findOne({ Login: username });
            if (existingUser) {
                return res.status(400).json({ error: 'Username already taken.' });
            }

            const existingEmail = await db.collection('users').findOne({ Email: email });
            if (existingEmail) {
                return res.status(400).json({ error: 'Email already registered.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const verificationCode = crypto.randomInt(100000, 999999).toString();

            // Replace any existing pending registration for this email
            await db.collection('PendingUsers').deleteMany({ Email: email });

            await db.collection('PendingUsers').insertOne({
                FirstName: firstName,
                LastName: lastName,
                Email: email,
                Login: username,
                Password: hashedPassword,
                VerificationCode: verificationCode
            });

            await mailer.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Friend Connector — Verify Your Email',
                text: `Welcome to Friend Connector!\n\nYour verification code is: ${verificationCode}\n\nEnter this code on the app to complete your registration.`
            });

            res.status(200).json({ error: '' });
        } catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });

    // Step 2: Verify email — validate code, insert verified user into 'users' collection
    app.post('/api/verify-email', async (req, res) => {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: 'Email and code are required.' });
        }

        try {
            const db = client.db('COP4331Cards');

            const pending = await db.collection('PendingUsers').findOne({ Email: email });

            if (!pending) {
                return res.status(400).json({ error: 'No pending registration found for this email.' });
            }

            if (pending.VerificationCode !== code.trim()) {
                return res.status(400).json({ error: 'Invalid verification code.' });
            }

            const allUsers = await db.collection('users').find({}, { projection: { UserId: 1 } }).toArray();
            const nextId = allUsers.length > 0 ? Math.max(...allUsers.map(u => u.UserId || 0)) + 1 : 1;

            await db.collection('users').insertOne({
                UserId: nextId,
                FirstName: pending.FirstName,
                LastName: pending.LastName,
                Email: pending.Email,
                Login: pending.Login,
                Password: pending.Password
            });

            await db.collection('PendingUsers').deleteOne({ Email: email });

            res.status(200).json({ error: '' });
        } catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });

    // Add friends API soon
    /*app.post('/api/addcard', async (req, res, next) =>
    {
        const { userId, card, jwtToken } = req.body;

        try {
            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
            }
        } catch (e) {
            console.log(e.message);
        }

        const newCard = { Card: card, UserId: userId };
        var error = '';

        try {
            const db = client.db('COP4331Cards');
            await db.collection('Cards').insertOne(newCard);
        } catch (e) {
            error = e.toString();
        }

        var refreshedToken = null;
        try {
            const refreshed = tokenHandler.refresh(jwtToken);
            refreshedToken = refreshed.accessToken;
        } catch (e) {
            console.log(e.message);
        }

        res.status(200).json({ error: error, jwtToken: refreshedToken });
    });*/

    app.post('/api/login', async (req, res, next) => {
        const { login, password, jwtToken } = req.body;

        if (jwtToken) {
            try {
                if (tokenHandler.isExpired(jwtToken)) {
                    return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
                }
            } catch (e) {
                console.log("JWT Check Error:", e.message);
            }
        }

        const db = client.db('COP4331Cards');
        let ret;

        try {
            const user = await db.collection('users').findOne({ Login: login });

            if (user && await bcrypt.compare(password, user.Password)) {
                const id = user.UserId;
                const fn = user.FirstName;
                const ln = user.LastName;

                const tokenData = tokenHandler.createToken(fn, ln, id);

                ret = {
                    id: id,
                    firstName: fn,
                    lastName: ln,
                    accessToken: tokenData.accessToken,
                    error: ''
                };
            } else {
                ret = { error: "Login/Password incorrect", accessToken: '' };
            }
        } catch (e) {
            ret = { error: e.toString() };
        }

        res.status(200).json(ret);
    });


    // Search Friends API soon
    /*app.post('/api/searchcards', async (req, res, next) =>
    {
        var error = '';
        const { userId, search, jwtToken } = req.body;

        try {
            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
            }
        } catch (e) {
            console.log(e.message);
        }

        var _search = search.trim();
        const db = client.db('COP4331Cards');
        const results = await db.collection('Cards').find({"Card":{$regex:_search+'.*',
                $options:'i'}}).toArray();

        var _ret = results.map(item => item.Card);

        var refreshedToken = null;
        try {
            const refreshed = tokenHandler.refresh(jwtToken);
            refreshedToken = refreshed.accessToken;
        } catch (e) {
            console.log(e.message);
        }

        res.status(200).json({ results: _ret, error: error, jwtToken: refreshedToken });
    });*/
}

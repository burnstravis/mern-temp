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

    app.post('/api/register', async (req, res) => {
        const { firstName, lastName, email, username, password } = req.body;

        if (!firstName || !lastName || !email || !username || !password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        try {
            const db = client.db('large_project');

   
            const existingUser = await db.collection('users').findOne({ username: username, verified: true });
            const existingEmail = await db.collection('users').findOne({ email: email, verified: true });


            if (existingUser) {
                return res.status(400).json({ error: 'Username already taken.' });
            }
            if (existingEmail) {
                return res.status(400).json({ error: 'Email already registered.' });
            }


            const hashedPassword = await bcrypt.hash(password, 10);

            // Five Digit Code
            const verificationCode = crypto.randomInt(10000, 99999).toString();

            // Remove any previous unverified attempt for this email before inserting fresh
            await db.collection('users').deleteMany({ email: email, verified: false });

            await db.collection('users').insertOne({
                firstName: firstName,
                lastName: lastName,
                email: email,
                username: username,
                password: hashedPassword,
                verificationCode: verificationCode,
                verified: false
            });

            await mailer.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: '[TEST] VERIFY EMAIL FOR FRIEND CONNECTOR',
                text: `!\n\nYour verification code is: ${verificationCode}\n\nEnter this code on the app to complete your registration.
                This email is a test if it is correct. TO BE REWRITTEN.`
            });

            res.status(200).json({ error: '' });
        } catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });

    app.post('/api/verify-email', async (req, res) => {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: 'Email and code are required.' });
        }

        try {
            const db = client.db('large_project');

            const user = await db.collection('users').findOne({ email: email, verified: false });

            if (!user) {
                return res.status(400).json({ error: 'No pending registration found for this email.' });
            }

            if (user.verificationCode !== code.trim()) {
                return res.status(400).json({ error: 'WRONG CODE.' });
            }

            await db.collection('users').updateOne(
                { email: email },
                { $set: { verified: true }, $unset: { verificationCode: '' } }
            );

            res.status(200).json({ error: 'SUCCESSFULLY VERIFIED' });
        } catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });


    app.post('/api/email-recovery', async (req, res) => {

        const{email} = req.body; 

        if(!email){
            return res.status(400).json({ error: 'Email is required.'});
        }

        try {
            const db = client.db('large_project');

            const user = await db.collection('users').findOne({email: email, verified: true});

            if(!user.verified){
                res.status(400).json({ error: 'NOT VERIFIED'});
            }

            await mailer.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: '[TEST] VERIFY EMAIL FOR FRIEND CONNECTOR',
                text: `!\n\nYour password is: ${hashPassword}\n\nEnter this code on the app to complete your registration.
                This email is a test if it is correct. TO BE REWRITTEN.`
            });

            res.status(200).json({ error: "SENT RECOVERY PASSWORD TO EMAIL"});
        }
        catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });

    // Add friends API soon
    /*app.post('/api/addcard', async (req, res, next) =>
    {
        const { userId, card, jwtToken } = req.body;

        if (!jwtToken) {
            return res.status(200).json({ error: 'No token provided', jwtToken: '' });
        }

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

    app.post('/api/login', async (req, res, next) => 
    {
        const { login, password } = req.body; 

        const db = client.db('large_project');
        let ret;
        try {
            const user = await db.collection('users').findOne({ username: login });

            if (user && await bcrypt.compare(password, user.password)) {
                if (!user.verified) {
                    ret = { error: 'ACCOUNT HAS NOT BEEN VERIFIED', accessToken: '' };
                } else {
                    const fn = user.firstName;
                    const ln = user.lastName;

                    const tokenData = tokenHandler.createToken(fn, ln, user._id);

                    ret = {
                        id: user._id,
                        firstName: fn,
                        lastName: ln,
                        accessToken: tokenData.accessToken,
                        error: ''
                    };

                    res.status(200).json({ error: 'LOGIN SUCCESSFUL'})
                }
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
    app.post('/api/register', async (req, res, next) =>
    {
        const { firstName, lastName, email, username, password } = req.body;

        const newUser = {
            FirstName: firstName,
            LastName: lastName,
            Email: email,
            Username: username,
            Password: password
        };

        var error = '';

        try {
            const db = client.db('COP4331Cards');

            const existingUser = await db.collection('Users').findOne({ Login: username });
            if(existingUser){
                return res.status(200).json({ error: 'Username already taken' });
            }

            await db.collection('Users').insertOne(newUser);
        } catch (e) {
            error = e.toString();
            return res.status(200).json({ error: error });
        }

        res.status(200).json({ error: error });
    });



    app.post('/api/searchcards', async (req, res, next) =>
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

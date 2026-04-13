require('express');
const { ObjectId } = require('mongodb');
const tokenHandler = require('./createJWT.js');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');
const crypto = require('crypto');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.setApp = function (app, client) {

    app.post('/api/register', async (req, res) => {
        const { firstName, lastName, email, username, password, birthday} = req.body;

        if (!firstName || !lastName || !email || !username || !password || !birthday) {
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
                birthday: birthday,
                password: hashedPassword,
                verificationCode: verificationCode,
                verified: false
            });

            const { error: sendError } = await resend.emails.send({
                from: 'noreply@largeproject.nathanfoss.me',
                to: email,
                subject: '[TEST] VERIFY EMAIL FOR FRIEND CONNECTOR',
                text: `!\n\nYour verification code is: ${verificationCode}\n\nEnter this code on the app to complete your registration.
                This email is a test if it is correct. TO BE REWRITTEN.`
            });
            if (sendError) throw new Error(sendError.message);

            res.status(200).json({ error: '' });
        } catch (e) {
            console.error('Register/sendMail error:', e);
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

            res.status(200).json({ Success: 'SUCCESSFULLY VERIFIED' });
        } catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });


    app.post('/api/email-recovery', async (req, res) => {

        const { email } = req.body;
        const verificationCode = crypto.randomInt(10000, 99999).toString();

        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        try {
            const db = client.db('large_project');

            const user = await db.collection('users').findOne({ email: email, verified: true });

            if (!user) {
                return res.status(400).json({ error: 'No verified account found for this email.' });
            }

            await db.collection('users').updateOne(
                { email: email },
                { $set: { verificationCode: verificationCode } }
            );

            const { error: sendError } = await resend.emails.send({
                from: 'noreply@largeproject.nathanfoss.me',
                to: email,
                subject: '[TEST] VERIFY EMAIL FOR FRIEND CONNECTOR',
                text: `!\n\nYour recovery code is: ${verificationCode}\n\nEnter this code on the app to reset your password.
                This email is a test if it is correct. TO BE REWRITTEN.`
            });
            if (sendError) throw new Error(sendError.message);

            res.status(200).json({ success: "SENT RECOVERY CODE TO EMAIL" });
        }
        catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });


    app.post('/api/reset-password', async (req, res, next) =>
    {
        const { email, verificationCode, password, confirmpassword } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Username required.' });
        }
        if (!verificationCode) {
            return res.status(400).json({ error: 'Verification code is required.' });
        }
        if (!password || !confirmpassword) {
            return res.status(400).json({ error: 'Password and confirmation are required.' });
        }
        if (password !== confirmpassword) {
            return res.status(400).json({ error: 'Passwords do not match.' });
        }

        try {
            const db = client.db('large_project');

            const user = await db.collection('users').findOne({ email: email, verified: true });

            if (!user) {
                return res.status(400).json({ error: 'No verified account found for this email.' });
            }

            if (user.verificationCode !== verificationCode) {
                return res.status(400).json({ error: 'Verification code is incorrect.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await db.collection('users').updateOne(
                { email: email },
                { $set: { password: hashedPassword }, $unset: { verificationCode: '' } }
            );

            res.status(200).json({ success: "Password reset successful. Please login with the new password." });
        }
        catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });

    app.post('/api/login', async (req, res) =>
    {
        const { login, password } = req.body;

        if(!login || !password)
        {
            return res.status(400).json({ error: 'Login and password are required.' });
        }

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

                }
            } else {
                ret = { error: "Login/Password incorrect", accessToken: '' };
            }
        } catch (e) {
            ret = { error: e.toString() };
        }
        res.status(200).json(ret);
    });




    app.post('/api/friends-list', async (req, res) => {
        const { jwtToken, page = 1, limit = 10 } = req.body;

        if (!jwtToken) {
            return res.status(400).json({ error: 'JWT Token is required.', friends: [], accessToken: '' });
        }

        try {
            const db = client.db('large_project');

            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(200).json({ error: 'The JWT is no longer valid', friends: [], accessToken: '' });
            }

            const decoded = require('jsonwebtoken').decode(jwtToken);
            const userId = decoded?.id;

            if (!userId) {
                return res.status(200).json({ error: 'Invalid token payload.', friends: [], accessToken: '' });
            }

            const userObjectId = new ObjectId(userId);
            const skip = (page - 1) * limit;

            const [friendshipDocs, total] = await Promise.all([
                db.collection('friendships')
                    .find({
                        $or: [{ requesterId: userObjectId }, { recipientId: userObjectId }]
                    })
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                db.collection('friendships').countDocuments({
                    $or: [{ requesterId: userObjectId }, { recipientId: userObjectId }]
                })
            ]);

            if (friendshipDocs.length === 0) {
                const refreshed = tokenHandler.refresh(jwtToken);
                return res.status(200).json({
                    friends: [],
                    page,
                    totalPages: 0,
                    total: 0,
                    accessToken: refreshed.accessToken,
                    error: ''
                });
            }

            const friendIds = friendshipDocs.map(f =>
                f.requesterId.toString() === userObjectId.toString() ? f.recipientId : f.requesterId
            );

            const userProfiles = await db.collection('users')
                .find({ _id: { $in: friendIds.map(id => new ObjectId(id)) } })
                .project({ username: 1, firstName: 1, lastName: 1, birthday: 1 })
                .toArray();

            const combinedResults = friendshipDocs.map(f => {
                const otherId = f.requesterId.toString() === userObjectId.toString() ? f.recipientId : f.requesterId;
                const profile = userProfiles.find(p => p._id.toString() === otherId.toString());

                return {
                    _id: f._id,
                    status: f.status,
                    requesterId: f.requesterId,
                    recipientId: f.recipientId,
                    friendDetails: profile || null
                };
            });

            const refreshed = tokenHandler.refresh(jwtToken);

            res.status(200).json({
                friends: combinedResults,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                accessToken: refreshed.accessToken,
                error: ''
            });

        } catch (e) {
            console.error(e);
            res.status(500).json({ error: e.toString(), accessToken: '' });
        }
    });

    app.post('/api/add-friend', async (req, res,) =>
    {
        const { username, jwtToken } = req.body;

        if (!username || !jwtToken) {
            return res.status(400).json({ error: 'Username and token are required.', accessToken: '' });
        }

        const db = client.db('large_project');
        let ret;


        try {
            if (tokenHandler.isExpired(jwtToken)) {
                ret = { error: 'The JWT is no longer valid', accessToken: '' };
                return res.status(200).json(ret);
            }

            const decoded = require('jsonwebtoken').decode(jwtToken);
            const requesterId = decoded?.id;

            if (!requesterId) {
                ret = { error: 'Invalid token payload.', accessToken: '' };
                return res.status(200).json(ret);
            }

            const recipient = await db.collection('users').findOne({
                username: username,
                verified: true
            });



            if (!recipient) {
                ret = { error: 'User not found.', accessToken: '' };
                return res.status(200).json(ret);
            }

            const requesterObjectId = new ObjectId(requesterId);
            const recipientObjectId = recipient._id;

            if (requesterObjectId.toString() === recipientObjectId.toString()) {
                ret = { error: 'You cannot add yourself.', accessToken: '' };
                return res.status(200).json(ret);
            }

            const existing = await db.collection('friendships').findOne({
                $or: [
                    { requesterId: requesterObjectId, recipientId: recipientObjectId },
                    { requesterId: recipientObjectId, recipientId: requesterObjectId }
                ],
                status: { $in: ['pending', 'accepted'] }
            });

            if (existing) {
                if (existing.status === 'pending') {
                    ret = { error: 'Request already sent.', accessToken: '' };
                } else {
                    ret = { error: 'Friend already exists.', accessToken: '' };
                }
                return res.status(200).json(ret);
            }

            await db.collection('friendships').insertOne({
                requesterId: requesterObjectId,
                recipientId: recipientObjectId,
                status: 'pending'
            });

            const refreshed = tokenHandler.refresh(jwtToken);

            ret = {
                error: '',
                accessToken: refreshed.accessToken
            };
        }
        catch (e) {
            ret = { error: e.toString(), accessToken: '' };
        }

        return res.status(200).json(ret);
    });

}

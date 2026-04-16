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

    app.get('/api/users', async (req, res) => {
    const search = req.query.search || "";
    const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));

    let jwtToken = req.headers['authorization'];

    if (!jwtToken) {
        return res.status(401).json({ error: 'No token provided.' });
    }

    try {
        if (jwtToken.startsWith('Bearer ')) {
            jwtToken = jwtToken.slice(7);
        }

        const db = client.db('large_project');

        if (tokenHandler.isExpired(jwtToken)) {
            return res.status(401).json({ error: 'Token expired.' });
        }

        const decoded = require('jsonwebtoken').decode(jwtToken);
        if (!decoded || !decoded.id) {
            return res.status(401).json({ error: 'Invalid token payload.' });
        }

        const requesterId = new ObjectId(decoded.id);
        const skip = (page - 1) * limit;

        const userFilter = {
            verified: true,
            _id: { $ne: requesterId }
        };

        if (sanitizedSearch) {
            const searchRegex = { $regex: sanitizedSearch, $options: 'i' };
            userFilter.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
                { username: searchRegex }
            ];
        }

        const refreshed = tokenHandler.refresh(jwtToken);

        const [users, total] = await Promise.all([
            db.collection('users')
                .find(userFilter)
                .project({ firstName: 1, lastName: 1, username: 1, email: 1, birthday: 1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection('users').countDocuments(userFilter)
        ]);

        return res.status(200).json({
            users,
            page,
            totalPages: Math.ceil(total / limit),
            total,
            accessToken: refreshed.accessToken
        });
    } catch (e) {
        console.error("Get Users Error:", e);
        return res.status(500).json({ error: "Internal server error" });
    }
});
    
    app.get('/api/friends', async (req, res) => {
        // 1. Pull and Sanitize Query Parameters
        // Sanitizing search to prevent Regex Injection (ReDoS attacks)
        const search = req.query.search || "";
        const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Math.max/min ensures we don't pass NaN, 0, or negative numbers to MongoDB
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
        
        let jwtToken = req.headers['authorization']; 

        if (!jwtToken) {
            return res.status(401).json({ error: 'No token provided.' });
        }

        try {
            // Standardize token: Remove "Bearer " prefix if it exists
            if (jwtToken.startsWith('Bearer ')) {
                jwtToken = jwtToken.slice(7, jwtToken.length);
            }

            const db = client.db('large_project');
            
            // 2. Security: Verify and decode the token
            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(401).json({ error: 'Token expired.' });
            }
            
            const decoded = require('jsonwebtoken').decode(jwtToken);
            if (!decoded || !decoded.id) {
                return res.status(401).json({ error: 'Invalid token payload.' });
            }
            
            const requesterId = new ObjectId(decoded.id);
            const skip = (page - 1) * limit; 

            // 3. Find all friendships where the user is either requester or recipient
            // NOTE: Add .find({ ..., status: 'accepted' }) back here later if you want 
            // to hide pending requests from this list.
            const friendshipDocs = await db.collection('friendships')
                .find({ 
                    $or: [{ requesterid: requesterId }, { recepientid: requesterId }]
                })
                .toArray();

            // 4. Map to get the ID of the *other* person in each document
            const friendIds = friendshipDocs.map(f => 
                f.requesterid.equals(requesterId) ? f.recepientid : f.requesterid
            );
            
            // Refresh token to keep the sliding session alive
            const refreshed = tokenHandler.refresh(jwtToken);
            
            // If they have no friends, return empty now to save DB resources
            if (friendIds.length === 0) {
                return res.status(200).json({
                    friends: [],
                    page: page,
                    totalPages: 0,
                    total: 0,
                    accessToken: refreshed.accessToken
                });
            }

            // 5. Build the Filter for the 'users' collection
            const userFilter = { _id: { $in: friendIds } };

            if (sanitizedSearch) {
                const searchRegex = { $regex: sanitizedSearch, $options: 'i' };
                userFilter.$or = [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { username: searchRegex }
                ];
            }

            // 6. Fetch user details and count matching friends in parallel
            const [friends, total] = await Promise.all([
                db.collection('users')
                    .find(userFilter)
                    .project({ firstName: 1, lastName: 1, username: 1, birthday: 1 })
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                db.collection('users').countDocuments(userFilter)
            ]);

            res.status(200).json({
                friends,
                page: page,
                totalPages: Math.ceil(total / limit),
                total,
                accessToken: refreshed.accessToken
            });
        } catch (e) {
            console.error("Search Error:", e);
            res.status(500).json({ error: "Internal server error" });
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
                    { requesterid: requesterObjectId, recepientid: recipientObjectId },
                    { requesterid: recipientObjectId, recepientid: requesterObjectId }
                ],
                status: { $in: ['pending', 'accepted'] }
            });

            if (existing) {
                ret = { error: 'Friend already exists.', accessToken: '' };
                return res.status(200).json(ret);
            }

            await db.collection('friendships').insertOne({
                requesterid: requesterObjectId,
                recepientid: recipientObjectId,
                status: 'pending'
            });

            const refreshed = tokenHandler.refresh(jwtToken);

            ret = {
                error: '',
                message: 'Friend request sent successfully.',
                accessToken: refreshed.accessToken
            };
        }
        catch (e) {
            ret = { error: e.toString(), accessToken: '' };
        }

        return res.status(200).json(ret);
    });

    app.post('/api/accept-friend-request', async (req, res) => {
        const { friendship_id, jwtToken } = req.body;  

        if (!friendship_id || !jwtToken) {
            return res.status(400).json({ error: 'Friendship ID and token are required.', accessToken: '' });
        }

        const db = client.db('large_project');
        let ret;

        try {
            if (tokenHandler.isExpired(jwtToken)) {
                ret = { error: 'The JWT is no longer valid', accessToken: '' };
                return res.status(200).json(ret);
            }

            const decoded = require('jsonwebtoken').decode(jwtToken);
            const userId = decoded?.id;

            if (!userId) {
                ret = { error: 'Invalid token payload.', accessToken: '' };
                return res.status(200).json(ret);
            }

            const userObjectId = new ObjectId(userId);

            await db.collection('friendships').updateOne(
                { _id: new ObjectId(friendship_id), recepientid: userObjectId, status: 'pending' },
                { $set: { status: 'accepted' } }
            );

            const refreshed = tokenHandler.refresh(jwtToken);

            ret = {
                error: '',
                message: 'Friend request accepted.',
                accessToken: refreshed.accessToken
            };
        } catch (e) {
            ret = { error: e.toString(), accessToken: '' };
        }

        return res.status(200).json(ret);
    });



    app.post('/api/messages', async (req, res) => {
        const { senderID, conversationID, message, jwtToken } = req.body;

        if (!senderID || !conversationID || !message || !jwtToken) {
            return res.status(400).json({ error: 'senderID, conversationID, message, and token are required.', accessToken: '' });
        }

        try {
            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
            }

            const db = client.db('large_project');

            await db.collection('messages').insertOne({
                conversationid: conversationID,
                senderid: senderID,
                text: message,
                createdAt: new Date()
            });

            const refreshed = tokenHandler.refresh(jwtToken);
            res.status(200).json({ error: '', accessToken: refreshed.accessToken });
        } catch (e) {
            res.status(500).json({ error: e.toString(), accessToken: '' });
        }
    });


    app.get('/api/read-messages', async (req, res) => {
        
        const { senderID, conversationID, jwtToken } = req.body;

        if (!senderID || !conversationID|| !jwtToken) {
            return res.status(400).json({ error: 'senderID, conversationID, and token are required.', accessToken: '' });
        }


        try{
            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
            }

            const db = client.db('large_project');

            const senderObjectId = new ObjectId(senderID);

            const messages = await db.collection('messages')
                .find({ conversationid: conversationID })
                .sort({ createdAt: 1 })
                .toArray();

            const taggedMessages = messages.map(msg => ({
                ...msg,
                fromSender: msg.senderid.equals(senderObjectId)
            }));

            const refreshed = tokenHandler.refresh(jwtToken);
            res.status(200).json({ error: '', messages: taggedMessages, accessToken: refreshed.accessToken });
        }
        catch (e){
            res.status(500).json({ error: e.toString(), accessToken: '' });
        }
    });

    app.get('/api/return-random-prompt', async (req, res) => {
        try {
            const db = client.db('large_project');

            const prompts = await db.collection('prompts').find().toArray();

            if (!prompts.length) {
                return res.status(404).json({ error: 'No prompts found.' });
            }

            const randomIndex = crypto.randomInt(0, prompts.length);
            const prompt = prompts[randomIndex];

            res.status(200).json({ error: '', prompt: prompt });
        } catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });

}




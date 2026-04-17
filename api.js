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

    //get friends
    app.get('/api/friends', async (req, res) => {
        const search = req.query.search || "";
        const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));

        let jwtToken = req.headers['authorization'];
        if (!jwtToken) return res.status(401).json({ error: 'No token provided.' });

        try {
            if (jwtToken.startsWith('Bearer ')) jwtToken = jwtToken.slice(7);
            const db = client.db('large_project');

            if (tokenHandler.isExpired(jwtToken)) return res.status(401).json({ error: 'Token expired.' });
            const decoded = require('jsonwebtoken').decode(jwtToken);

            const currentUserId = new ObjectId(decoded.id);
            const skip = (page - 1) * limit;


            const friendshipDocs = await db.collection('friendships')
                .find({
                    $or: [{ requesterId: currentUserId }, { recipientId: currentUserId }],
                    status: 'accepted'
                })
                .toArray();

            const friendIds = friendshipDocs.map(f =>
                f.requesterId.toString() === currentUserId.toString() ? f.recipientId : f.requesterId
            );

            const refreshed = tokenHandler.refresh(jwtToken);

            if (friendIds.length === 0) {
                return res.status(200).json({
                    friends: [], page, totalPages: 0, total: 0, accessToken: refreshed.accessToken
                });
            }

            const userFilter = { _id: { $in: friendIds } };
            if (sanitizedSearch) {
                const searchRegex = { $regex: sanitizedSearch, $options: 'i' };
                userFilter.$or = [
                    { firstName: searchRegex }, { lastName: searchRegex }, { username: searchRegex }
                ];
            }

            const [friends, total] = await Promise.all([
                db.collection('users')
                    .find(userFilter)
                    .project({ firstName: 1, lastName: 1, username: 1, birthday: 1 })
                    .skip(skip).limit(limit).toArray(),
                db.collection('users').countDocuments(userFilter)
            ]);

            res.status(200).json({
                friends, page, totalPages: Math.ceil(total / limit), total,
                accessToken: refreshed.accessToken
            });
        } catch (e) {
            res.status(500).json({ error: "Internal server error" });
        }
    });

    app.post('/api/friends', async (req, res) => {
        const { username } = req.body;
        let jwtToken = req.headers['authorization'];

        if (!username || !jwtToken) {
            return res.status(400).json({ error: 'Username and token are required.', accessToken: '' });
        }

        const db = client.db('large_project');
        let ret;

        try {
            if (jwtToken.startsWith('Bearer ')) {
                jwtToken = jwtToken.slice(7, jwtToken.length);
            }

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
                ret = { error: 'User not found.', accessToken: ''};
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
                ]
            });

            if (existing) {
                ret = { error: 'Friendship already exists or is pending.', accessToken: '' };
                return res.status(200).json(ret);
            }

            const result = await db.collection('friendships').insertOne({
                requesterId: requesterObjectId,
                recipientId: recipientObjectId,
                status: 'pending'
            });

            const refreshed = tokenHandler.refresh(jwtToken);

            ret = {
                error: '',
                message: 'Friend request sent successfully.',
                friendshipId: result.insertedId,
                accessToken: refreshed.accessToken
            };
            // --------------------------
        }
        catch (e) {
            ret = { error: e.toString(), accessToken: '' };
        }

        return res.status(200).json(ret);
    });

    //start conversation
    app.post('/api/conversations', async (req, res) => {
        const { friendId } = req.body;
        let jwtToken = req.headers['authorization'];

        if (!jwtToken) {
            return res.status(401).json({ error: 'No token provided.' });
        }

        if (!friendId) {
            return res.status(400).json({ error: 'Friend ID is required.' });
        }

        try {
            // Standardize token
            if (jwtToken.startsWith('Bearer ')) {
                jwtToken = jwtToken.slice(7, jwtToken.length);
            }

            // Security: Check token validity
            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(401).json({ error: 'Token expired.' });
            }

            const decoded = require('jsonwebtoken').decode(jwtToken);
            const userId = new ObjectId(decoded.id);
            const friendObjectId = new ObjectId(friendId);

            const db = client.db('large_project');

            const existingConversation = await db.collection('conversations').findOne({
                participants: { $all: [userId, friendObjectId] }
            });

            if (existingConversation) {
                const refreshed = tokenHandler.refresh(jwtToken);
                return res.status(200).json({
                    conversationId: existingConversation._id,
                    accessToken: refreshed.accessToken,
                    message: "Existing conversation retrieved"
                });
            }

            const newConversation = {
                participants: [userId, friendObjectId],
                lastMessage: "",
                lastMessageAt: new Date(),
                createdAt: new Date()
            };

            const result = await db.collection('conversations').insertOne(newConversation);

            const refreshed = tokenHandler.refresh(jwtToken);
            res.status(200).json({
                conversationId: result.insertedId,
                accessToken: refreshed.accessToken,
                message: "New conversation created"
            });

        } catch (e) {
            console.error("Conversation Error:", e);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    //get conversations
    app.get('/api/conversations', async (req, res) => {
        let jwtToken = req.headers['authorization'];

        if (!jwtToken) {
            return res.status(401).json({ error: 'No token provided.' });
        }

        try {
            // 1. Standardize and Verify Token
            if (jwtToken.startsWith('Bearer ')) {
                jwtToken = jwtToken.slice(7, jwtToken.length);
            }

            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(401).json({ error: 'Token expired.' });
            }

            const decoded = require('jsonwebtoken').decode(jwtToken);
            const userId = new ObjectId(decoded.id);
            const db = client.db('large_project');

            const conversations = await db.collection('conversations')
                .find({ participants: userId })
                .sort({ lastMessageAt: -1 })
                .toArray();


            const refreshed = tokenHandler.refresh(jwtToken);

            res.status(200).json({
                conversations: conversations,
                accessToken: refreshed.accessToken
            });

        } catch (e) {
            console.error("Get Conversations Error:", e);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    //add support request
    app.post('/api/support-requests', async (req, res) => {
        const { content, type } = req.body;
        let jwtToken = req.headers['authorization'];

        if (!jwtToken) return res.status(401).json({ error: "No token provided." });

        const validTypes = ["Encouragement", "Advice", "Chat", "Celebrate"];

        if (!content || !type) {
            return res.status(400).json({ error: "Content and type are required." });
        }

        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: "Invalid type. Must be: Encouragement, Advice, Chat, or Celebrate." });
        }

        try {
            if (jwtToken.startsWith('Bearer ')) jwtToken = jwtToken.slice(7);
            if (tokenHandler.isExpired(jwtToken)) return res.status(401).json({ error: "Token expired." });

            const decoded = require('jsonwebtoken').decode(jwtToken);
            const userId = new ObjectId(decoded.id);
            const db = client.db('large_project');

            const now = new Date();
            const expiresAt = new Date(now.getTime() + (24 * 60 * 60 * 1000));

            const newRequest = {
                userId: userId,
                content: content,
                type: type,
                createdAt: now,
                expiresAt: expiresAt
            };

            const result = await db.collection('support_requests').insertOne(newRequest);
            const refreshed = tokenHandler.refresh(jwtToken);

            res.status(200).json({
                requestId: result.insertedId,
                accessToken: refreshed.accessToken
            });
        } catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });

    //get suppost requests
    app.get('/api/support-requests', async (req, res) => {
        const typeFilter = req.query.type;
        let jwtToken = req.headers['authorization'];

        try {
            if (jwtToken && jwtToken.startsWith('Bearer ')) jwtToken = jwtToken.slice(7);

            const db = client.db('large_project');
            const now = new Date();

            let query = { expiresAt: { $gt: now } };

            if (typeFilter) {
                query.type = typeFilter;
            }

            const activeRequests = await db.collection('support_requests')
                .find(query)
                .sort({ createdAt: -1 })
                .toArray();

            const accessToken = jwtToken ? tokenHandler.refresh(jwtToken).accessToken : '';

            res.status(200).json({
                requests: activeRequests,
                accessToken: accessToken
            });
        } catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });

    //accept friend request
    app.post('/api/accept-friend-request', async (req, res) => {
        const { senderId, friendship_id } = req.body;
        let jwtToken = req.headers['authorization'];

        if (jwtToken && jwtToken.startsWith('Bearer ')) jwtToken = jwtToken.slice(7);
        if (!jwtToken || (!senderId && !friendship_id)) {
            return res.status(400).json({ error: 'Missing data or token.' });
        }

        try {
            const decoded = require('jsonwebtoken').decode(jwtToken);
            const myId = new ObjectId(decoded.id);
            const db = client.db('large_project');

            const targetFriendshipId = new ObjectId(friendship_id || senderId);

            // 1. Find and update the friendship status
            const query = {
                $or: [
                    { _id: targetFriendshipId, recipientId: myId },
                    { requesterId: new ObjectId(senderId), recipientId: myId }
                ],
                status: 'pending'
            };

            const result = await db.collection('friendships').updateOne(
                query,
                { $set: { status: 'accepted' } }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ error: "No pending request found for you to accept." });
            }

            await db.collection('notifications').deleteOne({
                recipientId: myId,
                relatedId: targetFriendshipId,
                type: 'friend_request'
            });

            res.status(200).json({
                message: 'Friend request accepted and notification removed!',
                accessToken: tokenHandler.refresh(jwtToken).accessToken
            });
        } catch (e) {
            console.error("Accept Error:", e);
            res.status(500).json({ error: "Internal server error" });
        }
    });


    //send message
    app.post('/api/notifications', async (req, res) => {
        let jwtToken = req.headers['authorization'];
        const { type, content, relatedId, recipientId } = req.body;

        if (!jwtToken || !type || !content || !recipientId) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        try {
            if (jwtToken.startsWith('Bearer ')) jwtToken = jwtToken.slice(7);
            if (tokenHandler.isExpired(jwtToken)) return res.status(401).json({ error: 'Expired token.' });

            const decoded = require('jsonwebtoken').decode(jwtToken);
            const senderId = new ObjectId(decoded.id);
            const targetRecipientId = new ObjectId(recipientId);

            if (senderId.equals(targetRecipientId)) {
                return res.status(200).json({ message: "Self-notification skipped." });
            }

            const db = client.db('large_project');
            await db.collection('notifications').insertOne({
                recipientId: targetRecipientId,
                senderId: senderId,
                type: type,
                content: content,
                createdAt: new Date(),
                isRead: false,
                relatedId: relatedId ? new ObjectId(relatedId) : null
            });

            const refreshed = tokenHandler.refresh(jwtToken);
            res.status(200).json({ error: '', accessToken: refreshed.accessToken });
        } catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });

    //get chat messages
    app.get('/api/notifications', async (req, res) => {
        let jwtToken = req.headers['authorization'];
        if (!jwtToken) return res.status(401).json({ error: 'No token provided.' });

        try {
            if (jwtToken.startsWith('Bearer ')) jwtToken = jwtToken.slice(7);
            if (tokenHandler.isExpired(jwtToken)) return res.status(401).json({ error: 'Token expired.' });

            const decoded = require('jsonwebtoken').decode(jwtToken);
            const userId = new ObjectId(decoded.id);
            const db = client.db('large_project');

            const notifications = await db.collection('notifications').aggregate([
                { $match: { recipientId: userId } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'relatedId',
                        foreignField: '_id',
                        as: 'senderInfo'
                    }
                },
                { $unwind: { path: '$senderInfo', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 1,
                        type: 1,
                        content: 1,
                        createdAt: 1,
                        isRead: 1,
                        relatedId: 1,
                        senderUsername: '$senderInfo.username',
                        senderFirstName: '$senderInfo.firstName'
                    }
                },
                { $sort: { createdAt: -1 } }
            ]).toArray();

            res.status(200).json({
                notifications: notifications,
                accessToken: tokenHandler.refresh(jwtToken).accessToken
            });
        } catch (e) {
            console.error("Get Notifications Error:", e);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    //get random prompt
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

    app.post('/api/notifications', async (req, res) => {
        let jwtToken = req.headers['authorization'];
        const { type, content, relatedId, recipientId } = req.body;

        // Basic validation
        if (!jwtToken || !type || !content || !recipientId) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        try {
            if (jwtToken.startsWith('Bearer ')) jwtToken = jwtToken.slice(7);

            // Token verification logic
            const decoded = require('jsonwebtoken').decode(jwtToken);
            if (!decoded || !decoded.id) {
                return res.status(401).json({ error: 'Invalid or expired token.' });
            }

            const senderId = new ObjectId(decoded.id);
            const targetRecipientId = new ObjectId(recipientId);

            if (senderId.equals(targetRecipientId)) {
                return res.status(200).json({ message: "Self-notification blocked." });
            }

            const db = client.db('large_project');

            const notificationDoc = {
                recipientId: targetRecipientId,
                senderId: senderId,
                type: type,
                content: content,
                createdAt: new Date(),
                isRead: false,
                relatedId: relatedId ? new ObjectId(relatedId) : null
            };

            await db.collection('notifications').insertOne(notificationDoc);

            const refreshed = tokenHandler.refresh(jwtToken);
            res.status(200).json({
                error: '',
                message: 'Notification sent',
                accessToken: refreshed.accessToken
            });

        } catch (e) {
            console.error("Notification Post Error:", e);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    app.get('/api/notifications', async (req, res) => {
        let jwtToken = req.headers['authorization'];
        if (!jwtToken) return res.status(401).json({ error: 'No token provided.' });

        try {
            if (jwtToken.startsWith('Bearer ')) jwtToken = jwtToken.slice(7);
            if (tokenHandler.isExpired(jwtToken)) return res.status(401).json({ error: 'Token expired.' });

            const decoded = require('jsonwebtoken').decode(jwtToken);
            const userId = new ObjectId(decoded.id);
            const db = client.db('large_project');

            const notifications = await db.collection('notifications').aggregate([
                { $match: { recipientId: userId } },

                {
                    $lookup: {
                        from: 'users',
                        localField: 'senderId',
                        foreignField: '_id',
                        as: 'senderInfo'
                    }
                },

                { $unwind: { path: '$senderInfo', preserveNullAndEmptyArrays: true } },

                {
                    $project: {
                        _id: 1,
                        type: 1,
                        content: 1,
                        createdAt: 1,
                        isRead: 1,
                        relatedId: 1,
                        senderUsername: { $ifNull: ['$senderInfo.username', 'Unknown'] },
                        senderFirstName: { $ifNull: ['$senderInfo.firstName', ''] },
                        senderLastName: { $ifNull: ['$senderInfo.lastName', ''] }
                    }
                },

                { $sort: { createdAt: -1 } }
            ]).toArray();

            res.status(200).json({
                notifications: notifications,
                accessToken: tokenHandler.refresh(jwtToken).accessToken
            });

        } catch (e) {
            console.error("Get Notifications Error:", e);
            res.status(500).json({ error: "Internal server error" });
        }
    });

}
require('express');
const { ObjectId } = require('mongodb');
const tokenHandler = require('./createJWT.js');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');
const crypto = require('crypto');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.setApp = function (app, client, io) {

    const emitMessageEvent = (conversationId, payload) => {
        if (!io || !conversationId) return;
        io.to(`conversation:${conversationId}`).emit('message:new', payload);
    };

    const emitConversationEvent = (participantIds, payload) => {
        if (!io || !Array.isArray(participantIds)) return;

        participantIds.forEach((participantId) => {
            if (!participantId) return;
            io.to(`user:${participantId.toString()}`).emit('conversation:updated', payload);
        });
    };

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
                subject: 'VERIFY EMAIL FOR FRIEND CONNECTOR',
                text: `!\n\nYour verification code is: ${verificationCode}\n\nEnter this code on the app to complete your registration.`
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
                subject: 'VERIFY EMAIL FOR FRIEND CONNECTOR',
                text: `!\n\nYour recovery code is: ${verificationCode}\n\nEnter this code on the app to reset your password.`
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
                res.status(200).json({ error: "Login or Password incorrect" });
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
                ret = { error: 'Friend already exists or is pending.', accessToken: '' };
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
        }
        catch (e) {
            ret = { error: e.toString(), accessToken: '' };
        }

        return res.status(200).json(ret);
    });

    app.post('/api/accept-friend-request', async (req, res) => {
        const { senderId, friendship_id } = req.body;
        let jwtToken = req.headers['authorization'];

        if (jwtToken && jwtToken.startsWith('Bearer ')) jwtToken = jwtToken.slice(7);
        if (!jwtToken || (!senderId && !friendship_id)) {
            return res.status(400).json({ error: 'Friendship ID and token are required.' });
        }


        if (tokenHandler.isExpired(jwtToken)) {
            return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
        }

        try {
            const decoded = require('jsonwebtoken').decode(jwtToken);
            const myId = new ObjectId(decoded.id);
            const db = client.db('large_project');

            const targetFriendshipId = new ObjectId(friendship_id || senderId);

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
                return res.status(400).json({ error: "Friend request not found or already accepted." });
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

    app.post('/api/messages', async (req, res) => {
        
        let jwtToken = req.headers['authorization'];
        
        const senderId = req.body.senderId || req.body.senderID;
        const conversationId = req.body.conversationId || req.body.conversationID;
        const { message } = req.body;

        if (!senderId || !conversationId || !message || !jwtToken) {
            return res.status(400).json({ error: 'senderId, conversationId, message, and token are required.', accessToken: '' });
        }

        try {
            if (jwtToken && jwtToken.startsWith('Bearer ')) jwtToken = jwtToken.slice(7);

            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
            }

            const db = client.db('large_project');
            const senderObjectId = new ObjectId(senderId);
            const conversationObjectId = new ObjectId(conversationId);

            const createdAt = new Date();

            const messageInsert = await db.collection('messages').insertOne({
                conversationId: conversationId,
                senderId: senderId,
                text: message,
                createdAt: createdAt
            });

            await db.collection('conversations').updateOne(
                { _id: conversationObjectId },
                { $set: { lastMessage: message, lastMessageAt: createdAt } }
            );

            const createdMessage = {
                _id: messageInsert.insertedId.toString(),
                conversationId: conversationId,
                senderId: senderId,
                text: message,
                createdAt,
                fromSender: true
            };

            const convo = await db.collection('conversations').findOne({ _id: conversationObjectId });
            if (convo) {
                emitMessageEvent(conversationId, createdMessage);
                emitConversationEvent(convo.participants, {
                    conversationId: conversationId,
                    lastMessage: message,
                    lastMessageAt: createdAt
                });

                const recipientId = convo.participants.find(p => p.toString() !== senderObjectId.toString());
                if (recipientId) {
                    const sender = await db.collection('users').findOne({ _id: senderObjectId });
                    await db.collection('notifications').insertOne({
                        recipientId: recipientId,
                        type: 'new_message',
                        content: `New message from ${sender?.firstName || 'Friend'}: "${message.substring(0, 20)}..."`,
                        createdAt: new Date(),
                        isRead: false,
                        relatedId: conversationObjectId
                    });
                }
            }

            const refreshed = tokenHandler.refresh(jwtToken);
            res.status(200).json({ error: '', message: createdMessage, accessToken: refreshed.accessToken });
        } catch (e) {
            res.status(500).json({ error: e.toString(), accessToken: '' });
        }
    });

    app.get('/api/messages', async (req, res) => {
        
        let jwtToken = req.headers['authorization'];
        
        const senderId = req.query.senderId || req.query.senderID;
        const conversationId = req.query.conversationId || req.query.conversationID;

        if (!senderId || !conversationId || !jwtToken) {
            return res.status(400).json({ error: 'senderId, conversationId, and token are required.', accessToken: '' });
        }

        try {
            if (jwtToken && jwtToken.startsWith('Bearer ')) jwtToken = jwtToken.slice(7);

            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
            }

            const db = client.db('large_project');

            const senderObjectId = new ObjectId(senderId);

            const messages = await db.collection('messages')
                .find({
                    $or: [
                        { conversationId: conversationId },
                        { conversationid: conversationId }
                    ]
                })
                .sort({ createdAt: 1 })
                .toArray();

            const taggedMessages = messages.map(msg => {
                const msgSender = msg.senderId || msg.senderid;
                return {
                    ...msg,
                    conversationId: msg.conversationId || msg.conversationid,
                    senderId: msg.senderId || msg.senderid,
                    fromSender: msgSender ? msgSender.toString() === senderObjectId.toString() : false
                    };
            });

            const refreshed = tokenHandler.refresh(jwtToken);
            res.status(200).json({ error: '', messages: taggedMessages, accessToken: refreshed.accessToken });
        }
        catch (e) {
            res.status(500).json({ error: e.toString(), accessToken: '' });
        }
    });

    app.post('/api/notifications', async (req, res) => {
        let jwtToken = req.headers['authorization'];
        if (jwtToken && jwtToken.startsWith('Bearer ')) jwtToken = jwtToken.slice(7);

        // Extract recipientId from the body so we know who to notify
        const { recipientId, type, content, relatedId } = req.body;

        if (!jwtToken || !type || !content || !recipientId) {
            return res.status(400).json({ error: 'Token, recipient, type, and content are required.', accessToken: '' });
        }

        try {
            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
            }

            const db = client.db('large_project');

            await db.collection('notifications').insertOne({
                recipientId: new ObjectId(recipientId), // Use the ID passed in the request body
                type: type,
                content: content,
                createdAt: new Date(),
                isRead: false,
                relatedId: relatedId ? new ObjectId(relatedId) : null
            });

            const refreshed = tokenHandler.refresh(jwtToken);
            res.status(200).json({ error: '', accessToken: refreshed.accessToken });
        } catch (e) {
            res.status(500).json({ error: e.toString(), accessToken: '' });
        }
    });

   app.get('/api/notifications', async (req, res) => {
    let jwtToken = req.headers['authorization'];

    if (!jwtToken) {
        return res.status(400).json({ error: 'Token is required.', accessToken: '' });
    }

    try {
        if (jwtToken.startsWith('Bearer ')) {
            jwtToken = jwtToken.slice(7);
        }

        if (tokenHandler.isExpired(jwtToken)) {
            return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
        }

        const db = client.db('large_project');
        const decoded = require('jsonwebtoken').decode(jwtToken);
        const userId = decoded?.id;

        if (!userId) {
            return res.status(400).json({ error: 'Invalid token payload.', accessToken: '' });
        }

        const userObjectId = new ObjectId(userId);

        const notifications = await db.collection('notifications')
            .find({ recipientId: userObjectId })
            .sort({ createdAt: -1 })
            .toArray();

        const refreshed = tokenHandler.refresh(jwtToken);

        res.status(200).json({ 
            error: '', 
            notifications: notifications, 
            accessToken: refreshed.accessToken 
        });
    } catch (e) {
        console.error("Fetch Notifications Error:", e);
        res.status(500).json({ error: e.toString(), accessToken: '' });
    }
    });

    app.get('/api/return-random-prompt', async (req, res) => {
        try {
            const conversationId = req.query.conversationId;

            if (!conversationId) {
                return res.status(400).json({ error: 'Conversation ID is required.' });
            }

            const db = client.db('large_project');

            const prompts = await db.collection('prompts').find().sort({ _id: 1 }).toArray();

            if (!prompts.length) {
                return res.status(404).json({ error: 'No prompts found.' });
            }

            const today = new Date().toISOString().split('T')[0];
            const hashHex = crypto
                .createHash('sha256')
                .update(`${conversationId}:${today}`)
                .digest('hex');
            const promptIndex = parseInt(hashHex.slice(0, 8), 16) % prompts.length;
            const prompt = prompts[promptIndex];

            res.status(200).json({ error: '', prompt: prompt });
        } catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });

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

    app.get('/api/conversations', async (req, res) => {
        let jwtToken = req.headers['authorization'];

        if (!jwtToken) {
            return res.status(401).json({ error: 'No token provided.' });
        }

        try {
            if (jwtToken.startsWith('Bearer ')) {
                jwtToken = jwtToken.slice(7);
            }

            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(401).json({ error: 'Token expired.' });
            }

            const decoded = require('jsonwebtoken').decode(jwtToken);
            const userId = new ObjectId(decoded.id);
            const db = client.db('large_project');

            const conversations = await db.collection('conversations').aggregate([
                {
                    $match: { participants: userId }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'participants',
                        foreignField: '_id',
                        as: 'participantDetails'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        lastMessage: 1,
                        lastMessageAt: 1,
                        participants: 1,
                        otherUser: {
                            $let: {
                                vars: {
                                    match: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$participantDetails",
                                                    as: "p",
                                                    cond: { $ne: ["$$p._id", userId] }
                                                }
                                            }, 0
                                        ]
                                    }
                                },
                                in: {
                                    // ONLY include safe fields here
                                    firstName: "$$match.firstName",
                                    lastName: "$$match.lastName",
                                    username: "$$match.username"
                                }
                            }
                        }
                    }
                },
                {
                    $sort: { lastMessageAt: -1 }
                }
            ]).toArray();

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

    app.post('/api/conversations/:conversationId/smart-reply', async (req, res) => {
        let jwtToken = req.headers['authorization'];
        if (!jwtToken) return res.status(401).json({ error: 'No token provided.' });

        try {
            if (jwtToken.startsWith('Bearer ')) jwtToken = jwtToken.slice(7);
            if (tokenHandler.isExpired(jwtToken)) return res.status(401).json({ error: 'Token expired.' });

            const decoded = require('jsonwebtoken').decode(jwtToken);
            const userId = new ObjectId(decoded.id);
            const conversationId = new ObjectId(req.params.conversationId);
            const db = client.db('large_project');

            // 1. Verify user is a participant in this conversation
            const conversation = await db.collection('conversations').findOne({
                _id: conversationId,
                participants: userId
            });
            if (!conversation) return res.status(403).json({ error: 'Not a participant in this conversation.' });

            // 2. Check daily limit
            const today = new Date().toISOString().split('T')[0];
            const usageCount = await db.collection('ai_usage').countDocuments({
                conversationId: conversationId,
                userId: userId,
                date: today
            });
            if (usageCount >= 5) {
                return res.status(429).json({ error: 'You have used up your 5 smart replies for today in this conversation.' });
            }

            // 3. Fetch last 20 messages
            const messages = await db.collection('messages')
                .find({ conversationId: conversationId.toString() })
                .sort({ createdAt: -1 })
                .limit(20)
                .toArray();
            messages.reverse();

            console.log('Messages found:', messages.length);
            // if (messages.length > 0) console.log('Sample message:', JSON.stringify(messages[0], null, 2));

            // 4. Format messages for the LLM
            const formattedHistory = messages.map(m => {
                const role = m.senderId.toString() === userId.toString() ? 'You' : 'Friend';
                return `${role}: ${m.text}`;
            }).join('\n');

            const systemPrompt = `You are a helpful assistant suggesting a reply in a friendly conversation. 
            Be warm, natural, and concise. Only suggest one reply of 1-2 sentences. 
            For your response do not ask questions, do not explain yourself, and do not add any preamble; 
            Just give back the suggestion based on the previous messages.`;
            

            const userMessage = `Here is the conversation so far:\n${formattedHistory}.`;

            // 5. Call the LLM
            const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3000',
                    'X-Title': 'Friend Connector'
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-3.3-70b-instruct',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage }
                    ],
                    max_tokens: 150
                })
            });

           const llmData = await llmResponse.json();
           console.log('OpenRouter response:', JSON.stringify(llmData, null, 2));
           console.log('Messages:', JSON.stringify(formattedHistory, null, 2));
           const suggestion = llmData.choices?.[0]?.message?.content;
           if (!suggestion) throw new Error('No response from LLM');

            // 6. Record usage
            await db.collection('ai_usage').insertOne({
                conversationId: conversationId,
                userId: userId,
                date: today,
                usedAt: new Date()
            });

            const refreshed = tokenHandler.refresh(jwtToken);
            res.status(200).json({
                suggestion: suggestion,
                accessToken: refreshed.accessToken
            });

        } catch (e) {
            console.error('Smart reply error:', e);
            res.status(500).json({ error: e.toString() });
        }
    });

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

            // 1. Pull both names from the decoded JWT
            const userFirstName = decoded?.firstName || "A";
            const userLastName = decoded?.lastName || "Friend";
            const fullName = `${userFirstName} ${userLastName}`.trim();

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

            const friendships = await db.collection('friendships').find({
                $or: [{ requesterId: userId }, { recipientId: userId }],
                status: 'accepted'
            }).toArray();

            if (friendships.length > 0) {
                const friendNotifications = friendships.map(f => {
                    const friendId = f.requesterId.equals(userId) ? f.recipientId : f.requesterId;
                    return {
                        recipientId: friendId,
                        senderId: userId, // Better name than requesterId for a notification
                        senderFirstName: userFirstName, // Storing these helps the frontend
                        senderLastName: userLastName,
                        type: 'support_needed',
                        content: `${fullName} needs some ${type}!`,
                        createdAt: new Date(),
                        isRead: false,
                        relatedId: result.insertedId
                    };
                });
                await db.collection('notifications').insertMany(friendNotifications);
            }

            const refreshed = tokenHandler.refresh(jwtToken);

            res.status(200).json({
                requestId: result.insertedId,
                accessToken: refreshed.accessToken
            });
        } catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });

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

    app.get('/api/receive-notification', async (req, res) => {

        let jwtToken = req.headers['authorization'];

        if (!jwtToken) {
            return res.status(401).json({ error: 'No token provided.', accessToken: '' });
        }

        try {
            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
            }

            const db = client.db('large_project');

            const decoded = require('jsonwebtoken').decode(jwtToken);
            const recipientId = decoded?.id;

            if (!recipientId) {
                return res.status(400).json({ error: 'Invalid token payload.', accessToken: '' });
            }

            const notifications = await db.collection('notifications').find({
                recipientId: new ObjectId(recipientId),
                isRead: false
            }).toArray();

            const refreshed = tokenHandler.refresh(jwtToken);
            res.status(200).json({ error: '', notifications: notifications, accessToken: refreshed.accessToken });
        }
        catch (e) {
            res.status(500).json({ error: e.toString(), accessToken: '' });
        }
    });

    app.post('/api/mark-notification-read', async (req, res) => {
        const { notificationId } = req.body;
        let jwtToken = req.headers['authorization'];

        if (!jwtToken) return res.status(401).json({ error: "No token." });

        try {
            if (jwtToken.startsWith('Bearer ')) jwtToken = jwtToken.slice(7);
            const db = client.db('large_project');

            await db.collection('notifications').updateOne(
                { _id: new ObjectId(notificationId) },
                { $set: { isRead: true } }
            );

            const refreshed = tokenHandler.refresh(jwtToken);
            res.status(200).json({ success: true, accessToken: refreshed.accessToken });
        } catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });

}

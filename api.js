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

        if (!jwtToken) {
            return res.status(401).json({ error: 'No token provided.' });
        }

        try {
            if (jwtToken.startsWith('Bearer ')) {
                jwtToken = jwtToken.slice(7, jwtToken.length);
            }

            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(401).json({ error: 'Token expired.' });
            }

            const db = client.db('large_project');
            
            const decoded = require('jsonwebtoken').decode(jwtToken);
            if (!decoded || !decoded.id) {
                return res.status(401).json({ error: 'Invalid token payload.' });
            }
            
            const requesterId = new ObjectId(decoded.id);
            const skip = (page - 1) * limit; 

            const friendshipDocs = await db.collection('friendships')
                .find({ 
                    $or: [{ requesterId: requesterId }, { recipientId: requesterId }]
                })
                .toArray();

            const friendIds = friendshipDocs.map(f => 
                f.requesterId.equals(requesterId) ? f.recipientId : f.requesterId
            );
            
            const refreshed = tokenHandler.refresh(jwtToken);
            
            if (friendIds.length === 0) {
                return res.status(200).json({
                    friends: [],
                    page: page,
                    totalPages: 0,
                    total: 0,
                    accessToken: refreshed.accessToken
                });
            }

            const userFilter = { _id: { $in: friendIds } };

            if (sanitizedSearch) {
                const searchRegex = { $regex: sanitizedSearch, $options: 'i' };
                userFilter.$or = [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { username: searchRegex }
                ];
            }

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

    app.post('/api/friends', async (req, res,) =>
    {
        const { username } = req.body;
        let jwtToken = req.headers['authorization']; 

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
            const requesterFirstName = decoded?.firstName;

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
                ],
                status: { $in: ['pending', 'accepted'] }
            });

            if (existing) {
                ret = { error: 'Friend already exists.', accessToken: '' };
                return res.status(200).json(ret);
            }

            const friendshipResult = await db.collection('friendships').insertOne({
                requesterId: requesterObjectId,
                recipientId: recipientObjectId,
                status: 'pending'
            });

            await db.collection('notifications').insertOne({
                recipientid: recipientObjectId,
                type: 'friend_request',
                content: `${requesterFirstName} sent you a friend request.`,
                createdAt: new Date(),
                isRead: false,
                relatedId: friendshipResult.insertedId
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
        
        let jwtToken = req.headers['authorization'];
        
        const { friendshipId } = req.body;  

        if (!friendshipId || !jwtToken) {
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
            const userFirstName = decoded?.firstName || "Someone";

            if (!userId) {
                ret = { error: 'Invalid token payload.', accessToken: '' };
                return res.status(200).json(ret);
            }

            const userObjectId = new ObjectId(userId);
            const friendshipObjectId = new ObjectId(friendship_id);

            const friendship = await db.collection('friendships').findOne({ 
                _id: friendshipObjectId, 
                recipientId: userObjectId, 
                status: 'pending' 
            });

            if (!friendship) {
                return res.status(400).json({ error: 'Friend request not found or already accepted.', accessToken: '' });
            }

            await db.collection('friendships').updateOne(
                { _id: friendshipObjectId },
                { $set: { status: 'accepted' } }
            );

            await db.collection('notifications').insertOne({
                recipientId: friendship.requesterId,
                type: 'friend_accepted',
                content: `${userFirstName} accepted your friend request!`,
                createdAt: new Date(),
                isRead: false,
                relatedId: friendshipObjectId
            });

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
        
        let jwtToken = req.headers['authorization'];
        
        const { senderID, conversationID, message} = req.body;

        if (!senderID || !conversationID || !message || !jwtToken) {
            return res.status(400).json({ error: 'senderID, conversationID, message, and token are required.', accessToken: '' });
        }

        try {
            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
            }

            const db = client.db('large_project');
            const senderObjectId = new ObjectId(senderID);
            const conversationObjectId = new ObjectId(conversationID);

            await db.collection('messages').insertOne({
                conversationId: conversationID,
                senderId: senderID,
                text: message,
                createdAt: new Date()
            });

            await db.collection('conversations').updateOne(
                { _id: conversationObjectId },
                { $set: { lastMessage: message, lastMessageAt: new Date() } }
            );

            const convo = await db.collection('conversations').findOne({ _id: conversationObjectId });
            if (convo) {
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
            res.status(200).json({ error: '', accessToken: refreshed.accessToken });
        } catch (e) {
            res.status(500).json({ error: e.toString(), accessToken: '' });
        }
    });

    app.get('/api/messages', async (req, res) => {
        
        let jwtToken = req.headers['authorization'];
        
        const { senderID, conversationID } = req.body;

        if (!senderID || !conversationID|| !jwtToken) {
            return res.status(400).json({ error: 'senderID, conversationID, and token are required.', accessToken: '' });
        }

        try {
            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
            }

            const db = client.db('large_project');

            const senderObjectId = new ObjectId(senderID);

            const messages = await db.collection('messages')
                .find({ conversationId: conversationID })
                .sort({ createdAt: 1 })
                .toArray();

            const taggedMessages = messages.map(msg => {
                const msgSender = msg.senderId;
                return {
                    ...msg,
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

        const{type, content, relatedId} = req.body;

        if (!jwtToken || !type || !content) {
            return res.status(400).json({ error: 'Token, type, and content are required.', accessToken: '' });
        }

        try {
            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
            }

        const db = client.db('large_project');

        const decoded = require('jsonwebtoken').decode(jwtToken);
        const recepientId = decoded?.id;

        if (!recepientId) {
            return res.status(400).json({ error: 'Invalid token payload.', accessToken: '' });
        }

        await db.collection('notifications').insertOne({
            recipientid: new ObjectId(recepientId),
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

        // 1. Fetch all notifications for this user (sorted by newest first)
        const notifications = await db.collection('notifications')
            .find({ recipientId: userObjectId }) // Use recipientId if you standardized to camelCase
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
            if (jwtToken.startsWith('Bearer ')) {
                jwtToken = jwtToken.slice(7, jwtToken.length);
            }

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
            const userFirstName = decoded?.firstName || "A friend";
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
                        type: 'support_needed',
                        content: `${userFirstName} needs some ${type}!`,
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

    app.get('/api/return-random-prompt', async (req, res) => {
        try {
            const db = client.db('large_project');
            const prompts = await db.collection('prompts').find().toArray();
            if (!prompts.length) return res.status(404).json({ error: 'No prompts' });
            res.status(200).json({ prompt: prompts[crypto.randomInt(0, prompts.length)] });
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
            const recepientId = decoded?.id;

            if (!recepientId) {
                return res.status(400).json({ error: 'Invalid token payload.', accessToken: '' });
            }

            const notifications = await db.collection('notifications').find({
                recipientid: new ObjectId(recepientId),
                isRead: false
            }).toArray();

            const refreshed = tokenHandler.refresh(jwtToken);
            res.status(200).json({ error: '', notifications: notifications, accessToken: refreshed.accessToken });
        }
        catch (e) {
            res.status(500).json({ error: e.toString(), accessToken: '' });
        }
    });

}

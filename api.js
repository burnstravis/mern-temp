require('express');
const { ObjectId } = require('mongodb');
const tokenHandler = require('./createJWT.js');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');
const crypto = require('crypto');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.setApp = function (app, client) {

    // --- INTERNAL HELPER ---
    const createNotification = async (db, recipientId, type, content, relatedId = null) => {
        try {
            await db.collection('notifications').insertOne({
                recipientId: new ObjectId(recipientId),
                type: type,
                content: content,
                createdAt: new Date(),
                isRead: false,
                relatedId: relatedId ? new ObjectId(relatedId) : null
            });
        } catch (e) {
            console.error("Internal Notification Error:", e);
        }
    };

    app.post('/api/register', async (req, res) => {
        const { firstName, lastName, email, username, password, birthday } = req.body;
        if (!firstName || !lastName || !email || !username || !password || !birthday) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        try {
            const db = client.db('large_project');
            const existingUser = await db.collection('users').findOne({ username: username, verified: true });
            const existingEmail = await db.collection('users').findOne({ email: email, verified: true });
            if (existingUser) return res.status(400).json({ error: 'Username already taken.' });
            if (existingEmail) return res.status(400).json({ error: 'Email already registered.' });

            const hashedPassword = await bcrypt.hash(password, 10);
            const verificationCode = crypto.randomInt(10000, 99999).toString();
            await db.collection('users').deleteMany({ email: email, verified: false });
            await db.collection('users').insertOne({
                firstName, lastName, email, username, birthday,
                password: hashedPassword, verificationCode, verified: false
            });

            await resend.emails.send({
                from: 'noreply@largeproject.nathanfoss.me',
                to: email,
                subject: '[TEST] VERIFY EMAIL',
                text: `Your verification code is: ${verificationCode}`
            });
            res.status(200).json({ error: '' });
        } catch (e) {
            res.status(500).json({ error: e.toString() });
        }
    });

    app.post('/api/verify-email', async (req, res) => {
        const { email, code } = req.body;
        try {
            const db = client.db('large_project');
            const user = await db.collection('users').findOne({ email: email, verified: false });
            if (!user || user.verificationCode !== code.trim()) {
                return res.status(400).json({ error: 'Invalid code or email.' });
            }
            await db.collection('users').updateOne({ email }, { $set: { verified: true }, $unset: { verificationCode: '' } });
            res.status(200).json({ Success: 'SUCCESSFULLY VERIFIED' });
        } catch (e) { res.status(500).json({ error: e.toString() }); }
    });

    app.post('/api/login', async (req, res) => {
        const { login, password } = req.body;
        const db = client.db('large_project');
        try {
            const user = await db.collection('users').findOne({ username: login });
            if (user && await bcrypt.compare(password, user.password)) {
                if (!user.verified) return res.status(200).json({ error: 'ACCOUNT NOT VERIFIED' });
                const tokenData = tokenHandler.createToken(user.firstName, user.lastName, user._id);
                res.status(200).json({ id: user._id, firstName: user.firstName, lastName: user.lastName, accessToken: tokenData.accessToken, error: '' });
            } else {
                res.status(200).json({ error: "Login/Password incorrect" });
            }
        } catch (e) { res.status(500).json({ error: e.toString() }); }
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

    app.post('/api/friends', async (req, res,) =>
    {
        const { username } = req.body;
        let jwtToken = req.headers['authorization']?.split(' ')[1] || req.headers['authorization'];
        try {
            const db = client.db('large_project');
            const decoded = require('jsonwebtoken').decode(jwtToken);
            const recipient = await db.collection('users').findOne({ username, verified: true });
            if (!recipient) return res.status(200).json({ error: 'User not found' });

            const reqId = new ObjectId(decoded.id);
            const recId = recipient._id;

            await db.collection('friendships').insertOne({ requesterId: reqId, recipientId: recId, status: 'pending' });
            
            await createNotification(db, recId, "friend_request", `${decoded.firstName} sent you a friend request.`, reqId);

            res.status(200).json({ error: '', accessToken: tokenHandler.refresh(jwtToken).accessToken });
        } catch (e) { res.status(200).json({ error: e.toString() }); }
    });

    app.post('/api/accept-friend-request', async (req, res) => {
        const { friendship_id } = req.body;
        let jwtToken = req.headers['authorization']?.split(' ')[1] || req.headers['authorization'];
        try {
            const db = client.db('large_project');
            const decoded = require('jsonwebtoken').decode(jwtToken);
            const friendship = await db.collection('friendships').findOne({ _id: new ObjectId(friendship_id) });

            await db.collection('friendships').updateOne({ _id: new ObjectId(friendship_id) }, { $set: { status: 'accepted' } });

            await createNotification(db, friendship.requesterId, "friend_accepted", "Your friend request was accepted!", decoded.id);

            res.status(200).json({ error: '', accessToken: tokenHandler.refresh(jwtToken).accessToken });
        } catch (e) { res.status(500).json({ error: e.toString() }); }
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


    app.get('/api/messages', async (req, res) => {
        
        let jwtToken = req.headers['authorization'];
        
        const { senderID, conversationID } = req.body;

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

            const taggedMessages = messages.map(msg => {
                // 1. Get the sender ID from the message (checking both common casings)
                const msgSender = msg.senderID;
                return {
                    ...msg,
                    fromSender: msgSender ? msgSender.toString() === senderObjectId.toString() : false
                    };
            });

            const refreshed = tokenHandler.refresh(jwtToken);
            res.status(200).json({ error: '', messages: taggedMessages, accessToken: refreshed.accessToken });
        }
        catch (e){
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
        }
        catch (e) {
            res.status(500).json({ error: e.toString(), accessToken: '' });
        }
    });

    app.post('/api/conversations', async (req, res) => {
        const { friendId } = req.body; // The ID of the person you want to chat with
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

            // 1. Check if a conversation already exists between these two users
            // We search for a doc where the 'participants' array contains BOTH IDs
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

            // 2. If no conversation exists, create a new one
            const newConversation = {
                participants: [userId, friendObjectId],
                lastMessage: "",
                lastMessageAt: new Date(),
                createdAt: new Date()
            };

            const result = await db.collection('conversations').insertOne(newConversation);
            
            const conv = await db.collection('conversations').findOne({ _id: new ObjectId(conversationID) });
            const recipientId = conv.participants.find(p => p.toString() !== senderID.toString());
            await createNotification(db, recipientId, "message", "New message received.", conversationID);

            res.status(200).json({ error: '', accessToken: tokenHandler.refresh(jwtToken).accessToken });
        } catch (e) { res.status(500).json({ error: e.toString() }); }
    });

    app.post('/api/support-requests', async (req, res) => {
        const { content, type } = req.body;
        let jwtToken = req.headers['authorization']?.split(' ')[1] || req.headers['authorization'];
        try {
            const db = client.db('large_project');
            const decoded = require('jsonwebtoken').decode(jwtToken);
            const userId = new ObjectId(decoded.id);
            const expiresAt = new Date(new Date().getTime() + (24 * 60 * 60 * 1000));

            const result = await db.collection('support_requests').insertOne({ userId, content, type, createdAt: new Date(), expiresAt });

            const friends = await db.collection('friendships').find({
                $or: [{ requesterId: userId }, { recipientId: userId }], status: 'accepted'
            }).toArray();
            const friendIds = friends.map(f => f.requesterId.equals(userId) ? f.recipientId : f.requesterId);

            for (const fId of friendIds) {
                await createNotification(db, fId, "support", "A friend posted a new support request.", result.insertedId);
            }

            res.status(200).json({ error: '', accessToken: tokenHandler.refresh(jwtToken).accessToken });
        } catch (e) { res.status(500).json({ error: e.toString() }); }
    });

    app.get('/api/return-random-prompt', async (req, res) => {
        try {
            const db = client.db('large_project');
            const prompts = await db.collection('prompts').find().toArray();
            if (!prompts.length) return res.status(404).json({ error: 'No prompts' });
            res.status(200).json({ prompt: prompts[crypto.randomInt(0, prompts.length)] });
        } catch (e) { res.status(500).json({ error: e.toString() }); }
    });

    app.get('/api/receive-notification', async (req, res) => {

        let jwtToken = req.headers['authorization'];

        if (!jwtToken) {
            return res.status(401).json({ error: 'No token provided.', accessToken: '' });
        }

        try{
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
        catch (e){
            res.status(500).json({ error: e.toString(), accessToken: '' });
        }
    });

}
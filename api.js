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

    app.post('/api/friends', async (req, res) => {
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
        const { senderID, conversationID, message } = req.body;
        let jwtToken = req.headers['authorization']?.split(' ')[1] || req.headers['authorization'];
        try {
            const db = client.db('large_project');
            await db.collection('messages').insertOne({ conversationId: new ObjectId(conversationID), senderId: new ObjectId(senderID), text: message, createdAt: new Date() });
            
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
};
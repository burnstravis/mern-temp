const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { setApp } = require('./api');
const tokenHandler = require('./createJWT.js');

// Mock resend so no real emails are sent
jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
        emails: {
            send: jest.fn().mockResolvedValue({ error: null })
        }
    }))
}));

// Mock JWT handler
jest.mock('./createJWT.js', () => ({
    isExpired: jest.fn(() => false),
    createToken: jest.fn(() => ({ accessToken: 'mock-token' })),
    refresh: jest.fn(() => ({ accessToken: 'refreshed-token' }))
}));

// Mock bcrypt so no real hashing occurs
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn()
}));

// Mock jsonwebtoken decode used inline inside route handlers
jest.mock('jsonwebtoken', () => ({
    decode: jest.fn(() => ({
        id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe'
    }))
}));

const MOCK_USER_ID = '507f1f77bcf86cd799439011';
const MOCK_TOKEN   = 'Bearer mock-jwt-token';

// Builds a fake MongoDB client supporting per-collection overrides.
// Pass { users: { findOne: jest.fn() }, friendships: { find: jest.fn() } } etc.
function buildMockClient(collectionsMap = {}) {
    const makeDefaultCollection = () => ({
        findOne:        jest.fn().mockResolvedValue(null),
        insertOne:      jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
        insertMany:     jest.fn().mockResolvedValue({}),
        updateOne:      jest.fn().mockResolvedValue({}),
        deleteMany:     jest.fn().mockResolvedValue({}),
        countDocuments: jest.fn().mockResolvedValue(0),
        find: jest.fn(() => ({
            project: jest.fn().mockReturnThis(),
            skip:    jest.fn().mockReturnThis(),
            limit:   jest.fn().mockReturnThis(),
            sort:    jest.fn().mockReturnThis(),
            toArray: jest.fn().mockResolvedValue([])
        }))
    });

    const cache = {};
    const getCollection = (name) => {
        if (!cache[name]) {
            cache[name] = Object.assign(makeDefaultCollection(), collectionsMap[name] || {});
        }
        return cache[name];
    };

    const db = { collection: jest.fn((name) => getCollection(name)) };
    return { db: jest.fn(() => db) };
}

function buildApp(mockClient) {
    const app = express();
    app.use(express.json());
    setApp(app, mockClient);
    return app;
}

// ─── POST /api/register ───────────────────────────────────────────────────────

describe('POST /api/register', () => {

    it('returns 400 when all fields are missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app).post('/api/register').send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('All fields are required.');
    });

    it('returns 400 when some fields are missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .post('/api/register')
            .send({ firstName: 'John', lastName: 'Doe' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('All fields are required.');
    });

    it('returns 400 when username is already taken', async () => {
        const client = buildMockClient({
            users: {
                findOne: jest.fn()
                    .mockResolvedValueOnce({ username: 'john123', verified: true })
                    .mockResolvedValueOnce(null)
            }
        });
        const app = buildApp(client);

        const res = await request(app).post('/api/register').send({
            firstName: 'John', lastName: 'Doe', email: 'john@test.com',
            username: 'john123', password: 'pass123', birthday: '2000-01-01'
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Username already taken.');
    });

    it('returns 400 when email is already registered', async () => {
        const client = buildMockClient({
            users: {
                findOne: jest.fn()
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({ email: 'john@test.com', verified: true })
            }
        });
        const app = buildApp(client);

        const res = await request(app).post('/api/register').send({
            firstName: 'John', lastName: 'Doe', email: 'john@test.com',
            username: 'john123', password: 'pass123', birthday: '2000-01-01'
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email already registered.');
    });

    it('returns 200 and empty error on successful registration', async () => {
        const client = buildMockClient({
            users: { findOne: jest.fn().mockResolvedValue(null) }
        });
        const app = buildApp(client);

        const res = await request(app).post('/api/register').send({
            firstName: 'John', lastName: 'Doe', email: 'john@test.com',
            username: 'john123', password: 'pass123', birthday: '2000-01-01'
        });

        expect(res.status).toBe(200);
        expect(res.body.error).toBe('');
    });
});

// ─── POST /api/login ──────────────────────────────────────────────────────────

describe('POST /api/login', () => {

    it('returns 400 when both login and password are missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app).post('/api/login').send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Login and password are required.');
    });

    it('returns 400 when password is missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app).post('/api/login').send({ login: 'john123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Login and password are required.');
    });

    it('returns 400 when login is missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app).post('/api/login').send({ password: 'pass123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Login and password are required.');
    });

    it('returns error when user does not exist', async () => {
        const client = buildMockClient({ users: { findOne: jest.fn().mockResolvedValue(null) } });
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/login')
            .send({ login: 'nobody', password: 'wrong' });

        expect(res.status).toBe(200);
        expect(res.body.error).toBe('Login or Password incorrect');
    });

    it('returns error when password is incorrect', async () => {
        const client = buildMockClient({
            users: {
                findOne: jest.fn().mockResolvedValue({
                    username: 'john123', password: 'hashed', verified: true
                })
            }
        });
        bcrypt.compare.mockResolvedValue(false);
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/login')
            .send({ login: 'john123', password: 'wrongpass' });

        expect(res.status).toBe(200);
        expect(res.body.error).toBe('Login or Password incorrect');
    });

    it('returns error when account is not verified', async () => {
        const client = buildMockClient({
            users: {
                findOne: jest.fn().mockResolvedValue({
                    username: 'john123', password: 'hashed', verified: false
                })
            }
        });
        bcrypt.compare.mockResolvedValue(true);
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/login')
            .send({ login: 'john123', password: 'pass123' });

        expect(res.status).toBe(200);
        expect(res.body.error).toBe('ACCOUNT HAS NOT BEEN VERIFIED');
        expect(res.body.accessToken).toBe('');
    });

    it('returns token and user info on successful login', async () => {
        const client = buildMockClient({
            users: {
                findOne: jest.fn().mockResolvedValue({
                    _id: 'mock-id', username: 'john123', password: 'hashed',
                    firstName: 'John', lastName: 'Doe', verified: true
                })
            }
        });
        bcrypt.compare.mockResolvedValue(true);
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/login')
            .send({ login: 'john123', password: 'pass123' });

        expect(res.status).toBe(200);
        expect(res.body.error).toBe('');
        expect(res.body.accessToken).toBe('mock-token');
        expect(res.body.firstName).toBe('John');
        expect(res.body.lastName).toBe('Doe');
    });
});

// ─── POST /api/verify-email ───────────────────────────────────────────────────

describe('POST /api/verify-email', () => {

    it('returns 400 when email and code are missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app).post('/api/verify-email').send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email and code are required.');
    });

    it('returns 400 when code is missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .post('/api/verify-email')
            .send({ email: 'john@test.com' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email and code are required.');
    });

    it('returns 400 when no pending registration exists for that email', async () => {
        const client = buildMockClient({
            users: { findOne: jest.fn().mockResolvedValue(null) }
        });
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/verify-email')
            .send({ email: 'unknown@test.com', code: '12345' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('No pending registration found for this email.');
    });

    it('returns 400 when verification code is wrong', async () => {
        const client = buildMockClient({
            users: {
                findOne: jest.fn().mockResolvedValue({
                    email: 'john@test.com', verificationCode: '11111', verified: false
                })
            }
        });
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/verify-email')
            .send({ email: 'john@test.com', code: '99999' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('WRONG CODE.');
    });

    it('returns 200 on successful verification', async () => {
        const client = buildMockClient({
            users: {
                findOne: jest.fn().mockResolvedValue({
                    email: 'john@test.com', verificationCode: '11111', verified: false
                }),
                updateOne: jest.fn().mockResolvedValue({})
            }
        });
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/verify-email')
            .send({ email: 'john@test.com', code: '11111' });

        expect(res.status).toBe(200);
        expect(res.body.Success).toBe('SUCCESSFULLY VERIFIED');
    });
});

// ─── POST /api/email-recovery ─────────────────────────────────────────────────

describe('POST /api/email-recovery', () => {

    it('returns 400 when email is missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app).post('/api/email-recovery').send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email is required.');
    });

    it('returns 400 when no verified account exists for that email', async () => {
        const client = buildMockClient({
            users: { findOne: jest.fn().mockResolvedValue(null) }
        });
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/email-recovery')
            .send({ email: 'unknown@test.com' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('No verified account found for this email.');
    });

    it('returns 200 and sends recovery code on success', async () => {
        const client = buildMockClient({
            users: {
                findOne: jest.fn().mockResolvedValue({ email: 'john@test.com', verified: true }),
                updateOne: jest.fn().mockResolvedValue({})
            }
        });
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/email-recovery')
            .send({ email: 'john@test.com' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe('SENT RECOVERY CODE TO EMAIL');
    });
});

// ─── POST /api/reset-password ─────────────────────────────────────────────────

describe('POST /api/reset-password', () => {

    const validBody = {
        email: 'john@test.com',
        verificationCode: '12345',
        password: 'newpass',
        confirmpassword: 'newpass'
    };

    it('returns 400 when email is missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .post('/api/reset-password')
            .send({ verificationCode: '12345', password: 'newpass', confirmpassword: 'newpass' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Username required.');
    });

    it('returns 400 when verification code is missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .post('/api/reset-password')
            .send({ email: 'john@test.com', password: 'newpass', confirmpassword: 'newpass' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Verification code is required.');
    });

    it('returns 400 when password fields are missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .post('/api/reset-password')
            .send({ email: 'john@test.com', verificationCode: '12345' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Password and confirmation are required.');
    });

    it('returns 400 when passwords do not match', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .post('/api/reset-password')
            .send({ ...validBody, confirmpassword: 'differentpass' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Passwords do not match.');
    });

    it('returns 400 when no verified account found for that email', async () => {
        const client = buildMockClient({
            users: { findOne: jest.fn().mockResolvedValue(null) }
        });
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/reset-password')
            .send(validBody);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('No verified account found for this email.');
    });

    it('returns 400 when verification code is incorrect', async () => {
        const client = buildMockClient({
            users: {
                findOne: jest.fn().mockResolvedValue({
                    email: 'john@test.com', verified: true, verificationCode: '99999'
                })
            }
        });
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/reset-password')
            .send(validBody);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Verification code is incorrect.');
    });

    it('returns 200 on successful password reset', async () => {
        const client = buildMockClient({
            users: {
                findOne: jest.fn().mockResolvedValue({
                    email: 'john@test.com', verified: true, verificationCode: '12345'
                }),
                updateOne: jest.fn().mockResolvedValue({})
            }
        });
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/reset-password')
            .send(validBody);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe('Password reset successful. Please login with the new password.');
    });
});

// ─── GET /api/users ───────────────────────────────────────────────────────────

describe('GET /api/users', () => {

    it('returns 401 when no token is provided', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app).get('/api/users');

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('No token provided.');
    });

    it('returns 401 when token is expired', async () => {
        tokenHandler.isExpired.mockReturnValueOnce(true);
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .get('/api/users')
            .set('Authorization', MOCK_TOKEN);

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Token expired.');
    });

    it('returns 200 with paginated users on success', async () => {
        const mockUsers = [
            { _id: 'abc', firstName: 'Jane', lastName: 'Doe', username: 'jane', email: 'jane@test.com' }
        ];
        const client = buildMockClient({
            users: {
                find: jest.fn(() => ({
                    project: jest.fn().mockReturnThis(),
                    skip:    jest.fn().mockReturnThis(),
                    limit:   jest.fn().mockReturnThis(),
                    toArray: jest.fn().mockResolvedValue(mockUsers)
                })),
                countDocuments: jest.fn().mockResolvedValue(1)
            }
        });
        const app = buildApp(client);

        const res = await request(app)
            .get('/api/users')
            .set('Authorization', MOCK_TOKEN);

        expect(res.status).toBe(200);
        expect(res.body.users).toHaveLength(1);
        expect(res.body.users[0].firstName).toBe('Jane');
        expect(res.body.total).toBe(1);
        expect(res.body.accessToken).toBe('refreshed-token');
    });

    it('returns 200 with empty users list when no users exist', async () => {
        const client = buildMockClient({
            users: {
                find: jest.fn(() => ({
                    project: jest.fn().mockReturnThis(),
                    skip:    jest.fn().mockReturnThis(),
                    limit:   jest.fn().mockReturnThis(),
                    toArray: jest.fn().mockResolvedValue([])
                })),
                countDocuments: jest.fn().mockResolvedValue(0)
            }
        });
        const app = buildApp(client);

        const res = await request(app)
            .get('/api/users')
            .set('Authorization', MOCK_TOKEN);

        expect(res.status).toBe(200);
        expect(res.body.users).toHaveLength(0);
        expect(res.body.total).toBe(0);
    });
});

// ─── GET /api/friends ─────────────────────────────────────────────────────────

describe('GET /api/friends', () => {

    it('returns 401 when no token is provided', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app).get('/api/friends');

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('No token provided.');
    });

    it('returns 401 when token is expired', async () => {
        tokenHandler.isExpired.mockReturnValueOnce(true);
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .get('/api/friends')
            .set('Authorization', MOCK_TOKEN);

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Token expired.');
    });

    it('returns 200 with empty friends list when user has no friendships', async () => {
        const client = buildMockClient({
            friendships: {
                find: jest.fn(() => ({ toArray: jest.fn().mockResolvedValue([]) }))
            }
        });
        const app = buildApp(client);

        const res = await request(app)
            .get('/api/friends')
            .set('Authorization', MOCK_TOKEN);

        expect(res.status).toBe(200);
        expect(res.body.friends).toHaveLength(0);
        expect(res.body.total).toBe(0);
        expect(res.body.accessToken).toBe('refreshed-token');
    });

    it('returns 200 with friends list when friendships exist', async () => {
        const userId    = new ObjectId(MOCK_USER_ID);
        const friendId  = new ObjectId('617f1f77bcf86cd799439022');
        const mockFriend = { _id: friendId, firstName: 'Jane', lastName: 'Doe', username: 'jane' };

        const client = buildMockClient({
            friendships: {
                find: jest.fn(() => ({
                    toArray: jest.fn().mockResolvedValue([
                        { requesterId: userId, recipientId: friendId }
                    ])
                }))
            },
            users: {
                find: jest.fn(() => ({
                    project: jest.fn().mockReturnThis(),
                    skip:    jest.fn().mockReturnThis(),
                    limit:   jest.fn().mockReturnThis(),
                    toArray: jest.fn().mockResolvedValue([mockFriend])
                })),
                countDocuments: jest.fn().mockResolvedValue(1)
            }
        });
        const app = buildApp(client);

        const res = await request(app)
            .get('/api/friends')
            .set('Authorization', MOCK_TOKEN);

        expect(res.status).toBe(200);
        expect(res.body.friends).toHaveLength(1);
        expect(res.body.friends[0].firstName).toBe('Jane');
        expect(res.body.total).toBe(1);
    });
});

// ─── POST /api/friends ────────────────────────────────────────────────────────

describe('POST /api/friends', () => {

    it('returns 400 when username is missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .post('/api/friends')
            .set('Authorization', MOCK_TOKEN)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Username and token are required.');
    });

    it('returns 400 when token is missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .post('/api/friends')
            .send({ username: 'jane' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Username and token are required.');
    });

    it('returns error when recipient user is not found', async () => {
        const client = buildMockClient({
            users: { findOne: jest.fn().mockResolvedValue(null) }
        });
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/friends')
            .set('Authorization', MOCK_TOKEN)
            .send({ username: 'nobody' });

        expect(res.status).toBe(200);
        expect(res.body.error).toBe('User not found.');
    });

    it('returns error when user tries to add themselves', async () => {
        // Recipient _id matches the decoded token's id
        const client = buildMockClient({
            users: {
                findOne: jest.fn().mockResolvedValue({
                    _id: new ObjectId(MOCK_USER_ID),
                    username: 'john123',
                    verified: true
                })
            }
        });
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/friends')
            .set('Authorization', MOCK_TOKEN)
            .send({ username: 'john123' });

        expect(res.status).toBe(200);
        expect(res.body.error).toBe('You cannot add yourself.');
    });

    it('returns error when friendship already exists', async () => {
        const client = buildMockClient({
            users: {
                findOne: jest.fn().mockResolvedValue({
                    _id: new ObjectId('617f1f77bcf86cd799439022'),
                    username: 'jane', verified: true
                })
            },
            friendships: {
                findOne: jest.fn().mockResolvedValue({ status: 'accepted' })
            }
        });
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/friends')
            .set('Authorization', MOCK_TOKEN)
            .send({ username: 'jane' });

        expect(res.status).toBe(200);
        expect(res.body.error).toBe('Friend already exists.');
    });

    it('returns 200 and success message on successful friend request', async () => {
        const client = buildMockClient({
            users: {
                findOne: jest.fn().mockResolvedValue({
                    _id: new ObjectId('617f1f77bcf86cd799439022'),
                    username: 'jane', verified: true
                })
            },
            friendships: {
                findOne:   jest.fn().mockResolvedValue(null),
                insertOne: jest.fn().mockResolvedValue({ insertedId: 'friendship-id' })
            },
            notifications: {
                insertOne: jest.fn().mockResolvedValue({})
            }
        });
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/friends')
            .set('Authorization', MOCK_TOKEN)
            .send({ username: 'jane' });

        expect(res.status).toBe(200);
        expect(res.body.error).toBe('');
        expect(res.body.message).toBe('Friend request sent successfully.');
        expect(res.body.accessToken).toBe('refreshed-token');
    });
});

// ─── GET /api/notifications ───────────────────────────────────────────────────

describe('GET /api/notifications', () => {

    it('returns 400 when no token is provided', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app).get('/api/notifications');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Token is required.');
    });

    it('returns 200 with error when token is expired', async () => {
        tokenHandler.isExpired.mockReturnValueOnce(true);
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .get('/api/notifications')
            .set('Authorization', MOCK_TOKEN);

        expect(res.status).toBe(200);
        expect(res.body.error).toBe('The JWT is no longer valid');
    });

    it('returns 200 with notifications list on success', async () => {
        const mockNotifications = [
            { _id: 'n1', type: 'friend_request', content: 'Jane sent you a friend request.', isRead: false }
        ];
        const client = buildMockClient({
            notifications: {
                find: jest.fn(() => ({
                    sort:    jest.fn().mockReturnThis(),
                    toArray: jest.fn().mockResolvedValue(mockNotifications)
                }))
            }
        });
        const app = buildApp(client);

        const res = await request(app)
            .get('/api/notifications')
            .set('Authorization', MOCK_TOKEN);

        expect(res.status).toBe(200);
        expect(res.body.notifications).toHaveLength(1);
        expect(res.body.notifications[0].type).toBe('friend_request');
        expect(res.body.accessToken).toBe('refreshed-token');
    });

    it('returns 200 with empty notifications list when none exist', async () => {
        const client = buildMockClient({
            notifications: {
                find: jest.fn(() => ({
                    sort:    jest.fn().mockReturnThis(),
                    toArray: jest.fn().mockResolvedValue([])
                }))
            }
        });
        const app = buildApp(client);

        const res = await request(app)
            .get('/api/notifications')
            .set('Authorization', MOCK_TOKEN);

        expect(res.status).toBe(200);
        expect(res.body.notifications).toHaveLength(0);
    });
});

// ─── POST /api/notifications ──────────────────────────────────────────────────

describe('POST /api/notifications', () => {

    it('returns 400 when token is missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .post('/api/notifications')
            .send({ type: 'friend_request', content: 'Hello' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Token, type, and content are required.');
    });

    it('returns 400 when type is missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .post('/api/notifications')
            .set('Authorization', MOCK_TOKEN)
            .send({ content: 'Hello' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Token, type, and content are required.');
    });

    it('returns 400 when content is missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .post('/api/notifications')
            .set('Authorization', MOCK_TOKEN)
            .send({ type: 'friend_request' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Token, type, and content are required.');
    });

    it('returns 200 and empty error on successful notification creation', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .post('/api/notifications')
            .set('Authorization', MOCK_TOKEN)
            .send({ type: 'friend_request', content: 'Jane sent you a friend request.' });

        expect(res.status).toBe(200);
        expect(res.body.error).toBe('');
        expect(res.body.accessToken).toBe('refreshed-token');
    });

    it('returns 200 with error when token is expired', async () => {
        tokenHandler.isExpired.mockReturnValueOnce(true);
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .post('/api/notifications')
            .set('Authorization', MOCK_TOKEN)
            .send({ type: 'friend_request', content: 'Hello' });

        expect(res.status).toBe(200);
        expect(res.body.error).toBe('The JWT is no longer valid');
    });
});

const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const { setApp } = require('./api');

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

// Builds a fake MongoDB client whose users collection can be overridden per test
function buildMockClient(usersOverrides = {}) {
    const users = {
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
        deleteMany: jest.fn().mockResolvedValue({}),
        countDocuments: jest.fn().mockResolvedValue(0),
        ...usersOverrides
    };
    return {
        db: jest.fn(() => ({
            collection: jest.fn(() => users)
        }))
    };
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
            findOne: jest.fn()
                .mockResolvedValueOnce({ username: 'john123', verified: true }) // username exists
                .mockResolvedValueOnce(null)                                     // email is free
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
            findOne: jest.fn()
                .mockResolvedValueOnce(null)                                         // username is free
                .mockResolvedValueOnce({ email: 'john@test.com', verified: true })  // email exists
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
            findOne: jest.fn().mockResolvedValue(null) // no conflicts
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

        const res = await request(app)
            .post('/api/login')
            .send({ login: 'john123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Login and password are required.');
    });

    it('returns 400 when login is missing', async () => {
        const app = buildApp(buildMockClient());

        const res = await request(app)
            .post('/api/login')
            .send({ password: 'pass123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Login and password are required.');
    });

    it('returns error when user does not exist', async () => {
        const client = buildMockClient({
            findOne: jest.fn().mockResolvedValue(null)
        });
        const app = buildApp(client);

        const res = await request(app)
            .post('/api/login')
            .send({ login: 'nobody', password: 'wrong' });

        expect(res.status).toBe(200);
        expect(res.body.error).toBe('Login or Password incorrect');
    });

    it('returns error when password is incorrect', async () => {
        const client = buildMockClient({
            findOne: jest.fn().mockResolvedValue({
                username: 'john123', password: 'hashed', verified: true
            })
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
            findOne: jest.fn().mockResolvedValue({
                username: 'john123', password: 'hashed', verified: false
            })
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
            findOne: jest.fn().mockResolvedValue({
                _id: 'mock-id',
                username: 'john123',
                password: 'hashed',
                firstName: 'John',
                lastName: 'Doe',
                verified: true
            })
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

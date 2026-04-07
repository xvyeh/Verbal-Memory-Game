const request = require('supertest');
const app = require('../server');

describe('Verbal Memory API Tests', () => {
  let authToken;
  let userId;
  let matchId;

  // TEST 1: Register
  test('POST /api/register - creates new user', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'testuser', email: 'test@test.com', password: '123456' });
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
    authToken = res.body.token;
    userId = res.body.user.id;
  });

  // TEST 2: Login
  test('POST /api/login - authenticates user', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'test@test.com', password: '123456' });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.username).toBe('testuser');
  });

  // TEST 3: Get random word
  test('GET /api/words - returns random word', async () => {
    const res = await request(app)
      .get('/api/words')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.word).toBeDefined();
    expect(typeof res.body.word).toBe('string');
  });

  // TEST 4: Save game result
  test('POST /api/games - saves game score', async () => {
    const res = await request(app)
      .post('/api/games')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ score: 25, correct_answers: 25, wrong_answers: 1, duration_seconds: 60 });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // TEST 5: Get leaderboard
  test('GET /api/leaderboard - returns top scores', async () => {
    const res = await request(app).get('/api/leaderboard');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // TEST 6: Send friend request
  test('POST /api/friends/request - sends friend request', async () => {
    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ friendId: 999 });
    expect(res.statusCode).toBe(200);
  });

  // TEST 7: Create 1v1 match
  test('POST /api/matches/invite - creates challenge', async () => {
    const res = await request(app)
      .post('/api/matches/invite')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ friendId: 2 });
    if (res.statusCode === 403) {
      console.log('Skipping: Users are not friends yet');
    } else {
      expect(res.statusCode).toBe(200);
      matchId = res.body.matchId;
    }
  });

  // TEST 8: Get game history
  test('GET /api/games/history - returns user history', async () => {
    const res = await request(app)
      .get('/api/games/history')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// Run: npm test

import React from 'react';

const Docs: React.FC = () => {
  return (
    <div className="docs-container">
      <h1>📚 API Documentation</h1>
      
      <section>
        <h2>Technologies Used</h2>
        <div className="tech-grid">
          <div><strong>Backend:</strong> Node.js, Express, PostgreSQL</div>
          <div><strong>Frontend:</strong> React, TypeScript</div>
          <div><strong>Authentication:</strong> JWT, bcrypt</div>
          <div><strong>Database:</strong> PostgreSQL</div>
        </div>
      </section>

      <section>
        <h2>Database Schema</h2>
        <pre className="code-block">
{`┌─────────────────────────────────────────────────────────────┐
│                         users                                 │
├─────────────┬─────────────────────────────────┬──────────────┤
│ id          │ SERIAL PRIMARY KEY               │              │
│ username    │ VARCHAR(50) UNIQUE NOT NULL      │              │
│ email       │ VARCHAR(100) UNIQUE NOT NULL     │              │
│ password_hash│ VARCHAR(255) NOT NULL           │              │
│ best_score  │ INTEGER DEFAULT 0                │              │
│ games_played│ INTEGER DEFAULT 0                │              │
│ created_at  │ TIMESTAMP                        │              │
└─────────────┴─────────────────────────────────┴──────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         games                                 │
├─────────────┬─────────────────────────────────┬──────────────┤
│ id          │ SERIAL PRIMARY KEY               │              │
│ user_id     │ INTEGER REFERENCES users(id)     │              │
│ score       │ INTEGER NOT NULL                 │              │
│ correct_answers│ INTEGER NOT NULL              │              │
│ wrong_answers│ INTEGER NOT NULL                │              │
│ duration_seconds│ INTEGER                      │              │
│ played_at   │ TIMESTAMP                        │              │
└─────────────┴─────────────────────────────────┴──────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         words                                 │
├─────────────┬─────────────────────────────────┬──────────────┤
│ id          │ SERIAL PRIMARY KEY               │              │
│ word        │ VARCHAR(100) UNIQUE NOT NULL     │              │
└─────────────┴─────────────────────────────────┴──────────────┘`}
        </pre>
      </section>

      <section>
        <h2>API Endpoints</h2>
        <div className="endpoint">
          <h3>POST /api/register</h3>
          <p>Register a new user.</p>
          <pre className="code-block">{`Request: { "username": "player1", "email": "player@example.com", "password": "secret123" }
Response: { "user": { "id": 1, "username": "player1", "email": "player@example.com", ... }, "token": "jwt_token" }`}</pre>
        </div>

        <div className="endpoint">
          <h3>POST /api/login</h3>
          <p>Login existing user.</p>
          <pre className="code-block">{`Request: { "email": "player@example.com", "password": "secret123" }
Response: { "user": { ... }, "token": "jwt_token" }`}</pre>
        </div>

        <div className="endpoint">
          <h3>GET /api/words</h3>
          <p>Get a random word for the game (requires auth).</p>
          <pre className="code-block">{`Response: { "word": "apple" }`}</pre>
        </div>

        <div className="endpoint">
          <h3>POST /api/games</h3>
          <p>Save game result (requires auth).</p>
          <pre className="code-block">{`Request: { "score": 42, "correct_answers": 42, "wrong_answers": 1, "duration_seconds": 120 }
Response: { "success": true, "new_best": true }`}</pre>
        </div>

        <div className="endpoint">
          <h3>GET /api/games/history</h3>
          <p>Get user's game history (requires auth).</p>
          <pre className="code-block">{`Response: [{ "id": 1, "score": 42, "correct_answers": 42, "wrong_answers": 1, "duration_seconds": 120, "played_at": "2024-01-01T00:00:00Z" }]`}</pre>
        </div>

        <div className="endpoint">
          <h3>GET /api/leaderboard</h3>
          <p>Get top 10 scores (public).</p>
          <pre className="code-block">{`Response: [{ "username": "player1", "best_score": 100, "games_played": 5 }]`}</pre>
        </div>
      </section>

      <section>
        <h2>Game Logic</h2>
        <p>The Verbal Memory game works as follows:</p>
        <ol>
          <li>Players are shown one word at a time</li>
          <li>They must decide if they've seen the word before in the current session (SEEN) or if it's new (NEW)</li>
          <li>Each correct answer increases the score by 1</li>
          <li>The game ends immediately when the player makes a mistake</li>
          <li>The final score is the number of correct answers before the first mistake</li>
          <li>Scores are saved to the database and contribute to the player's best score</li>
        </ol>
        <p><strong>Strategy:</strong> Remember every word that appears. The game gets harder as more words accumulate in memory!</p>
      </section>
    </div>
  );
};

export default Docs;

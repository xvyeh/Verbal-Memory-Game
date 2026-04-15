import React from 'react';

const Docs: React.FC = () => {
  return (
    <div className="docs-container">
      <h1>📚 Game Documentation</h1>

      <section>
        <h2>Technologies Used</h2>
        <div className="tech-grid">
          <div><strong>Backend:</strong> Supabase (PostgreSQL + Realtime)</div>
          <div><strong>Frontend:</strong> React, TypeScript</div>
          <div><strong>Authentication:</strong> Supabase Auth</div>
          <div><strong>Database:</strong> PostgreSQL</div>
        </div>
      </section>

      <section>
        <h2>Database Schema</h2>
        <pre className="code-block">
{`┌─────────────────────────────────────────────────────────────┐
│                         profiles                              │
├─────────────┬─────────────────────────────────┬──────────────┤
│ id          │ UUID PRIMARY KEY                │              │
│ username    │ TEXT UNIQUE                     │              │
│ elo         │ INTEGER DEFAULT 1000            │              │
│ games_played│ INTEGER DEFAULT 0               │              │
└─────────────┴─────────────────────────────────┴──────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         matches                              │
├─────────────┬─────────────────────────────────┬──────────────┤
│ id          │ UUID PRIMARY KEY                │              │
│ player1_id  │ UUID → profiles(id)            │              │
│ player2_id  │ UUID → profiles(id)            │              │
│ player1_score│ INTEGER DEFAULT 0             │              │
│ player2_score│ INTEGER DEFAULT 0             │              │
│ status      │ TEXT (active, finished)        │              │
│ winner_id   │ UUID → profiles(id)            │              │
│ created_at  │ TIMESTAMP                      │              │
└─────────────┴─────────────────────────────────┴──────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    matchmaking_queue                         │
├─────────────┬─────────────────────────────────┬──────────────┤
│ player_id   │ UUID PRIMARY KEY → profiles(id)│              │
│ joined_at   │ TIMESTAMP                      │              │
└─────────────┴─────────────────────────────────┴──────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         words                                │
├─────────────┬─────────────────────────────────┬──────────────┤
│ id          │ SERIAL PRIMARY KEY              │              │
│ word        │ TEXT UNIQUE NOT NULL            │              │
└─────────────┴─────────────────────────────────┴──────────────┘`}
        </pre>
      </section>

      <section>
        <h2>Core Systems</h2>

        <div className="endpoint">
          <h3>👤 Profiles</h3>
          <p>Stores player data including username, ELO rating, and total games played.</p>
        </div>

        <div className="endpoint">
          <h3>⚔️ Matches</h3>
          <p>Represents a 1v1 game between two players.</p>
          <ul>
            <li>Tracks both players and their scores</li>
            <li>Status: <strong>active</strong> or <strong>finished</strong></li>
            <li>Winner is stored when match ends</li>
          </ul>
        </div>

        <div className="endpoint">
          <h3>⏳ Matchmaking Queue</h3>
          <p>Handles real-time matchmaking:</p>
          <ul>
            <li>Players join queue</li>
            <li>System pairs two players</li>
            <li>Creates a match automatically</li>
          </ul>
        </div>

        <div className="endpoint">
          <h3>📖 Words</h3>
          <p>Dictionary of words used in the memory game.</p>
        </div>
      </section>

      <section>
        <h2>Game Modes</h2>

        <div className="endpoint">
          <h3>🧠 Solo Play</h3>
          <ul>
            <li>Classic verbal memory gameplay</li>
            <li>Score increases for each correct answer</li>
            <li>Game ends on first mistake</li>
          </ul>
        </div>

        <div className="endpoint">
          <h3>⚔️ 1v1 Arena</h3>
          <ul>
            <li>Players are matched via queue</li>
            <li>Both players play simultaneously</li>
            <li>Scores are tracked in real-time</li>
            <li>Winner determined by highest score</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>Game Logic</h2>
        <ol>
          <li>A word is shown to the player</li>
          <li>Player must choose: <strong>SEEN</strong> or <strong>NEW</strong></li>
          <li>Correct answer → +1 score</li>
          <li>Wrong answer → game over</li>
          <li>In 1v1, both players compete for highest score</li>
        </ol>
        <p><strong>Tip:</strong> The longer you survive, the harder it gets — memory is everything.</p>
      </section>
    </div>
  );
};

export default Docs;

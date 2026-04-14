export interface User {
  id: number;
  username: string;
  email: string;
  best_score: number;
  games_played: number;
}

export interface GameResult {
  id: number;
  score: number;
  correct_answers: number;
  wrong_answers: number;
  duration_seconds: number;
  played_at: string;
}

export interface LeaderboardEntry {
  username: string;
  best_score: number;
  games_played: number;
}

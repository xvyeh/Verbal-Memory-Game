let users = [];
let games = [];

export function getUsers() {
  return users;
}

export function addUser(user) {
  users.push(user);
}

export function findUserByEmail(email) {
  return users.find(u => u.email === email);
}

export function addGame(game) {
  games.push(game);
}

export function getGames() {
  return games;
}
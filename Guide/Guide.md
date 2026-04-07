📡 API Endpoints
Base URL: http://localhost:5000/api

Authentication
Method	Endpoint	Description
POST	/register	Create account
POST	/login	Login user
bash
# Register
curl -X POST /api/register \
  -d '{"username":"player1","email":"p@example.com","password":"123456"}'

# Login
curl -X POST /api/login \
  -d '{"email":"p@example.com","password":"123456"}'
Solo Game
Method	Endpoint	Description	Auth
GET	/words	Get random word	✅
POST	/games	Save game result	✅
GET	/games/history	Get user history	✅
GET	/leaderboard	Top 10 scores	❌
bash
# Get word (requires token)
curl -X GET /api/words \
  -H "Authorization: Bearer <token>"

# Save score
curl -X POST /api/games \
  -H "Authorization: Bearer <token>" \
  -d '{"score":42,"correct_answers":42,"wrong_answers":1,"duration_seconds":120}'
1v1 Mode
Method	Endpoint	Description	Auth
POST	/matches/invite	Send challenge	✅
GET	/matches/pending	Get pending challenges	✅
POST	/matches/:id/accept	Accept challenge	✅
POST	/matches/:id/answer	Submit answer	✅
GET	/matches/:id/status	Get match status	✅
bash
# Send challenge
curl -X POST /api/matches/invite \
  -H "Authorization: Bearer <token>" \
  -d '{"friendId":5}'

# Submit answer
curl -X POST /api/matches/123/answer \
  -H "Authorization: Bearer <token>" \
  -d '{"roundNumber":1,"word":"apple","answer":"new"}'
Friends
Method	Endpoint	Description	Auth
GET	/friends	Get friends list	✅
POST	/friends/request	Send friend request	✅
PUT	/friends/accept	Accept friend request	✅
🎮 Game Logic
Solo Mode
text
Show word → Click SEEN/NEW → Correct? 
    ✓ → +1 score, next word
    ✗ → Game Over, save score
1v1 Mode
text
Challenge friend → Both play same 10 words → Most correct wins!
🧪 Running Tests
bash
cd backend
npm install --save-dev jest supertest
npm test

✅ Testing Checklist
User registration

User login

JWT authentication

Solo game mode

Score saving

Leaderboard

Game history

Friend requests

1v1 challenges

Match scoring

Winner determination

🔮 Future Improvements
WebSockets for real-time 1v1 gameplay

Word difficulty levels

Daily challenges

Mobile app version

📄 License
MIT

🙏 Acknowledgements
Inspired by Human Benchmark

Word list from common English vocabulary

// Mock word list for testing
const mockWords = [
  'apple', 'banana', 'cherry', 'date', 'elderberry',
  'fig', 'grape', 'honeydew', 'kiwi', 'lemon',
  'mango', 'nectarine', 'orange', 'peach', 'quince',
  'raspberry', 'strawberry', 'tangerine', 'ugli', 'vanilla',
  'watermelon', 'xigua', 'yam', 'zucchini'
];

export default async function handler(req, res) {
  try {
    // Mock authentication - just check if token exists
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Return random word from mock list
    const randomWord = mockWords[Math.floor(Math.random() * mockWords.length)];
    res.json({ word: randomWord });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}
}
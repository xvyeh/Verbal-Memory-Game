export default function handler(req, res) {
  const words = [
    "apple", "banana", "car", "dog", "elephant",
    "forest", "guitar", "house", "island", "jungle",
    "keyboard", "lamp", "mountain", "notebook", "ocean", "goat",
    "cat", "dog", "giraffe", "phone", "computer", "pokemon"
  ];

  const randomWord = words[Math.floor(Math.random() * words.length)];

  res.status(200).json({ word: randomWord });
}

export default function handler(req, res) {
  const words = [
    "apple",
    "banana",
    "car",
    "dog",
    "elephant",
    "forest",
    "guitar",
    "house",
    "island",
    "jungle"
  ];

  const randomWord = words[Math.floor(Math.random() * words.length)];

  res.status(200).json({ word: randomWord });
}
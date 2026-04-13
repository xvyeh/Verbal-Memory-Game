export default function handler(req, res) {
  const words = [
    "apple", "banana", "car", "dog", "elephant",
    "forest", "guitar", "house", "island", "jungle",
    "keyboard", "lamp", "mountain", "notebook", "ocean",
    "planet", "river", "star", "train", "window"
  ];

  const word = words[Math.floor(Math.random() * words.length)];

  res.status(200).json({ word });
}
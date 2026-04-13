export default async function handler(req, res) {
  try {
    // Temporarily remove auth check for debugging
    // const token = req.headers.authorization?.split(' ')[1];
    // if (!token) {
    //   return res.status(401).json({ error: 'No token provided' });
    // }

    const { score } = req.body;

    // Mock response - always return success
    res.json({ success: true, new_best: score > 20 }); // Mock new best if score > 20
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}
}
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

router.get('/users', (req, res) => {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  res.json({ users });
});

router.post('/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  const newUser = { id: Date.now(), name, email };
  res.status(201).json({ message: 'User created', user: newUser });
});

router.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  res.json({ message: `Getting user with ID: ${userId}` });
});

module.exports = router;
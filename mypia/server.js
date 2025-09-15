const express = require('express');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to My API!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
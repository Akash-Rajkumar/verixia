import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`Verixia backend listening on port ${PORT}`);
});

export default server;

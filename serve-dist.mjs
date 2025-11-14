import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 8083;
const distPath = path.join(__dirname, 'client', 'dist');

// Serve static files
app.use(express.static(distPath));

// For SPA, fallback to index.html
app.get('/*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Serving from: ${distPath}`);
});

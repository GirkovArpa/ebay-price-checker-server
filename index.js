import express from 'express';
import http from 'http';

import { getPrices } from './ebay.js';

const { PORT } = process.env;
const APP = express();
APP.use(express.json());
APP.get('/', async (req, res) => {
  try {
    const ids = req.query.ids || [];
    const items = [];
    for await (const item of getPrices(ids)) {
      items.push(...item);
    }
    res.json(items);
  } catch (e) {
    console.log(e);
    res.json({ error: 'The server encountered an error.' });
  }
});

const SERVER = http.createServer(APP);
SERVER.listen(PORT, () => console.log(`Server running on port ${PORT}.`));

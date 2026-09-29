import { env } from './config/env';
import { createApp } from './app';

const app = createApp();

import { checkDatabase } from './config/db';

checkDatabase()
  .then((result) => {
    if (result.ok) console.log('DB connected');
    else console.warn('DB not configured or unreachable:', result);
  })
  .catch((err) => console.error('DB connection failed:', err.message));

app.listen(env.port, () => {
  console.log(`TOM-PHENOM API listening on http://localhost:${env.port}`);
});

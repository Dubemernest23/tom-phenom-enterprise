import { env } from './config/env';
import { createApp } from './app';

const app = createApp();

app.listen(env.port, () => {
  console.log(`TOM-PHENOM API listening on http://localhost:${env.port}`);
});

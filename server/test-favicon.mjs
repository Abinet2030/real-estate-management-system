import app from './src/app.js';

const s = app.listen(3790, async () => {
  try {
    const r1 = await fetch('http://localhost:3790/favicon.ico');
    console.log('/favicon.ico', r1.status);
    const r2 = await fetch('http://localhost:3790/api/health');
    console.log('/api/health', r2.status);
    console.log(await r2.text());
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    s.close();
  }
});

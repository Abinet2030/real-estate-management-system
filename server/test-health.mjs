import app from './src/app.js';

const s = app.listen(3783, async () => {
  try {
    const r = await fetch('http://localhost:3783/api/health');
    console.log('STATUS', r.status);
    console.log(await r.text());
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    s.close();
  }
});

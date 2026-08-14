// This file runs on Vercel as a CommonJS module. The rest of the server is
// authored as ESM (`type: module`) and exporting `app` as an ES module. Vercel
// may `require()` this file which would fail if it tried to require an ESM file
// directly. To avoid `ERR_REQUIRE_ESM`, dynamically import the ESM `app.js`
// at request time and forward the request to the Express app.

// Use CommonJS exports so Vercel's require() can load this file.
module.exports = async function handler(req, res) {
	try {
		const mod = await import('../app.js');
		const app = mod && (mod.default || mod);
		if (!app) return res.status(500).send('Server application not available')
		return app(req, res)
	} catch (err) {
		console.error('Failed to load ESM app module:', err && err.stack ? err.stack : err)
		res.status(500).json({ error: { code: '500', message: 'A server error has occurred' } })
	}
}

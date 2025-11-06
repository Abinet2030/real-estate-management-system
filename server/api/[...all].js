
export default function disabledHandler(_req, res) {
  res.statusCode = 501;
  res.end('Serverless handler disabled. Run the Express server with node src/index.js');
}

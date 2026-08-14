module.exports = async (req, res) => {
  const { default: app } = await import('../app.js');
  return app(req, res);
};

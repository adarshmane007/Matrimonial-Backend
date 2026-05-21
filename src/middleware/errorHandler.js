export function errorHandler(err, _req, res, _next) {
  console.error(err);

  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    errors: err.errors,
  });
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}

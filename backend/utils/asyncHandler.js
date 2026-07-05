// Wraps an async route/middleware handler and forwards errors to Express's
// error-handling middleware instead of requiring try/catch everywhere.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;

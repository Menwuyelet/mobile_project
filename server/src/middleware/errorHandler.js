const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

const getDuplicateFieldName = (err) => {
  const keyPattern = err?.keyPattern && typeof err.keyPattern === 'object' ? Object.keys(err.keyPattern) : [];
  if (keyPattern.length > 0) {
    return keyPattern[0];
  }

  const keyValue = err?.keyValue && typeof err.keyValue === 'object' ? Object.keys(err.keyValue) : [];
  if (keyValue.length > 0) {
    return keyValue[0];
  }

  return '';
};

const resolveDuplicateMessage = (err) => {
  const field = getDuplicateFieldName(err);

  if (field === 'email') {
    return 'Email is already registered. Please sign in or use a different email.';
  }
  if (field === 'phoneNumber') {
    return 'Phone number is already in use. Please use another phone number.';
  }
  if (field === 'username') {
    return 'Username is already in use. Please use a different username.';
  }
  if (field) {
    return `Duplicate value for "${field}". Please use a different value and try again.`;
  }

  return 'A duplicate value already exists. Please use different details and try again.';
};

const errorHandler = (err, _req, res, _next) => {
  console.error(err);

  if (err?.code === 11000) {
    return res.status(409).json({ message: resolveDuplicateMessage(err) });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  return res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
};

module.exports = { notFoundHandler, errorHandler };

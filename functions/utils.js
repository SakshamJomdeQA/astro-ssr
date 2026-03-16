// Shared utility functions — no default export so Launch skips deploying this as a function

export function formatUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt ?? new Date().toISOString(),
  };
}

export function sendError(res, statusCode, message) {
  res.status(statusCode).json({ error: message });
}

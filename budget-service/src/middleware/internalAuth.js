const INTERNAL_PREFIX = 'Internal-Service-Key ';

const requireInternalServiceKey = (req, res, next) => {
  const configuredKey = process.env.INTERNAL_SERVICE_KEY;
  if (!configuredKey) {
    return res.status(500).json({ message: 'Internal service key is not configured' });
  }

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith(INTERNAL_PREFIX)) {
    return res.status(401).json({ message: 'Missing internal service authorization' });
  }

  const incomingKey = authHeader.slice(INTERNAL_PREFIX.length).trim();
  if (incomingKey !== configuredKey) {
    return res.status(403).json({ message: 'Invalid internal service authorization' });
  }

  next();
};

module.exports = {
  requireInternalServiceKey,
};

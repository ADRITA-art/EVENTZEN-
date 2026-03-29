const { requireInternalServiceKey } = require('../../../src/middleware/internalAuth');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('internalAuth middleware', () => {
  let originalKey;

  beforeEach(() => {
    originalKey = process.env.INTERNAL_SERVICE_KEY;
  });

  afterEach(() => {
    process.env.INTERNAL_SERVICE_KEY = originalKey;
    jest.clearAllMocks();
  });

  test('returns 500 when internal key is missing in env', () => {
    delete process.env.INTERNAL_SERVICE_KEY;
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();

    requireInternalServiceKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when authorization header is missing', () => {
    process.env.INTERNAL_SERVICE_KEY = 'secret';
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();

    requireInternalServiceKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when key does not match', () => {
    process.env.INTERNAL_SERVICE_KEY = 'secret';
    const req = { headers: { authorization: 'Internal-Service-Key wrong' } };
    const res = makeRes();
    const next = jest.fn();

    requireInternalServiceKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next when key is valid', () => {
    process.env.INTERNAL_SERVICE_KEY = 'secret';
    const req = { headers: { authorization: 'Internal-Service-Key secret' } };
    const res = makeRes();
    const next = jest.fn();

    requireInternalServiceKey(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

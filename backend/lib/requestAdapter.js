const parseCookies = (cookieHeader = '') => {
  return cookieHeader
    .split(';')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .reduce((cookies, pair) => {
      const index = pair.indexOf('=');
      if (index === -1) {
        return cookies;
      }

      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});
};

const getRawBody = (req) => {
  if (!req.body) {
    return Buffer.alloc(0);
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (req.body instanceof Uint8Array) {
    return Buffer.from(req.body);
  }

  if (typeof req.body === 'string') {
    return Buffer.from(req.body);
  }

  return Buffer.alloc(0);
};

export const createRequestAdapter = (req, fullUrl) => {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers || {})) {
    if (Array.isArray(value)) {
      headers.set(key, value.join(', '));
    } else if (value !== undefined) {
      headers.set(key, String(value));
    }
  }

  const rawBody = getRawBody(req);
  const cookieMap = parseCookies(req.headers?.cookie || '');

  return {
    url: fullUrl,
    method: req.method,
    headers,
    cookies: {
      get: (name) => {
        if (!(name in cookieMap)) {
          return undefined;
        }

        return { name, value: cookieMap[name] };
      },
    },
    async text() {
      return rawBody.toString('utf8');
    },
    async json() {
      const text = rawBody.toString('utf8');
      return text ? JSON.parse(text) : {};
    },
    async formData() {
      if (!rawBody.length) {
        return new FormData();
      }

      const request = new Request(fullUrl, {
        method: req.method,
        headers,
        body: rawBody,
      });

      return request.formData();
    },
  };
};
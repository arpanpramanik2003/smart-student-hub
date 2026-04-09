export const sendWebResponse = async (res, response) => {
  res.status(response.status);

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'content-length') {
      res.setHeader(key, value);
    }
  });

  if (!response.body) {
    res.end();
    return;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.startsWith('text/') || contentType.includes('application/json')) {
    res.send(await response.text());
    return;
  }

  res.send(Buffer.from(await response.arrayBuffer()));
};
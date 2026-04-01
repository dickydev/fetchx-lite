export function normalizeHeaders(headers = {}) {
  const result = {};

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  for (const key of Object.keys(headers)) {
    result[key.toLowerCase()] = headers[key];
  }

  return result;
}

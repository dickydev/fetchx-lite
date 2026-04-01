export function buildURL(url, params) {
  if (!params) return url;

  const usp = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;

    if (Array.isArray(value)) {
      value.forEach((item) => usp.append(key, String(item)));
    } else {
      usp.append(key, String(value));
    }
  }

  const queryString = usp.toString();
  if (!queryString) return url;

  return url.includes("?") ? `${url}&${queryString}` : `${url}?${queryString}`;
}

export function mergeConfig(defaultConfig = {}, requestConfig = {}) {
  return {
    ...defaultConfig,
    ...requestConfig,
    headers: {
      ...(defaultConfig.headers || {}),
      ...(requestConfig.headers || {}),
    },
  };
}

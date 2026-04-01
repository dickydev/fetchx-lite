export function isJSONContentType(value = "") {
  return value.toLowerCase().includes("application/json");
}

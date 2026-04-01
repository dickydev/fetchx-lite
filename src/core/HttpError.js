export class HttpError extends Error {
  constructor(message, config, request, response) {
    super(message);
    this.name = "HttpError";
    this.config = config;
    this.request = request;
    this.response = response;
    this.status = response?.status ?? null;
  }
}

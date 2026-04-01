import { buildURL } from "../utils/buildURL.js";
import { normalizeHeaders } from "../utils/headers.js";
import { isJSONContentType } from "../utils/isJSON.js";
import { HttpError } from "./HttpError.js";

function createTimeoutSignal(timeout, externalSignal) {
  if (!timeout) {
    return { signal: externalSignal, cleanup: () => {} };
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error("Timeout exceeded")),
    timeout,
  );

  const cleanup = () => clearTimeout(timer);

  if (!externalSignal) {
    return { signal: controller.signal, cleanup };
  }

  if (externalSignal.aborted) {
    controller.abort(externalSignal.reason);
  } else {
    externalSignal.addEventListener(
      "abort",
      () => controller.abort(externalSignal.reason),
      { once: true },
    );
  }

  return { signal: controller.signal, cleanup };
}

async function parseResponseBody(response, responseType) {
  if (responseType === "text") return response.text();
  if (responseType === "blob") return response.blob();
  if (responseType === "arrayBuffer") return response.arrayBuffer();

  const contentType = response.headers.get("content-type") || "";
  if (isJSONContentType(contentType)) {
    return response.json();
  }

  return response.text();
}

export async function dispatchRequest(config) {
  const {
    baseURL = "",
    url = "",
    method = "get",
    params,
    data,
    headers = {},
    timeout,
    responseType = "json",
    validateStatus = (status) => status >= 200 && status < 300,
    signal,
  } = config;

  const finalURL = buildURL(`${baseURL}${url}`, params);
  const normalizedHeaders = normalizeHeaders(headers);

  let body = data;

  if (
    data &&
    typeof data === "object" &&
    !(data instanceof FormData) &&
    !(data instanceof Blob) &&
    !(data instanceof ArrayBuffer)
  ) {
    if (!normalizedHeaders["content-type"]) {
      normalizedHeaders["content-type"] = "application/json";
    }

    if (isJSONContentType(normalizedHeaders["content-type"])) {
      body = JSON.stringify(data);
    }
  }

  const { signal: finalSignal, cleanup } = createTimeoutSignal(timeout, signal);

  const requestInit = {
    method: method.toUpperCase(),
    headers: normalizedHeaders,
    body: ["GET", "HEAD"].includes(method.toUpperCase()) ? undefined : body,
    signal: finalSignal,
  };

  let rawResponse;

  try {
    rawResponse = await fetch(finalURL, requestInit);
  } catch (error) {
    cleanup();
    throw new HttpError(
      error.message || "Network Error",
      config,
      requestInit,
      null,
    );
  }

  cleanup();

  const responseData = await parseResponseBody(rawResponse, responseType);

  const response = {
    data: responseData,
    status: rawResponse.status,
    statusText: rawResponse.statusText,
    headers: normalizeHeaders(rawResponse.headers),
    config,
    request: requestInit,
    raw: rawResponse,
  };

  if (!validateStatus(rawResponse.status)) {
    throw new HttpError(
      `Request failed with status code ${rawResponse.status}`,
      config,
      requestInit,
      response,
    );
  }

  return response;
}

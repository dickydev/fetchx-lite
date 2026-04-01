import { InterceptorManager } from "./InterceptorManager.js";
import { mergeConfig } from "./mergeConfig.js";
import { dispatchRequest } from "./dispatchRequest.js";

function bind(instance, fn) {
  return fn.bind(instance);
}

class Fetchx {
  constructor(defaultConfig = {}) {
    this.defaults = defaultConfig;
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager(),
    };
  }

  request(configOrUrl, config = {}) {
    let requestConfig =
      typeof configOrUrl === "string"
        ? { ...config, url: configOrUrl }
        : { ...configOrUrl };

    requestConfig = mergeConfig(this.defaults, requestConfig);

    const chain = [];

    this.interceptors.request.forEach((interceptor) => {
      chain.unshift(interceptor.onFulfilled, interceptor.onRejected);
    });

    chain.push(dispatchRequest, undefined);

    this.interceptors.response.forEach((interceptor) => {
      chain.push(interceptor.onFulfilled, interceptor.onRejected);
    });

    let promise = Promise.resolve(requestConfig);

    while (chain.length) {
      const onFulfilled = chain.shift();
      const onRejected = chain.shift();
      promise = promise.then(onFulfilled, onRejected);
    }

    return promise;
  }

  get(url, config) {
    return this.request(url, { ...config, method: "get" });
  }

  delete(url, config) {
    return this.request(url, { ...config, method: "delete" });
  }

  head(url, config) {
    return this.request(url, { ...config, method: "head" });
  }

  options(url, config) {
    return this.request(url, { ...config, method: "options" });
  }

  post(url, data, config) {
    return this.request(url, { ...config, url, data, method: "post" });
  }

  put(url, data, config) {
    return this.request(url, { ...config, url, data, method: "put" });
  }

  patch(url, data, config) {
    return this.request(url, { ...config, url, data, method: "patch" });
  }
}

export function createClient(defaultConfig = {}) {
  const context = new Fetchx(defaultConfig);
  const instance = bind(context, context.request);

  Object.getOwnPropertyNames(Fetchx.prototype).forEach((key) => {
    if (key !== "constructor") {
      instance[key] = Fetchx.prototype[key].bind(context);
    }
  });

  instance.defaults = context.defaults;
  instance.interceptors = context.interceptors;
  instance.create = (config) =>
    createClient(mergeConfig(context.defaults, config));

  return instance;
}

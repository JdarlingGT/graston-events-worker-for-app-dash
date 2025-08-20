var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index) => {
    const mark = `@${index}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match[1], new RegExp(`^${match[2]}(?=/${next})`)] : [label, match[1], new RegExp(`^${match[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
      try {
        return decoder(match);
      } catch {
        return match;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf(
    "/",
    url.charCodeAt(9) === 58 ? 13 : 8
  );
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param ? /\%/.test(param) ? tryDecodeURIComponent(param) : param : void 0;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value && typeof value === "string") {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class {
  static {
    __name(this, "Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class {
  static {
    __name(this, "Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var emptyParam = [];
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.#buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path2.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index = match.indexOf("", 1);
      return [matcher[1][index], match];
    };
    return this.match(method, path);
  }
  #buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class {
  static {
    __name(this, "Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.origin !== "*") {
      const existingVary = c.req.header("Vary");
      if (existingVary) {
        set("Vary", existingVary);
      } else {
        set("Vary", "Origin");
      }
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
  }, "cors2");
}, "cors");

// src/api-clients.ts
var USER_AGENT = "Graston-Data-Worker/0.1";
function basicAuth(user, pass) {
  return "Basic " + btoa(`${user}:${pass}`);
}
__name(basicAuth, "basicAuth");
async function readJsonOrThrow(res, url) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url} :: ${text}`);
  }
  return await res.json();
}
__name(readJsonOrThrow, "readJsonOrThrow");
function buildUrl(base, path, query) {
  const u = new URL(path.replace(/^\/+/, ""), base.endsWith("/") ? base : base + "/");
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== void 0 && v !== null) u.searchParams.set(k, String(v));
    }
  }
  return u.toString();
}
__name(buildUrl, "buildUrl");
function defaultHeaders() {
  return {
    "Accept": "application/json",
    "User-Agent": USER_AGENT
  };
}
__name(defaultHeaders, "defaultHeaders");
function wpAuthHeaders(env) {
  return {
    ...defaultHeaders(),
    "Authorization": basicAuth(env.WP_APP_USER, env.WP_APP_PASSWORD)
  };
}
__name(wpAuthHeaders, "wpAuthHeaders");
async function fetchWooCommerceProducts(env) {
  const perPage = 100;
  let page = 1;
  const all = [];
  while (true) {
    const url = buildUrl(env.WP_BASE_URL, "/wp-json/wc/v3/products", {
      per_page: perPage,
      page,
      status: "publish",
      consumer_key: env.WC_CONSUMER_KEY,
      consumer_secret: env.WC_CONSUMER_SECRET
    });
    const res = await fetch(url, { headers: defaultHeaders() });
    if (res.status === 401 || res.status === 403) {
      const body = await res.text().catch(() => "");
      throw new Error(`WooCommerce auth failed for products (page ${page}). Response: ${res.status} ${res.statusText}. ${body}`);
    }
    const items = await readJsonOrThrow(res, url);
    all.push(...items);
    if (items.length < perPage) break;
    page += 1;
  }
  return all;
}
__name(fetchWooCommerceProducts, "fetchWooCommerceProducts");
async function fetchEventACF(env, productId) {
  const acfUrl = buildUrl(env.WP_BASE_URL, `/wp-json/acf/v3/product/${productId}`);
  const res1 = await fetch(acfUrl, { headers: wpAuthHeaders(env) });
  if (res1.ok) {
    const data = await readJsonOrThrow(res1, acfUrl);
    if (data && typeof data === "object" && "acf" in data) {
      return data;
    }
    return { acf: data };
  }
  const wpUrl = buildUrl(env.WP_BASE_URL, `/wp-json/wp/v2/product/${productId}`, { context: "edit" });
  const res2 = await fetch(wpUrl, { headers: wpAuthHeaders(env) });
  if (!res2.ok) {
    const text = await res2.text().catch(() => "");
    throw new Error(`Failed to fetch ACF for product ${productId}. Tried ${acfUrl} then ${wpUrl}. Last: ${res2.status} ${res2.statusText}. ${text}`);
  }
  const wpJson = await res2.json();
  if (wpJson && typeof wpJson === "object" && "acf" in wpJson) {
    return { acf: wpJson.acf };
  }
  return { acf: {} };
}
__name(fetchEventACF, "fetchEventACF");
async function fetchWooCommerceOrdersForProduct(env, productId) {
  const perPage = 100;
  const targetStatuses = ["processing", "completed"];
  const all = [];
  for (const status of targetStatuses) {
    let page = 1;
    while (true) {
      const url = buildUrl(env.WP_BASE_URL, "/wp-json/wc/v3/orders", {
        per_page: perPage,
        page,
        status,
        product: productId,
        consumer_key: env.WC_CONSUMER_KEY,
        consumer_secret: env.WC_CONSUMER_SECRET
      });
      const res = await fetch(url, { headers: defaultHeaders() });
      if (res.status === 401 || res.status === 403) {
        const body = await res.text().catch(() => "");
        throw new Error(`WooCommerce auth failed for orders (product ${productId}, status ${status}, page ${page}). Response: ${res.status} ${res.statusText}. ${body}`);
      }
      const items = await readJsonOrThrow(res, url);
      all.push(...items);
      if (items.length < perPage) break;
      page += 1;
    }
  }
  const dedup = /* @__PURE__ */ new Map();
  for (const o of all) dedup.set(o.id, o);
  return Array.from(dedup.values());
}
__name(fetchWooCommerceOrdersForProduct, "fetchWooCommerceOrdersForProduct");
async function fetchLearnDashProgress(env, userId, courseId) {
  const url = buildUrl(env.WP_BASE_URL, `/wp-json/ldlms/v2/users/${userId}/courses/${courseId}`);
  const res = await fetch(url, { headers: wpAuthHeaders(env) });
  if (!res.ok) {
    return { progress: 0, status: "unknown" };
  }
  const data = await readJsonOrThrow(res, url);
  const progress = typeof data?.progress === "number" ? Math.max(0, Math.min(100, data.progress)) : typeof data?.percentage === "number" ? Math.max(0, Math.min(100, data.percentage)) : 0;
  const status = typeof data?.status === "string" ? data.status : progress === 100 ? "completed" : progress > 0 ? "in-progress" : "not-started";
  return { progress, status };
}
__name(fetchLearnDashProgress, "fetchLearnDashProgress");
async function fetchFluentCRMContactByEmail(env, email) {
  const url = buildUrl(env.WP_BASE_URL, "/wp-json/fluent-crm/v2/contacts", {
    search: email,
    per_page: 1,
    page: 1
  });
  const res = await fetch(url, { headers: wpAuthHeaders(env) });
  if (!res.ok) {
    return null;
  }
  const payload = await readJsonOrThrow(res, url);
  let list = [];
  if (Array.isArray(payload)) {
    list = payload;
  } else if (payload?.data?.data && Array.isArray(payload.data.data)) {
    list = payload.data.data;
  } else if (payload?.data && Array.isArray(payload.data)) {
    list = payload.data;
  }
  if (!list.length) return null;
  const c = list[0];
  const tags = Array.isArray(c?.tags) ? c.tags : Array.isArray(c?.taxonomy?.tags) ? c.taxonomy.tags : [];
  const contact = {
    id: typeof c?.id === "number" ? c.id : void 0,
    email: String(c?.email ?? email),
    first_name: typeof c?.first_name === "string" ? c.first_name : c?.firstName,
    last_name: typeof c?.last_name === "string" ? c.last_name : c?.lastName,
    tags: Array.isArray(tags) ? tags.map((t) => ({ id: Number(t.id ?? 0), title: String(t.title ?? t.name ?? "") })) : [],
    meta: typeof c?.meta === "object" && c?.meta ? c.meta : void 0
  };
  return contact;
}
__name(fetchFluentCRMContactByEmail, "fetchFluentCRMContactByEmail");
async function fetchVenues(env) {
  try {
    const mockVenues = [
      { id: "1", name: "Grand Hall", location: "123 Main St", capacity: 500 },
      { id: "2", name: "Conference Center", location: "456 Elm St", capacity: 300 }
    ];
    return mockVenues;
  } catch (error) {
    console.error("Error fetching venues:", error);
    return [];
  }
}
__name(fetchVenues, "fetchVenues");
async function createVenue(env, venue) {
  console.log("Creating venue:", venue);
}
__name(createVenue, "createVenue");
async function fetchInstructors(env) {
  try {
    const mockInstructors = [
      { id: "1", name: "John Doe", expertise: "Yoga", experience: 5 },
      { id: "2", name: "Jane Smith", expertise: "Pilates", experience: 8 }
    ];
    return mockInstructors;
  } catch (error) {
    console.error("Error fetching instructors:", error);
    return [];
  }
}
__name(fetchInstructors, "fetchInstructors");
async function createInstructor(env, instructor) {
  console.log("Creating instructor:", instructor);
}
__name(createInstructor, "createInstructor");

// src/transformer.ts
function toNumber(val, fallback = 0) {
  if (typeof val === "number") return Number.isFinite(val) ? val : fallback;
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}
__name(toNumber, "toNumber");
function toISODate(input) {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}
__name(toISODate, "toISODate");
function getAcfField(acf, ...keys) {
  const root = acf?.acf && typeof acf.acf === "object" ? acf.acf : void 0;
  if (!root) return void 0;
  for (const k of keys) {
    if (k in root) return root[k];
  }
  return void 0;
}
__name(getAcfField, "getAcfField");
function parseTitleAndLocation(name) {
  if (name.includes(" - ")) {
    const [title, location, ...rest] = name.split(" - ");
    return { title: title?.trim() || name, location: location?.trim() || "TBD" };
  }
  if (name.includes(" @ ")) {
    const [title, location, ...rest] = name.split(" @ ");
    return { title: title?.trim() || name, location: location?.trim() || "TBD" };
  }
  return { title: name, location: "TBD" };
}
__name(parseTitleAndLocation, "parseTitleAndLocation");
function computeStatus(startDateISO, capacity, enrolledCount) {
  if (!startDateISO) return "Watch";
  const now = /* @__PURE__ */ new Date();
  const start = new Date(startDateISO);
  const ms = start.getTime() - now.getTime();
  const daysUntil = Math.floor(ms / (1e3 * 60 * 60 * 24));
  if (ms < 0) return "Completed";
  if (capacity > 0) {
    const ratio = enrolledCount / capacity;
    if (daysUntil <= 7 && ratio < 0.5) return "Danger";
    if (daysUntil <= 21 && ratio < 0.3) return "Watch";
    return "Go";
  }
  if (daysUntil <= 7 && enrolledCount === 0) return "Danger";
  if (daysUntil <= 21 && enrolledCount <= 2) return "Watch";
  return "Go";
}
__name(computeStatus, "computeStatus");
function transformProductToEventListItem(product, acfData) {
  const { title, location } = parseTitleAndLocation(product.name || "Event");
  const startDateRaw = getAcfField(acfData, "startDate", "start_date") ?? "";
  const startDate = toISODate(startDateRaw);
  const remaining = product.manage_stock ? toNumber(product.stock_quantity, 0) : null;
  const sold = toNumber(product.total_sales, 0);
  const acfCapacity = toNumber(getAcfField(acfData, "capacity"), 0);
  const capacity = remaining !== null ? remaining + sold : acfCapacity;
  const enrolledCount = sold;
  const status = computeStatus(startDate, capacity, enrolledCount);
  const url = typeof product.permalink === "string" ? product.permalink : "";
  const item = {
    id: product.id,
    title,
    startDate,
    location,
    capacity,
    enrolledCount,
    status,
    url
  };
  return item;
}
__name(transformProductToEventListItem, "transformProductToEventListItem");
function transformOrderToAttendeeProfile(order, learnDashData, fluentCrmData) {
  const name = `${order.billing?.first_name ?? ""} ${order.billing?.last_name ?? ""}`.trim() || "Unknown";
  const email = order.billing?.email || "";
  const courseProgress = learnDashData?.progress ?? 0;
  const courseStatus = learnDashData?.status ?? "unknown";
  const meta = fluentCrmData?.meta ?? void 0;
  const licenseType = (typeof meta?.["license_type"] === "string" ? meta["license_type"] : void 0) ?? (typeof meta?.["licenseType"] === "string" ? meta["licenseType"] : void 0);
  const licenseNumber = (typeof meta?.["license_number"] === "string" ? meta["license_number"] : void 0) ?? (typeof meta?.["licenseNumber"] === "string" ? meta["licenseNumber"] : void 0);
  const providerType = (typeof meta?.["provider_type"] === "string" ? meta["provider_type"] : void 0) ?? (typeof meta?.["providerType"] === "string" ? meta["providerType"] : void 0);
  const crmTags = Array.isArray(fluentCrmData?.tags) ? fluentCrmData.tags.map((t) => t.title).filter(Boolean) : void 0;
  const profile = {
    orderId: order.id,
    name,
    email,
    orderDate: toISODate(order.date_created),
    courseProgress,
    courseStatus,
    licenseType,
    licenseNumber,
    providerType,
    crmTags
  };
  return profile;
}
__name(transformOrderToAttendeeProfile, "transformOrderToAttendeeProfile");
function buildEventDetail(listItem, acfData, attendees) {
  const overview = String(getAcfField(acfData, "overview") ?? "") || "";
  const schedule = String(getAcfField(acfData, "schedule") ?? "") || "";
  const ceus = toNumber(getAcfField(acfData, "ceus"), 0);
  return {
    ...listItem,
    overview,
    schedule,
    ceus,
    attendees
  };
}
__name(buildEventDetail, "buildEventDetail");
function resolveCourseId(acfData, fallback) {
  const v = getAcfField(acfData, "courseId", "course_id");
  const n = toNumber(v, toNumber(fallback, 0));
  return n > 0 ? n : 0;
}
__name(resolveCourseId, "resolveCourseId");

// src/index.ts
var app = new Hono2();
app.use("/*", cors({
  origin: ["https://graston-events-page-for-app-dash.pages.dev", "http://localhost:3000", "https://localhost:3000"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: false
}));
app.get("/", (c) => c.json({ ok: true }));
app.get("/api/events", async (c) => {
  const env = c.env;
  try {
    const products = await fetchWooCommerceProducts(env);
    const items = await Promise.all(
      products.map(async (p) => {
        const acf = await fetchEventACF(env, p.id);
        return transformProductToEventListItem(p, acf);
      })
    );
    items.sort((a, b) => {
      const ta = a.startDate ? Date.parse(a.startDate) : Number.POSITIVE_INFINITY;
      const tb = b.startDate ? Date.parse(b.startDate) : Number.POSITIVE_INFINITY;
      return ta - tb;
    });
    return c.json(items, 200);
  } catch (err) {
    console.error("Error fetching events:", err);
    return c.json({
      error: "Failed to fetch events",
      code: "EVENTS_FETCH_ERROR",
      details: String(err?.message || err)
    }, 500);
  }
});
app.post("/api/events", async (c) => {
  const env = c.env;
  try {
    const body = await c.req.json();
    if (!body.name || !body.price) {
      return c.json({
        error: "Missing required fields",
        code: "VALIDATION_ERROR",
        details: "name and price are required"
      }, 400);
    }
    const productData = {
      name: body.name,
      type: "simple",
      regular_price: String(body.price),
      status: body.status || "publish",
      manage_stock: body.manage_stock !== false,
      stock_quantity: body.stock_quantity || body.capacity || null,
      description: body.description || "",
      short_description: body.short_description || "",
      categories: body.categories || [],
      images: body.images || [],
      meta_data: body.meta_data || []
    };
    const url = buildUrl2(env.WP_BASE_URL, "/wp-json/wc/v3/products", {
      consumer_key: env.WC_CONSUMER_KEY,
      consumer_secret: env.WC_CONSUMER_SECRET
    });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Graston-Data-Worker/0.1"
      },
      body: JSON.stringify(productData)
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      return c.json({
        error: "Failed to create event",
        code: "CREATE_ERROR",
        details: errorText
      }, res.status);
    }
    const createdProduct = await res.json();
    if (body.acf) {
      try {
        const acfUrl = buildUrl2(env.WP_BASE_URL, `/wp-json/acf/v3/product/${createdProduct.id}`);
        const acfRes = await fetch(acfUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": basicAuth2(env.WP_APP_USER, env.WP_APP_PASSWORD),
            "User-Agent": "Graston-Data-Worker/0.1"
          },
          body: JSON.stringify({ fields: body.acf })
        });
        if (!acfRes.ok) {
          console.error("Failed to update ACF fields:", await acfRes.text());
        }
      } catch (acfError) {
        console.error("Error updating ACF fields:", acfError);
      }
    }
    return c.json(createdProduct, 201);
  } catch (err) {
    console.error("Error creating event:", err);
    return c.json({
      error: "Failed to create event",
      code: "CREATE_ERROR",
      details: String(err?.message || err)
    }, 500);
  }
});
app.put("/api/events/:id", async (c) => {
  const env = c.env;
  const idStr = c.req.param("id");
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ error: "Invalid id" }, 400);
  }
  try {
    const body = await c.req.json();
    const updateData = {};
    if (body.name !== void 0) updateData.name = body.name;
    if (body.price !== void 0) updateData.regular_price = String(body.price);
    if (body.status !== void 0) updateData.status = body.status;
    if (body.manage_stock !== void 0) updateData.manage_stock = body.manage_stock;
    if (body.stock_quantity !== void 0) updateData.stock_quantity = body.stock_quantity;
    if (body.capacity !== void 0) updateData.stock_quantity = body.capacity;
    if (body.description !== void 0) updateData.description = body.description;
    if (body.short_description !== void 0) updateData.short_description = body.short_description;
    if (body.categories !== void 0) updateData.categories = body.categories;
    if (body.images !== void 0) updateData.images = body.images;
    if (body.meta_data !== void 0) updateData.meta_data = body.meta_data;
    const url = buildUrl2(env.WP_BASE_URL, `/wp-json/wc/v3/products/${id}`, {
      consumer_key: env.WC_CONSUMER_KEY,
      consumer_secret: env.WC_CONSUMER_SECRET
    });
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Graston-Data-Worker/0.1"
      },
      body: JSON.stringify(updateData)
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      if (res.status === 404) {
        return c.json({ error: "Event not found" }, 404);
      }
      return c.json({
        error: "Failed to update event",
        code: "UPDATE_ERROR",
        details: errorText
      }, res.status);
    }
    const updatedProduct = await res.json();
    if (body.acf) {
      try {
        const acfUrl = buildUrl2(env.WP_BASE_URL, `/wp-json/acf/v3/product/${id}`);
        const acfRes = await fetch(acfUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": basicAuth2(env.WP_APP_USER, env.WP_APP_PASSWORD),
            "User-Agent": "Graston-Data-Worker/0.1"
          },
          body: JSON.stringify({ fields: body.acf })
        });
        if (!acfRes.ok) {
          console.error("Failed to update ACF fields:", await acfRes.text());
        }
      } catch (acfError) {
        console.error("Error updating ACF fields:", acfError);
      }
    }
    return c.json(updatedProduct, 200);
  } catch (err) {
    console.error(`Error updating event ${id}:`, err);
    return c.json({
      error: "Failed to update event",
      code: "UPDATE_ERROR",
      details: String(err?.message || err)
    }, 500);
  }
});
app.delete("/api/events/:id", async (c) => {
  const env = c.env;
  const idStr = c.req.param("id");
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ error: "Invalid id" }, 400);
  }
  try {
    const url = buildUrl2(env.WP_BASE_URL, `/wp-json/wc/v3/products/${id}`, {
      consumer_key: env.WC_CONSUMER_KEY,
      consumer_secret: env.WC_CONSUMER_SECRET,
      force: "true"
      // Permanently delete instead of moving to trash
    });
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Graston-Data-Worker/0.1"
      }
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      if (res.status === 404) {
        return c.json({ error: "Event not found" }, 404);
      }
      return c.json({
        error: "Failed to delete event",
        code: "DELETE_ERROR",
        details: errorText
      }, res.status);
    }
    const deletedProduct = await res.json();
    return c.json({
      message: "Event deleted successfully",
      id: deletedProduct.id
    }, 200);
  } catch (err) {
    console.error(`Error deleting event ${id}:`, err);
    return c.json({
      error: "Failed to delete event",
      code: "DELETE_ERROR",
      details: String(err?.message || err)
    }, 500);
  }
});
function basicAuth2(user, pass) {
  return "Basic " + btoa(`${user}:${pass}`);
}
__name(basicAuth2, "basicAuth");
function buildUrl2(base, path, query) {
  const u = new URL(path.replace(/^\/+/, ""), base.endsWith("/") ? base : base + "/");
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== void 0 && v !== null) u.searchParams.set(k, String(v));
    }
  }
  return u.toString();
}
__name(buildUrl2, "buildUrl");
app.get("/api/events/:id", async (c) => {
  const env = c.env;
  const idStr = c.req.param("id");
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ error: "Invalid id" }, 400);
  }
  try {
    const products = await fetchWooCommerceProducts(env);
    const product = products.find((p) => p.id === id);
    if (!product) {
      return c.json({ error: "Event not found" }, 404);
    }
    const acf = await fetchEventACF(env, product.id);
    const listItem = transformProductToEventListItem(product, acf);
    const orders = await fetchWooCommerceOrdersForProduct(env, product.id);
    const byEmail = /* @__PURE__ */ new Map();
    for (const o of orders) {
      const email = (o.billing?.email || "").toLowerCase().trim();
      if (!email) continue;
      const existing = byEmail.get(email);
      if (!existing) {
        byEmail.set(email, o);
      } else {
        const tNew = Date.parse(o.date_created);
        const tOld = Date.parse(existing.date_created);
        if (!Number.isFinite(tOld) || Number.isFinite(tNew) && tNew < tOld) {
          byEmail.set(email, o);
        }
      }
    }
    const courseId = resolveCourseId(acf, env.LEARNDASH_DEFAULT_COURSE_ID);
    const attendeeOrders = Array.from(byEmail.values());
    const profiles = await Promise.all(
      attendeeOrders.map(async (order) => {
        const email = (order.billing?.email || "").toLowerCase().trim();
        const userId = Number(order.customer_id || 0);
        const ld = userId > 0 && courseId > 0 ? await fetchLearnDashProgress(env, userId, courseId) : null;
        const crm = email ? await fetchFluentCRMContactByEmail(env, email) : null;
        return transformOrderToAttendeeProfile(order, ld ?? void 0, crm ?? void 0);
      })
    );
    profiles.sort((a, b) => {
      const ta = a.orderDate ? Date.parse(a.orderDate) : 0;
      const tb = b.orderDate ? Date.parse(b.orderDate) : 0;
      return ta - tb;
    });
    const detail = buildEventDetail(listItem, acf, profiles);
    return c.json(detail, 200);
  } catch (err) {
    console.error(`Error fetching event detail for ID ${id}:`, err);
    return c.json({
      error: "Failed to fetch event details",
      code: "EVENT_DETAIL_FETCH_ERROR",
      details: String(err?.message || err)
    }, 500);
  }
});
app.get("/api/venues", async (c) => {
  const env = c.env;
  try {
    const venues = await fetchVenues(env);
    return c.json(venues, 200);
  } catch (err) {
    console.error("Error fetching venues:", err);
    return c.json({
      error: "Failed to fetch venues",
      code: "VENUES_FETCH_ERROR",
      details: String(err?.message || err)
    }, 500);
  }
});
app.get("/api/venues/:id", async (c) => {
  const env = c.env;
  const id = c.req.param("id");
  try {
    const venues = await fetchVenues(env);
    const venue = venues.find((v) => v.id === id);
    if (!venue) {
      return c.json({ error: "Venue not found" }, 404);
    }
    return c.json(venue, 200);
  } catch (err) {
    console.error(`Error fetching venue ${id}:`, err);
    return c.json({
      error: "Failed to fetch venue",
      code: "VENUE_FETCH_ERROR",
      details: String(err?.message || err)
    }, 500);
  }
});
app.post("/api/venues", async (c) => {
  const env = c.env;
  try {
    const body = await c.req.json();
    if (!body.name || !body.location || body.capacity === void 0) {
      return c.json({
        error: "Missing required fields",
        code: "VALIDATION_ERROR",
        details: "name, location, and capacity are required"
      }, 400);
    }
    const newVenue = {
      id: String(Date.now()),
      name: body.name,
      location: body.location,
      capacity: Number(body.capacity)
    };
    await createVenue(env, newVenue);
    return c.json(newVenue, 201);
  } catch (err) {
    console.error("Error creating venue:", err);
    return c.json({
      error: "Failed to create venue",
      code: "VENUE_CREATE_ERROR",
      details: String(err?.message || err)
    }, 500);
  }
});
app.put("/api/venues/:id", async (c) => {
  const env = c.env;
  const id = c.req.param("id");
  try {
    const body = await c.req.json();
    const venues = await fetchVenues(env);
    const venueIndex = venues.findIndex((v) => v.id === id);
    if (venueIndex === -1) {
      return c.json({ error: "Venue not found" }, 404);
    }
    const updatedVenue = {
      ...venues[venueIndex],
      ...body.name !== void 0 && { name: body.name },
      ...body.location !== void 0 && { location: body.location },
      ...body.capacity !== void 0 && { capacity: Number(body.capacity) }
    };
    console.log("Updating venue:", updatedVenue);
    return c.json(updatedVenue, 200);
  } catch (err) {
    console.error(`Error updating venue ${id}:`, err);
    return c.json({
      error: "Failed to update venue",
      code: "VENUE_UPDATE_ERROR",
      details: String(err?.message || err)
    }, 500);
  }
});
app.delete("/api/venues/:id", async (c) => {
  const env = c.env;
  const id = c.req.param("id");
  try {
    const venues = await fetchVenues(env);
    const venue = venues.find((v) => v.id === id);
    if (!venue) {
      return c.json({ error: "Venue not found" }, 404);
    }
    console.log("Deleting venue:", id);
    return c.json({
      message: "Venue deleted successfully",
      id
    }, 200);
  } catch (err) {
    console.error(`Error deleting venue ${id}:`, err);
    return c.json({
      error: "Failed to delete venue",
      code: "VENUE_DELETE_ERROR",
      details: String(err?.message || err)
    }, 500);
  }
});
app.get("/api/instructors", async (c) => {
  const env = c.env;
  try {
    const instructors = await fetchInstructors(env);
    return c.json(instructors, 200);
  } catch (err) {
    console.error("Error fetching instructors:", err);
    return c.json({
      error: "Failed to fetch instructors",
      code: "INSTRUCTORS_FETCH_ERROR",
      details: String(err?.message || err)
    }, 500);
  }
});
app.get("/api/instructors/:id", async (c) => {
  const env = c.env;
  const id = c.req.param("id");
  try {
    const instructors = await fetchInstructors(env);
    const instructor = instructors.find((i) => i.id === id);
    if (!instructor) {
      return c.json({ error: "Instructor not found" }, 404);
    }
    return c.json(instructor, 200);
  } catch (err) {
    console.error(`Error fetching instructor ${id}:`, err);
    return c.json({
      error: "Failed to fetch instructor",
      code: "INSTRUCTOR_FETCH_ERROR",
      details: String(err?.message || err)
    }, 500);
  }
});
app.post("/api/instructors", async (c) => {
  const env = c.env;
  try {
    const body = await c.req.json();
    if (!body.name || !body.expertise || body.experience === void 0) {
      return c.json({
        error: "Missing required fields",
        code: "VALIDATION_ERROR",
        details: "name, expertise, and experience are required"
      }, 400);
    }
    const newInstructor = {
      id: String(Date.now()),
      name: body.name,
      expertise: body.expertise,
      experience: Number(body.experience)
    };
    await createInstructor(env, newInstructor);
    return c.json(newInstructor, 201);
  } catch (err) {
    console.error("Error creating instructor:", err);
    return c.json({
      error: "Failed to create instructor",
      code: "INSTRUCTOR_CREATE_ERROR",
      details: String(err?.message || err)
    }, 500);
  }
});
app.put("/api/instructors/:id", async (c) => {
  const env = c.env;
  const id = c.req.param("id");
  try {
    const body = await c.req.json();
    const instructors = await fetchInstructors(env);
    const instructorIndex = instructors.findIndex((i) => i.id === id);
    if (instructorIndex === -1) {
      return c.json({ error: "Instructor not found" }, 404);
    }
    const updatedInstructor = {
      ...instructors[instructorIndex],
      ...body.name !== void 0 && { name: body.name },
      ...body.expertise !== void 0 && { expertise: body.expertise },
      ...body.experience !== void 0 && { experience: Number(body.experience) }
    };
    console.log("Updating instructor:", updatedInstructor);
    return c.json(updatedInstructor, 200);
  } catch (err) {
    console.error(`Error updating instructor ${id}:`, err);
    return c.json({
      error: "Failed to update instructor",
      code: "INSTRUCTOR_UPDATE_ERROR",
      details: String(err?.message || err)
    }, 500);
  }
});
app.delete("/api/instructors/:id", async (c) => {
  const env = c.env;
  const id = c.req.param("id");
  try {
    const instructors = await fetchInstructors(env);
    const instructor = instructors.find((i) => i.id === id);
    if (!instructor) {
      return c.json({ error: "Instructor not found" }, 404);
    }
    console.log("Deleting instructor:", id);
    return c.json({
      message: "Instructor deleted successfully",
      id
    }, 200);
  } catch (err) {
    console.error(`Error deleting instructor ${id}:`, err);
    return c.json({
      error: "Failed to delete instructor",
      code: "INSTRUCTOR_DELETE_ERROR",
      details: String(err?.message || err)
    }, 500);
  }
});
var src_default = app;

// ../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-7fdv55/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-7fdv55/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map

(function (root, factory) {
  if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(function() {
      return (root.corsRequest = factory());
    });
  } else {
    // Global variable
    root.corsRequest = factory();
  }
}(this, function() {

  // Determine the underlying implementation to be used.
  var useXhr = 'withCredentials' in new XMLHttpRequest();
  var useXdr = !useXhr && typeof XDomainRequest !== 'undefined';
  var Request;
  if (useXhr) {
    Request = XMLHttpRequest;
  } else if (useXdr) {
    Request = XDomainRequest;
  } else {
    throw new Error('corsRequest requires either XMLHttpRequest2 or XDomainRequest');
  }


  // A function that does nothing.
  var noop = function() {};


  // Return a function that only calls fn once.
  function once(fn) {
    var called = false;
    return function() {
      if (!called) {
        called = true;
        return fn.apply(null, arguments);
      }
    };
  }


  // Curry fn on the remaining arguments.
  function curry(fn) {
    var curriedArgs = [].slice.call(arguments, 1);
    return function() {
      var remainingArgs = [].slice.call(arguments);
      return fn.apply(null, curriedArgs.concat(remainingArgs));
    };
  }


  // Encode object as JSON, returning undefined if unsuccessful.
  function toJSON(obj) {
    try {
      return JSON.stringify(obj, null, 0);
    } catch (e) {
      return;
    }
  }


  // Parse string as JSON, returning undefined if unsuccessful.
  function fromJSON(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return;
    }
  }


  // Return whether o is a non-null object.
  function isObject(obj) {
    return typeof obj === 'object' && obj !== null;
  }


  // Encode data to JSON representation or string, according to its type.
  function encode(data) {
    if (isObject(data)) {
      return toJSON(data);
    } else {
      return data.toString();
    }
  }


  // Perform and store state for an HTTP request.
  function CorsRequest(method, url, data, done) {

    var self = this;

    done = once(done);

    function error(msg) {
      return new Error('corsRequest: ' + method + ' ' + url + ': ' + msg);
    }

    this.method = method;
    this.url = url;
    this.data = data;

    this.req = new Request();

    this.req.open(this.method, this.url);

    this.req.onerror = function() {
      self.err = error('error');
      done(self.err);
    };

    this.req.onload = function() {
      if (useXhr && self.req.readyState !== 4) {
        // XMLHttpRequest not yet complete.
        return;
      }
      if (useXhr && self.req.status === 0) {
        // XMLHttpRequest aborted, e.g. CORS error or connection reset.
        self.err = error('incomplete');
        done(self.err);
        return;
      }
      // Request complete.
      self.err = null;
      self.res = {
        status: useXhr ? self.req.status : 200,
        text: self.req.responseText,
        json: fromJSON(self.req.responseText)
      };
      done(self.err, self.res);
    };

    // Setting all handlers seems to increase the probability
    // of the request being sucessful on old IE versions.
    if (useXdr) {
      this.req.ontimeout = noop;
      this.req.onprogress = noop;
    }

    this.abort = function() {
      if (self.err === void 0) {
        self.req.abort();
        self.err = error('aborted');
        done(self.err);
      }
    };

    if (this.data !== void 0) {
      var payload = encode(data);
    }

    // Calling send() right away sometimes causes the request
    // to fail on old IE versions.
    setTimeout(function() {
      if (self.err === void 0) {
        self.req.send(payload || null);
      }
    }, 0);

    // Perform our own timeout logic instead of relying on
    // the underlying implementation.
    if (corsRequest.timeout > 0) {
      setTimeout(function() {
        if (self.err === void 0) {
          self.err = error('timeout');
          done(self.err);
        }
      }, corsRequest.timeout);
    }
  }


  // Instantiate CorsRequest with default arguments.
  function corsRequest() {

    var method, url, data, done;

    if (arguments.length < 2) {
      throw new Error('corsRequest: missing argument');
    }

    // corsRequest(method, url, ...)
    method = arguments[0].toUpperCase();
    url = arguments[1];

    if (method !== 'GET' && method !== 'POST') {
      throw new Error('corsRequest: bad method');
    }

    if (arguments.length === 3) {
      if (typeof arguments[2] === 'function') {
        // corsRequest(method, url, done)
        done = arguments[2];
      } else {
        // corsRequest(method, url, data)
        data = arguments[2];
      }
    }

    if (arguments.length > 3) {
      // corsRequest(method, url, data, done)
      data = arguments[2];
      done = arguments[3];
    }

    return new CorsRequest(method, url, data, done || noop);
  }


  // Default timeout value.
  corsRequest.timeout = 0;


  // Report implementation in use.
  corsRequest.usingXhr = useXhr;
  corsRequest.usingXdr = useXdr;


  // Utility functions for individual methods.
  corsRequest.get = curry(corsRequest, 'GET');
  corsRequest.post = curry(corsRequest, 'POST');


  // Export public interface.
  return corsRequest;

}));
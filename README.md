# corsRequest.js

A minimal, dependency-free, cross-browser CORS HTTP client.

Uses XMLHttpRequest2 with a fallback to XDomainRequest.

### corsRequest(method, url, [data], [done])
### corsRequest.get(url, [data], [done])
### corsRequest.post(url, [data], [done])

Performs an HTTP GET or POST request to the specified URL.

The *data* argument populates the request body. If it is an object, it is sent as JSON. If it is a string, it is sent as plain text. Otherwise, an empty request body is sent.

If supplied, the *done* callback must have signature (err, res). The request is unsuccessful if the browser reports an error or timeout. When the request is successful, the following are set:

 * *res.status*: the response status code (this is always 200 when XDomainRequest is used).
 * *res.text*: the raw response body.
 * *res.json*: the response body parsed as JSON, if it is valid JSON.

All functions return an object with properties *method*, *url*, *data* and *req* (the underlying request object). Properties *err* and *res* are set when the request completes. Call *abort()* on the object to abort the request.
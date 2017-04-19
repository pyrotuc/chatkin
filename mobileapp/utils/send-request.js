/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var flaverr = require('./flaverr');


/**
 * Module constants
 */

var DEFAULT_API_SERVER_BASE_URL = 'http://localhost:1337';




/**
 * sendRequest()
 *
 * @required {String} url
 * @required {String} method
 *
 * @optional {String} baseUrl
 * @optional {Ref} body
 *
 * @callback {Function}
 *           @param {Error?}
 *           @param {Dictionary} resInfo
 *                  @property {String?} body
 *                  @property {JSON?} data
 *                  @property {Number} statusCode
 *                  @property {Dictionary} headers
 */

module.exports = function sendRequest(options, done){

  if (_.isUndefined(options)) {
    options = {};
  }

  if (!_.isFunction(done)) { throw new Error('Valid node-style callback function must be provided as the 2nd argument!'); }
  if (!_.isObject(options)) { return done(new Error('`options` dictionary should be provided as the 1st argument!')); }


  if (_.isUndefined(options.baseUrl)) {
    options.baseUrl = DEFAULT_API_SERVER_BASE_URL;
  }
  if (_.isUndefined(options.headers)) {
    options.headers = {};
  }

  if (_.isUndefined(options.url)) { return done(new Error('`url` is required')); }
  if (_.isUndefined(options.method)) { return done(new Error('`method` is required')); }

  // Prepare body (if relevant)
  //  • if no body, this is just `undefined`
  //  • if body is string primitive, it does not get double-wrapped (e.g. 'foo' stays 'foo', not '"foo"')
  var serializedBodyMaybe;
  if (_.isUndefined(options.body)) {
    serializedBodyMaybe = undefined;
  }
  else if (_.isString(options.body)) {
    serializedBodyMaybe = options.body;
  }
  else {
    serializedBodyMaybe = JSON.stringify(options.body);
  }


  fetch(options.baseUrl + options.url, {
    method: options.method,
    headers: options.headers,
    body: serializedBodyMaybe
  })
  .then(function (res) {

    var resInfo = {
      statusCode: +res.status,
      headers: {},//TODO
      body: undefined//TODO
    };

    // We'll treat a non-2xx status code as an error, but we'll
    // give it a special error code so it's easily digested by
    // our friends up in userland.
    if(resInfo.status >= 300 || resInfo.status < 200) {
      try {
        return done(flaverr({
          code: 'E_NON_200_RESPONSE',
          body: resInfo.body,
          statusCode: resInfo.statusCode,
          headers: resInfo.headers,
        }, new Error(
          'Server responded with an error'+(_.isUndefined(resInfo.body) ? '.' : 'Server responded with an error: '+resInfo.body)
        )));
      } catch (e) {
        console.warn('Unhandled error was thrown in an asynchronous callback! (see error log)');
        console.error(e);
        return;
      }
    }//-•

    // Otherwise we'll consider it a success.

    // If there was no body, we're done.
    if (_.isUndefined(resInfo.body)) {
      try {
        return done(undefined, resInfo);
      } catch (e) {
        console.warn('Unhandled error was thrown in an asynchronous callback! (see error log)');
        console.error(e);
        return;
      }
    }//-•


    // But otherwise, we'll attempt to parse the raw response body as JSON.

    if (!_.isString(resInfo.body)) { return done(new Error('Consistency violation: Something fishy is going on.  If present, the raw response body should be a string at this point. But instead got: '+resInfo.body)); }

    var parsedResponseBody;
    try {
      parsedResponseBody = JSON.parse(resInfo.body);
    } catch (e) {
      // Note that this approach CAN NEVER correctly understand the situation where the server
      // sends back a string like `"foo"` in plain text.  It will always think it is `foo`, because
      // it will successfully JSON parse it.  Fortunately, this case almost never comes up.
      parsedResponseBody = resInfo.body;
    }

    resInfo.data = parsedResponseBody;

    try {
      return done(undefined, resInfo);
    } catch (e) {
      console.warn('Unhandled error was thrown in an asynchronous callback! (see error log)');
      console.error(e);
      return;
    }

  })//</then>
  .catch(function(err){
    try {
      return done(err);
    } catch (e) {
      console.warn('Unhandled error was thrown in an asynchronous callback! (see error log)');
      console.error(e);
      return;
    }
  });

};

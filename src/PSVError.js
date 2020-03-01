/**
 * @summary Custom error used in the lib
 * @param {string} message
 * @constructor
 * @memberOf PSV
 */
function PSVError(message) {
  this.message = message;

  // Use V8's native method if available, otherwise fallback
  if ('captureStackTrace' in Error) {
    Error.captureStackTrace(this, PSVError);
  }
  else {
    this.stack = (new Error()).stack;
  }
}

PSVError.prototype = Object.create(Error.prototype);
PSVError.prototype.name = 'PSVError';
PSVError.prototype.constructor = PSVError;

export { PSVError };

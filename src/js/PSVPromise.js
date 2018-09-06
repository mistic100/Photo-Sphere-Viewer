/**
 * Promise extension and helper
 * @param {Function} resolver
 * @constructor
 */
function PSVPromise(resolver) {

  var gResolve;

  var promise = new Promise(function(resolve, reject) {
    // Send args like normal promise
    resolver(resolution(resolve), resolution(reject));
  });

  function resolution(func) {
    return function(args) {
      promise.resolved = true;
      func(args);
    };
  }

  promise.resolved = false;

  return promise;
}

/**
 * Resolved promise helper
 */
PSVPromise.resolved = function(args) {
  var promise = PSVPromise(function(resolve, reject) {
    resolve(args);
  });

  promise.resolved = true;
  return promise;
};

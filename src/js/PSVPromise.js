/**
 * Promise extension and helper
 * @param {Function} resolver
 * @constructor
 */
function PSVPromise(resolver) {

  var self = this;

  var gResolve;

  self.innerpromise = new Promise(function(resolve, reject) {
    // Send args like normal promise
    gResolve = resolution(resolve);
    resolver(gResolve, resolution(reject));
  });

  self.cancel = function() {
    gResolve();
  };

  function resolution(func) {
    return function(args) {
      self.resolved = self.innerpromise.resolved = true;
      func(args);
    };
  }

  self.resolved = self.innerpromise.resolved = false;
}

PSVPromise.prototype = {

  then: function(onFulfilled) {

    var self = this;

    return new PSVPromise(function(res, rej) {

      self.innerpromise.then(res, rej);

    });

  },

  catch: function(onFulfilled, onRejected) {

    var self = this;

    return new PSVPromise(function(res, rej) {

      self.innerpromise.catch(res, rej);

    });

  },

  finally: function(onFulfilled, onRejected) {

    var self = this;

    return new PSVPromise(function(res, rej) {

      self.innerpromise.finally(res, rej);

    });

  },

};

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

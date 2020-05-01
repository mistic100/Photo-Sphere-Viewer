/**
 * @summary Returns deep equality between objects
 * {@link https://gist.github.com/egardner/efd34f270cc33db67c0246e837689cb9}
 * @param obj1
 * @param obj2
 * @return {boolean}
 * @private
 */
export function deepEqual(obj1, obj2) {
  if (obj1 === obj2) {
    return true;
  }
  else if (isObject(obj1) && isObject(obj2)) {
    if (Object.keys(obj1).length !== Object.keys(obj2).length) {
      return false;
    }
    for (const prop of Object.keys(obj1)) {
      if (!deepEqual(obj1[prop], obj2[prop])) {
        return false;
      }
    }
    return true;
  }
  else {
    return false;
  }
}

function isObject(obj) {
  return typeof obj === 'object' && obj != null;
}

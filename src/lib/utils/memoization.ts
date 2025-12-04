/**
 * A simple memoization function for expensive computations
 * @param fn The function to memoize
 * @returns A memoized version of the function
 */
export function memoize<T, R>(fn: (arg: T) => R): (arg: T) => R {
  const cache = new Map<T, R>();
  
  return (arg: T) => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }
    
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

/**
 * A memoization function for functions with multiple arguments
 * @param fn The function to memoize
 * @returns A memoized version of the function
 */
export function memoizeMultiArg<Args extends unknown[], R>(
  fn: (...args: Args) => R
): (...args: Args) => R {
  const cache = new Map<string, R>();
  
  return (...args: Args) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
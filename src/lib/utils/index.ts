export * from './date';
export * from './memoization';
export * from './error-handling';

// Add any additional utility functions here

/**
 * Safely access nested properties of an object
 * @param obj The object to access
 * @param path The path to the property, using dot notation
 * @param defaultValue The default value to return if the property doesn't exist
 * @returns The value at the specified path, or the default value if it doesn't exist
 */
export function get<T>(obj: unknown, path: string, defaultValue: T): T {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result === undefined || result === null) return defaultValue;
    if (typeof result !== 'object') return defaultValue;
    result = (result as Record<string, unknown>)[key];
  }

  return (result === undefined || result === null ? defaultValue : result) as T;
}

/**
 * Debounce a function to limit how often it can be called
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return function(...args: Parameters<T>): void {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function to limit how often it can be called
 * @param fn The function to throttle
 * @param limit The minimum time between calls in milliseconds
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function(...args: Parameters<T>): void {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

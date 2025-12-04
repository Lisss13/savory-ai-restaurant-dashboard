import { AxiosError } from 'axios';
import { toast } from 'sonner';

/**
 * Error types for better error handling
 */
export enum ErrorType {
  NETWORK = 'network',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  VALIDATION = 'validation',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

/**
 * Get the type of error from an Axios error
 * @param error The error to analyze
 * @returns The error type
 */
export function getErrorType(error: unknown): ErrorType {
  if (!(error instanceof AxiosError)) {
    return ErrorType.UNKNOWN;
  }

  if (!error.response) {
    return ErrorType.NETWORK;
  }

  const status = error.response.status;

  switch (status) {
    case 401:
      return ErrorType.UNAUTHORIZED;
    case 403:
      return ErrorType.FORBIDDEN;
    case 404:
      return ErrorType.NOT_FOUND;
    case 422:
      return ErrorType.VALIDATION;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorType.SERVER;
    default:
      return ErrorType.UNKNOWN;
  }
}

/**
 * Get a user-friendly error message from an error
 * @param error The error to analyze
 * @param fallbackMessage The fallback message to use if no specific message can be determined
 * @returns A user-friendly error message
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'An error occurred'): string {
  if (!(error instanceof AxiosError)) {
    return fallbackMessage;
  }

  // Try to get error message from response data
  const responseData = error.response?.data;
  if (responseData) {
    if (typeof responseData === 'string') {
      return responseData;
    }
    
    if (responseData.message) {
      return responseData.message;
    }
    
    if (responseData.error) {
      return responseData.error;
    }
    
    if (responseData.messages && Array.isArray(responseData.messages) && responseData.messages.length > 0) {
      return responseData.messages[0];
    }
  }

  // Fallback to status-based messages
  const errorType = getErrorType(error);
  switch (errorType) {
    case ErrorType.NETWORK:
      return 'Network error. Please check your connection.';
    case ErrorType.UNAUTHORIZED:
      return 'You are not authorized to perform this action.';
    case ErrorType.FORBIDDEN:
      return 'You do not have permission to perform this action.';
    case ErrorType.NOT_FOUND:
      return 'The requested resource was not found.';
    case ErrorType.VALIDATION:
      return 'Validation error. Please check your input.';
    case ErrorType.SERVER:
      return 'Server error. Please try again later.';
    default:
      return fallbackMessage;
  }
}

/**
 * Handle an error by showing a toast notification
 * @param error The error to handle
 * @param fallbackMessage The fallback message to use if no specific message can be determined
 */
export function handleError(error: unknown, fallbackMessage = 'An error occurred'): void {
  const message = getErrorMessage(error, fallbackMessage);
  toast.error(message);
}
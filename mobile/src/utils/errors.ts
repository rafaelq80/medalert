interface ApiErrorResponse {
  response?: {
    status?: number;
    data?: {
      detail?: string;
    };
  };
}

/**
 * Type guard for Axios-like API errors.
 * Eliminates unsafe `as` casts throughout the codebase.
 */
export function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  );
}

/**
 * Extracts a user-friendly error message from an API error.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  if (isApiError(error)) {
    return error.response?.data?.detail ?? fallback;
  }
  return fallback;
}

/**
 * Checks if the error is a specific HTTP status.
 */
export function isHttpStatus(error: unknown, status: number): boolean {
  return isApiError(error) && error.response?.status === status;
}

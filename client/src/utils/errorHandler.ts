export interface ApiError {
  response?: {
    data?: {
      message: string;
    };
  };
  message: string;
}

export const isApiError = (error: unknown): error is ApiError => {
  return typeof error === 'object' && error !== null && 'message' in error;
};

export const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (isApiError(error)) {
    return error.response?.data?.message || error.message || defaultMessage;
  }
  return defaultMessage;
};
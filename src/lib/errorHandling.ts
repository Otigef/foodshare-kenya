import { toast } from "@/hooks/use-toast";

// Error types for better error handling
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

// Error handler for Supabase errors
export const handleSupabaseError = (error: any): AppError => {
  console.error('Supabase error:', error);

  // Authentication errors
  if (error?.message?.includes('JWT') || error?.message?.includes('token')) {
    return {
      code: 'AUTH_ERROR',
      message: 'Authentication expired. Please log in again.',
      details: error
    };
  }

  // Permission errors
  if (error?.message?.includes('permission') || error?.code === '42501') {
    return {
      code: 'PERMISSION_ERROR',
      message: 'You do not have permission to perform this action.',
      details: error
    };
  }

  // Validation errors
  if (error?.code === '23505') {
    return {
      code: 'DUPLICATE_ERROR',
      message: 'This record already exists.',
      details: error
    };
  }

  if (error?.code === '23503') {
    return {
      code: 'REFERENCE_ERROR',
      message: 'Cannot perform this action due to related records.',
      details: error
    };
  }

  // Network errors
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection and try again.',
      details: error
    };
  }

  // Generic database errors
  if (error?.code) {
    return {
      code: 'DATABASE_ERROR',
      message: 'Database error occurred. Please try again.',
      details: error
    };
  }

  // Generic error
  return {
    code: 'UNKNOWN_ERROR',
    message: error?.message || 'An unexpected error occurred.',
    details: error
  };
};

// Show error toast with proper formatting
export const showErrorToast = (error: AppError | Error | any) => {
  let appError: AppError;

  if (error instanceof Error) {
    if (error instanceof ValidationError) {
      appError = {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: { field: error.field }
      };
    } else if (error instanceof AuthenticationError) {
      appError = {
        code: 'AUTH_ERROR',
        message: error.message
      };
    } else if (error instanceof AuthorizationError) {
      appError = {
        code: 'PERMISSION_ERROR',
        message: error.message
      };
    } else if (error instanceof NetworkError) {
      appError = {
        code: 'NETWORK_ERROR',
        message: error.message
      };
    } else {
      appError = handleSupabaseError(error);
    }
  } else {
    appError = handleSupabaseError(error);
  }

  toast({
    title: getErrorTitle(appError.code),
    description: appError.message,
    variant: "destructive",
  });

  return appError;
};

// Get user-friendly error titles
const getErrorTitle = (errorCode: string): string => {
  switch (errorCode) {
    case 'AUTH_ERROR':
      return 'Authentication Error';
    case 'PERMISSION_ERROR':
      return 'Permission Denied';
    case 'VALIDATION_ERROR':
      return 'Invalid Input';
    case 'DUPLICATE_ERROR':
      return 'Duplicate Entry';
    case 'REFERENCE_ERROR':
      return 'Related Records Exist';
    case 'NETWORK_ERROR':
      return 'Connection Problem';
    case 'DATABASE_ERROR':
      return 'Database Error';
    default:
      return 'Error';
  }
};

// Success toast helper
export const showSuccessToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "default",
  });
};

// Async error wrapper for better error handling
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorContext?: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    const appError = showErrorToast(error);
    
    // Log error for debugging
    console.error(`Error in ${errorContext || 'operation'}:`, appError);
    
    return null;
  }
};

// Retry logic for failed operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
};
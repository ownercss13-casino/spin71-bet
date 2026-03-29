// src/utils/errorHandler.ts

/**
 * Formats an error message to a readable string.
 * @param error - The error object.
 * @returns A formatted error message.
 */
function formatErrorMessage(error: any): string {
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unknown error occurred.';
}

/**
 * Logs the error to the console or a logging service.
 * @param error - The error object to log.
 */
function logError(error: any): void {
    console.error(formatErrorMessage(error));
    // Here you can add logic to send the error to a logging service.
}

/**
 * Handle an error and perform the necessary actions.
 * @param error - The error object to handle.
 */
function handleError(error: any): void {
    logError(error);
    // Additional error handling logic can go here, such as showing error messages to users.
}

export { formatErrorMessage, logError, handleError };
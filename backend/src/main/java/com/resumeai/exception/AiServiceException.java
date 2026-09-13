package com.resumeai.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when the upstream AI provider cannot fulfil a request (timeout, non-2xx
 * response, malformed output) even after the client's built-in retry attempts.
 * Mapped to 503 so the frontend can show a "try again in a moment" state rather
 * than treating it as a client error.
 */
public class AiServiceException extends ApiException {

    public AiServiceException(String message) {
        super(HttpStatus.SERVICE_UNAVAILABLE, message, "AI_SERVICE_UNAVAILABLE");
    }

    public AiServiceException(String message, Throwable cause) {
        super(HttpStatus.SERVICE_UNAVAILABLE, message, "AI_SERVICE_UNAVAILABLE");
        initCause(cause);
    }
}

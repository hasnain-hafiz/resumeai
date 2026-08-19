package com.resumeai.exception;

import org.springframework.http.HttpStatus;

/** Base class for all handled application exceptions. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String message) {
        this(status, message, null);
    }

    /**
     * @param code a stable, machine-readable identifier (e.g. "EMAIL_NOT_VERIFIED") the frontend
     *             can switch on. Prefer this over parsing the human-readable message, which is
     *             free to change wording (or be localized) without breaking client logic.
     */
    public ApiException(HttpStatus status, String message, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}

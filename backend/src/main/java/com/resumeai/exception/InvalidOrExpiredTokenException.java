package com.resumeai.exception;

import org.springframework.http.HttpStatus;

public class InvalidOrExpiredTokenException extends ApiException {
    public InvalidOrExpiredTokenException(String tokenType) {
        super(HttpStatus.BAD_REQUEST, "This " + tokenType + " token is invalid or has expired", "INVALID_OR_EXPIRED_TOKEN");
    }
}

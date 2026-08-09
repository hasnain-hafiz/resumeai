package com.resumeai.exception;

import org.springframework.http.HttpStatus;

public class EmailAlreadyInUseException extends ApiException {
    public EmailAlreadyInUseException(String email) {
        super(HttpStatus.CONFLICT, "An account with email '" + email + "' already exists");
    }
}

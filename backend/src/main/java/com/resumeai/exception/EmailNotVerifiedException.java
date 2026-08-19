package com.resumeai.exception;

import org.springframework.http.HttpStatus;

public class EmailNotVerifiedException extends ApiException {
    public EmailNotVerifiedException() {
        super(HttpStatus.FORBIDDEN, "Please verify your email address before logging in", "EMAIL_NOT_VERIFIED");
    }
}

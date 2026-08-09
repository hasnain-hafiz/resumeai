package com.resumeai.exception;

import org.springframework.http.HttpStatus;

public class AccountLockedException extends ApiException {
    public AccountLockedException() {
        super(HttpStatus.FORBIDDEN, "This account has been locked due to too many failed login attempts. Please reset your password.");
    }
}

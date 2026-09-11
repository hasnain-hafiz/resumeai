package com.resumeai.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a reorder request's id (or section key) list isn't an exact
 * permutation of the items it claims to reorder - e.g. missing an id,
 * duplicating one, or including one that doesn't belong to the resume.
 * Rejecting outright, rather than best-effort applying it, avoids silently
 * losing an item's place (or duplicating a sort_order) from a stale client.
 */
public class InvalidReorderException extends ApiException {
    public InvalidReorderException(String message) {
        super(HttpStatus.BAD_REQUEST, message, "INVALID_REORDER");
    }
}

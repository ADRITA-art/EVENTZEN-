package com.adrita.eventzen.exception;

// Thrown when trying to register with an already-used email
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
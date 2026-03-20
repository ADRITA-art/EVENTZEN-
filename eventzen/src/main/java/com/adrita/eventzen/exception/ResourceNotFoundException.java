package com.adrita.eventzen.exception;

// Thrown when a resource is not found (e.g. user by email)
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
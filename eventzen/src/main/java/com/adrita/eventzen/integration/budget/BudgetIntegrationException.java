package com.adrita.eventzen.integration.budget;

public class BudgetIntegrationException extends RuntimeException {

    public BudgetIntegrationException(String message) {
        super(message);
    }

    public BudgetIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}

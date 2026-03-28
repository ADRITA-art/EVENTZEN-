package com.adrita.eventzen.controller;

import com.adrita.eventzen.integration.budget.BudgetClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class ReadinessController {

    private final BudgetClient budgetClient;

    public ReadinessController(BudgetClient budgetClient) {
        this.budgetClient = budgetClient;
    }

    @GetMapping("/readiness")
    public ResponseEntity<Map<String, String>> readiness() {
        boolean budgetServiceUp = budgetClient.isBudgetServiceReachable();
        HttpStatus status = budgetServiceUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

        return ResponseEntity.status(status).body(Map.of(
                "status", budgetServiceUp ? "UP" : "DOWN",
                "budgetService", budgetServiceUp ? "UP" : "DOWN"
        ));
    }
}

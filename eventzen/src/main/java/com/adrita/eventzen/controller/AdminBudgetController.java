package com.adrita.eventzen.controller;

import com.adrita.eventzen.dto.BudgetSetRequest;
import com.adrita.eventzen.dto.ExpenseCreateRequest;
import com.adrita.eventzen.integration.budget.BudgetClient;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/budget")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBudgetController {

    private final BudgetClient budgetClient;

    public AdminBudgetController(BudgetClient budgetClient) {
        this.budgetClient = budgetClient;
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<Map<String, Object>> getBudgetByEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(budgetClient.getBudgetByEventId(eventId));
    }

    @PostMapping("/set")
    public ResponseEntity<Void> setBudget(@Valid @RequestBody BudgetSetRequest request) {
        budgetClient.setTotalBudget(request.getEventId(), request.getTotalBudget());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/expense/event/{eventId}")
    public ResponseEntity<List<Map<String, Object>>> getExpensesByEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(budgetClient.getExpensesByEventId(eventId));
    }

    @PostMapping("/expense")
    public ResponseEntity<Map<String, Object>> addExpense(@Valid @RequestBody ExpenseCreateRequest request) {
        String category = (request.getCategory() == null || request.getCategory().trim().isEmpty())
                ? "General"
                : request.getCategory().trim();

        Map<String, Object> payload = Map.of(
                "eventId", request.getEventId(),
                "amount", request.getAmount(),
                "description", request.getDescription(),
                "category", category
        );

        return ResponseEntity.ok(budgetClient.addExpense(payload));
    }

    @DeleteMapping("/expense/{id}")
    public ResponseEntity<Map<String, Object>> deleteExpense(@PathVariable Long id) {
        return ResponseEntity.ok(budgetClient.deleteExpense(id));
    }
}

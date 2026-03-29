package com.adrita.eventzen.controller;

import com.adrita.eventzen.dto.BudgetSetRequest;
import com.adrita.eventzen.dto.ExpenseCreateRequest;
import com.adrita.eventzen.integration.budget.BudgetClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminBudgetControllerTest {

    @Mock
    private BudgetClient budgetClient;

    @InjectMocks
    private AdminBudgetController controller;

    private BudgetSetRequest budgetSetRequest;
    private ExpenseCreateRequest expenseCreateRequest;

    @BeforeEach
    void setUp() {
        budgetSetRequest = new BudgetSetRequest();
        budgetSetRequest.setEventId(10L);
        budgetSetRequest.setTotalBudget(new BigDecimal("5000.00"));

        expenseCreateRequest = new ExpenseCreateRequest();
        expenseCreateRequest.setEventId(10L);
        expenseCreateRequest.setAmount(new BigDecimal("250.00"));
        expenseCreateRequest.setDescription("Sound setup");
    }

    @Test
    void getBudgetByEventShouldReturnClientPayload() {
        Map<String, Object> payload = Map.of("eventId", 10L, "estimatedCost", "1000.00");
        when(budgetClient.getBudgetByEventId(10L)).thenReturn(payload);

        ResponseEntity<Map<String, Object>> response = controller.getBudgetByEvent(10L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(payload);
        verify(budgetClient).getBudgetByEventId(10L);
    }

    @Test
    void setBudgetShouldDelegateAndReturnOk() {
        ResponseEntity<Void> response = controller.setBudget(budgetSetRequest);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(budgetClient).setTotalBudget(10L, new BigDecimal("5000.00"));
    }

    @Test
    void getExpensesByEventShouldReturnClientPayload() {
        List<Map<String, Object>> payload = List.of(Map.of("id", 1L, "amount", "25.00"));
        when(budgetClient.getExpensesByEventId(10L)).thenReturn(payload);

        ResponseEntity<List<Map<String, Object>>> response = controller.getExpensesByEvent(10L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(payload);
        verify(budgetClient).getExpensesByEventId(10L);
    }

    @Test
    void addExpenseShouldUseGeneralCategoryWhenMissingOrBlank() {
        expenseCreateRequest.setCategory("   ");
        when(budgetClient.addExpense(org.mockito.ArgumentMatchers.anyMap()))
                .thenReturn(Map.of("id", 99L));

        ResponseEntity<Map<String, Object>> response = controller.addExpense(expenseCreateRequest);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).containsEntry("id", 99L);
        verify(budgetClient).addExpense(Map.of(
                "eventId", 10L,
                "amount", new BigDecimal("250.00"),
                "description", "Sound setup",
                "category", "General"
        ));
    }

    @Test
    void addExpenseShouldTrimProvidedCategory() {
        expenseCreateRequest.setCategory("  Catering  ");
        when(budgetClient.addExpense(org.mockito.ArgumentMatchers.anyMap()))
                .thenReturn(Map.of("id", 100L));

        ResponseEntity<Map<String, Object>> response = controller.addExpense(expenseCreateRequest);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(budgetClient).addExpense(Map.of(
                "eventId", 10L,
                "amount", new BigDecimal("250.00"),
                "description", "Sound setup",
                "category", "Catering"
        ));
    }

    @Test
    void deleteExpenseShouldReturnClientPayload() {
        Map<String, Object> payload = Map.of("message", "Expense deleted successfully");
        when(budgetClient.deleteExpense(7L)).thenReturn(payload);

        ResponseEntity<Map<String, Object>> response = controller.deleteExpense(7L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(payload);
        verify(budgetClient).deleteExpense(7L);
    }
}

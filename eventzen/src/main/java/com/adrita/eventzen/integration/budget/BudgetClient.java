package com.adrita.eventzen.integration.budget;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@Component
public class BudgetClient {

    private final RestClient restClient;
    private final String internalServiceAuthHeader;

    public BudgetClient(RestClient.Builder restClientBuilder,
                        @Value("${budget.service.base-url}") String budgetServiceBaseUrl,
                        @Value("${budget.service.internal-key}") String internalServiceKey) {
        this.restClient = restClientBuilder
                .baseUrl(budgetServiceBaseUrl)
                .build();
        this.internalServiceAuthHeader = "Internal-Service-Key " + internalServiceKey;
    }

    public void upsertEstimatedCostForEvent(Long eventId, BigDecimal estimatedCost) {
        BudgetRequest payload = new BudgetRequest(
                eventId,
                normalize(estimatedCost),
                null,
                null
        );

        try {
            restClient.post()
                    .uri("/api/budget/estimate")
                    .header(HttpHeaders.AUTHORIZATION, internalServiceAuthHeader)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            throw new BudgetIntegrationException("Failed to upsert estimated cost for event " + eventId, ex);
        } catch (ResourceAccessException ex) {
            throw new BudgetIntegrationException("Budget service is not reachable while syncing estimated cost", ex);
        }
    }

    public void setTotalBudget(Long eventId, BigDecimal totalBudget) {
        BudgetRequest payload = new BudgetRequest(
                eventId,
                null,
                normalize(totalBudget),
                null
        );

        try {
            restClient.post()
                    .uri("/api/budget/set")
                    .header(HttpHeaders.AUTHORIZATION, internalServiceAuthHeader)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            throw new BudgetIntegrationException("Failed to set total budget for event " + eventId, ex);
        } catch (ResourceAccessException ex) {
            throw new BudgetIntegrationException("Budget service is not reachable while setting total budget", ex);
        }
    }

    public void syncRevenueForEvent(Long eventId, BigDecimal revenue) {
        BudgetRequest payload = new BudgetRequest(
                eventId,
                null,
                null,
                normalize(revenue)
        );

        try {
            restClient.put()
                    .uri("/api/budget/revenue/{eventId}", eventId)
                    .header(HttpHeaders.AUTHORIZATION, internalServiceAuthHeader)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            throw new BudgetIntegrationException("Failed to sync revenue for event " + eventId, ex);
        } catch (ResourceAccessException ex) {
            throw new BudgetIntegrationException("Budget service is not reachable while syncing revenue", ex);
        }
    }

    public Map<String, Object> getBudgetByEventId(Long eventId) {
        try {
            return restClient.get()
                    .uri("/api/budget/{eventId}", eventId)
                    .header(HttpHeaders.AUTHORIZATION, internalServiceAuthHeader)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException ex) {
            throw new BudgetIntegrationException("Failed to fetch budget for event " + eventId, ex);
        } catch (ResourceAccessException ex) {
            throw new BudgetIntegrationException("Budget service is not reachable while fetching budget", ex);
        }
    }

    public List<Map<String, Object>> getExpensesByEventId(Long eventId) {
        try {
            return restClient.get()
                    .uri("/api/expense/event/{eventId}", eventId)
                    .header(HttpHeaders.AUTHORIZATION, internalServiceAuthHeader)
                    .retrieve()
                    .body(List.class);
        } catch (RestClientResponseException ex) {
            throw new BudgetIntegrationException("Failed to fetch expenses for event " + eventId, ex);
        } catch (ResourceAccessException ex) {
            throw new BudgetIntegrationException("Budget service is not reachable while fetching expenses", ex);
        }
    }

    public Map<String, Object> addExpense(Map<String, Object> payload) {
        try {
            return restClient.post()
                    .uri("/api/expense")
                    .header(HttpHeaders.AUTHORIZATION, internalServiceAuthHeader)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException ex) {
            throw new BudgetIntegrationException("Failed to add expense", ex);
        } catch (ResourceAccessException ex) {
            throw new BudgetIntegrationException("Budget service is not reachable while adding expense", ex);
        }
    }

    public Map<String, Object> deleteExpense(Long expenseId) {
        try {
            return restClient.delete()
                    .uri("/api/expense/{id}", expenseId)
                    .header(HttpHeaders.AUTHORIZATION, internalServiceAuthHeader)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException ex) {
            throw new BudgetIntegrationException("Failed to delete expense " + expenseId, ex);
        } catch (ResourceAccessException ex) {
            throw new BudgetIntegrationException("Budget service is not reachable while deleting expense", ex);
        }
    }

    public boolean isBudgetServiceReachable() {
        try {
            Map<?, ?> response = restClient.get()
                    .uri("/health")
                    .retrieve()
                    .body(Map.class);

            return response != null && "ok".equalsIgnoreCase(String.valueOf(response.get("status")));
        } catch (Exception ex) {
            return false;
        }
    }

    private BigDecimal normalize(BigDecimal value) {
        BigDecimal normalized = value == null ? BigDecimal.ZERO : value;
        return normalized.setScale(2, RoundingMode.HALF_UP);
    }
}

package com.adrita.eventzen.integration.budget;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Component
public class BudgetClient {

    private final RestClient restClient;

    public BudgetClient(RestClient.Builder restClientBuilder,
                        @Value("${budget.service.base-url}") String budgetServiceBaseUrl) {
        this.restClient = restClientBuilder
                .baseUrl(budgetServiceBaseUrl)
                .build();
    }

    public void createBudgetForEvent(Long eventId, BigDecimal totalBudget) {
        BudgetRequest payload = new BudgetRequest(eventId, normalize(totalBudget));

        try {
            restClient.post()
                    .uri("/api/budget")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode() == HttpStatus.CONFLICT) {
                return;
            }
            throw new BudgetIntegrationException("Failed to create budget for event " + eventId, ex);
        } catch (ResourceAccessException ex) {
            throw new BudgetIntegrationException("Budget service is not reachable while creating budget", ex);
        }
    }

    public void updateBudgetForEvent(Long eventId, BigDecimal totalBudget) {
        BudgetRequest payload = new BudgetRequest(eventId, normalize(totalBudget));

        try {
            restClient.put()
                    .uri("/api/budget/{eventId}", eventId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                createBudgetForEvent(eventId, totalBudget);
                return;
            }
            throw new BudgetIntegrationException("Failed to update budget for event " + eventId, ex);
        } catch (ResourceAccessException ex) {
            throw new BudgetIntegrationException("Budget service is not reachable while updating budget", ex);
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

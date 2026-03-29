package com.adrita.eventzen.integration.budget;

import okhttp3.mockwebserver.Dispatcher;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BudgetClientTest {

    private static final MockWebServer SERVER = new MockWebServer();
    private static volatile int statusForMutations = 200;
    private static volatile int statusForReads = 200;

    private BudgetClient budgetClient;

    @BeforeAll
    static void beforeAll() throws Exception {
        SERVER.setDispatcher(new Dispatcher() {
            @Override
            public MockResponse dispatch(RecordedRequest request) {
                String path = request.getPath();
                String auth = request.getHeader("Authorization");

                if (!"Internal-Service-Key client-key".equals(auth) && path != null && path.startsWith("/api/")) {
                    return new MockResponse().setResponseCode(401);
                }

                if ("/health".equals(path)) {
                    return json(200, "{\"status\":\"ok\"}");
                }

                if ("POST".equals(request.getMethod()) && "/api/budget/estimate".equals(path)) {
                    return statusForMutations == 200
                            ? json(200, "{}")
                            : new MockResponse().setResponseCode(statusForMutations);
                }

                if ("POST".equals(request.getMethod()) && "/api/budget/set".equals(path)) {
                    return statusForMutations == 200
                            ? json(200, "{}")
                            : new MockResponse().setResponseCode(statusForMutations);
                }

                if ("PUT".equals(request.getMethod()) && path != null && path.startsWith("/api/budget/revenue/")) {
                    return statusForMutations == 200
                            ? json(200, "{}")
                            : new MockResponse().setResponseCode(statusForMutations);
                }

                if ("GET".equals(request.getMethod()) && path != null && path.startsWith("/api/budget/")) {
                    return statusForReads == 200
                            ? json(200, "{\"eventId\":1,\"profit\":\"10.00\"}")
                            : new MockResponse().setResponseCode(statusForReads);
                }

                if ("GET".equals(request.getMethod()) && path != null && path.startsWith("/api/expense/event/")) {
                    return statusForReads == 200
                            ? json(200, "[{\"id\":11,\"amount\":\"20.00\"}]")
                            : new MockResponse().setResponseCode(statusForReads);
                }

                if ("POST".equals(request.getMethod()) && "/api/expense".equals(path)) {
                    return statusForMutations == 200
                            ? json(200, "{\"id\":55}")
                            : new MockResponse().setResponseCode(statusForMutations);
                }

                if ("DELETE".equals(request.getMethod()) && path != null && path.startsWith("/api/expense/")) {
                    return statusForMutations == 200
                            ? json(200, "{\"message\":\"deleted\"}")
                            : new MockResponse().setResponseCode(statusForMutations);
                }

                return new MockResponse().setResponseCode(404);
            }

            private MockResponse json(int status, String body) {
                return new MockResponse()
                        .setResponseCode(status)
                        .addHeader("Content-Type", "application/json")
                        .setBody(body);
            }
        });
        SERVER.start();
    }

    @AfterAll
    static void afterAll() throws Exception {
        SERVER.shutdown();
    }

    @BeforeEach
    void setUp() {
        statusForMutations = 200;
        statusForReads = 200;
        budgetClient = new BudgetClient(
                RestClient.builder(),
                SERVER.url("/").toString(),
                "client-key"
        );
    }

    @Test
    void upsertEstimatedCostForEventShouldCallBudgetApi() {
        budgetClient.upsertEstimatedCostForEvent(1L, new BigDecimal("123.456"));

        assertThat(SERVER.getRequestCount()).isGreaterThan(0);
    }

    @Test
    void setTotalBudgetShouldCallBudgetApi() {
        budgetClient.setTotalBudget(2L, new BigDecimal("5000"));

        assertThat(SERVER.getRequestCount()).isGreaterThan(0);
    }

    @Test
    void syncRevenueForEventShouldCallBudgetApi() {
        budgetClient.syncRevenueForEvent(3L, new BigDecimal("99.999"));

        assertThat(SERVER.getRequestCount()).isGreaterThan(0);
    }

    @Test
    void getBudgetByEventIdShouldReturnMap() {
        Map<String, Object> response = budgetClient.getBudgetByEventId(1L);

        assertThat(response).containsEntry("eventId", 1);
    }

    @Test
    void getExpensesByEventIdShouldReturnList() {
        List<Map<String, Object>> response = budgetClient.getExpensesByEventId(1L);

        assertThat(response).hasSize(1);
        assertThat(response.get(0)).containsEntry("id", 11);
    }

    @Test
    void addExpenseShouldReturnCreatedExpense() {
        Map<String, Object> response = budgetClient.addExpense(Map.of("eventId", 1L, "amount", 10));

        assertThat(response).containsEntry("id", 55);
    }

    @Test
    void deleteExpenseShouldReturnResult() {
        Map<String, Object> response = budgetClient.deleteExpense(55L);

        assertThat(response).containsEntry("message", "deleted");
    }

    @Test
    void isBudgetServiceReachableShouldReturnTrueWhenHealthIsOk() {
        assertThat(budgetClient.isBudgetServiceReachable()).isTrue();
    }

    @Test
    void methodsShouldWrapRemote4xxOr5xxAsBudgetIntegrationException() {
        statusForMutations = 503;

        assertThatThrownBy(() -> budgetClient.setTotalBudget(2L, new BigDecimal("5000")))
                .isInstanceOf(BudgetIntegrationException.class)
                .hasMessageContaining("Failed to set total budget for event 2");
    }

    @Test
    void methodsShouldWrapUnreachableServiceAsBudgetIntegrationException() {
        BudgetClient unreachableClient = new BudgetClient(
                RestClient.builder(),
                "http://127.0.0.1:1",
                "client-key"
        );

        assertThatThrownBy(() -> unreachableClient.addExpense(Map.of("eventId", 1)))
                .isInstanceOf(BudgetIntegrationException.class)
                .hasMessageContaining("Budget service is not reachable while adding expense");
    }
}

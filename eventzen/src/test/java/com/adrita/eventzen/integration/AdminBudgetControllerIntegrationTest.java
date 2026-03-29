package com.adrita.eventzen.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.mockwebserver.Dispatcher;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminBudgetControllerIntegrationTest {

    private static final MockWebServer BUDGET_SERVER = new MockWebServer();
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String INTERNAL_KEY = "test-internal-key";
    private static final AtomicReference<Map<String, Object>> LAST_EXPENSE_PAYLOAD = new AtomicReference<>();

    @Autowired
    private MockMvc mockMvc;

    @BeforeAll
    static void beforeAll() throws Exception {
        BUDGET_SERVER.setDispatcher(new Dispatcher() {
            @Override
            public MockResponse dispatch(RecordedRequest request) {
                try {
                    String path = request.getPath();

                    if (path != null && path.startsWith("/api/")) {
                        String authHeader = request.getHeader("Authorization");
                        if (!("Internal-Service-Key " + INTERNAL_KEY).equals(authHeader)) {
                            return new MockResponse().setResponseCode(401);
                        }
                    }

                    if ("GET".equals(request.getMethod()) && path != null && path.startsWith("/api/budget/")) {
                        return jsonResponse(200, Map.of("eventId", 15, "profit", "50.00"));
                    }

                    if ("POST".equals(request.getMethod()) && "/api/budget/set".equals(path)) {
                        return jsonResponse(200, Map.of());
                    }

                    if ("GET".equals(request.getMethod()) && path != null && path.startsWith("/api/expense/event/")) {
                        return jsonResponse(200, java.util.List.of(Map.of("id", 1, "amount", "20.00")));
                    }

                    if ("POST".equals(request.getMethod()) && "/api/expense".equals(path)) {
                        LAST_EXPENSE_PAYLOAD.set(MAPPER.readValue(request.getBody().readUtf8(), Map.class));
                        return jsonResponse(200, Map.of("id", 999, "message", "created"));
                    }

                    if ("DELETE".equals(request.getMethod()) && path != null && path.startsWith("/api/expense/")) {
                        return jsonResponse(200, Map.of("message", "Expense deleted successfully"));
                    }

                    return new MockResponse().setResponseCode(404);
                } catch (Exception ex) {
                    return new MockResponse().setResponseCode(500).setBody(ex.getMessage());
                }
            }

            private MockResponse jsonResponse(int statusCode, Object body) throws Exception {
                return new MockResponse()
                        .setResponseCode(statusCode)
                        .addHeader("Content-Type", "application/json")
                        .setBody(MAPPER.writeValueAsString(body));
            }
        });

        BUDGET_SERVER.start();
    }

    @AfterAll
    static void afterAll() throws Exception {
        BUDGET_SERVER.shutdown();
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:h2:mem:eventzen-budget-admin;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE");
        registry.add("spring.datasource.driverClassName", () -> "org.h2.Driver");
        registry.add("spring.datasource.username", () -> "sa");
        registry.add("spring.datasource.password", () -> "");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.sql.init.mode", () -> "never");
        registry.add("jwt.secret", () -> "test-secret-key-for-admin-budget-integration");
        registry.add("jwt.expiration", () -> "86400000");
        registry.add("app.cors.allowed-origins", () -> "http://localhost:3000");
        registry.add("budget.service.base-url", () -> BUDGET_SERVER.url("/").toString());
        registry.add("budget.service.internal-key", () -> INTERNAL_KEY);
    }

    @BeforeEach
    void setUp() {
        LAST_EXPENSE_PAYLOAD.set(null);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getBudgetByEventShouldReturnBudgetPayload() throws Exception {
        mockMvc.perform(get("/admin/budget/event/15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eventId").value(15))
                .andExpect(jsonPath("$.profit").value("50.00"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void setBudgetShouldReturnOk() throws Exception {
        String body = """
                {
                  "eventId": 15,
                  "totalBudget": 15000.00
                }
                """;

        mockMvc.perform(post("/admin/budget/set")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getExpensesByEventShouldReturnExpenseList() throws Exception {
        mockMvc.perform(get("/admin/budget/expense/event/15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void addExpenseShouldDefaultCategoryToGeneralWhenBlank() throws Exception {
        String body = """
                {
                  "eventId": 15,
                  "amount": 250.00,
                  "description": "Lighting",
                  "category": "  "
                }
                """;

        mockMvc.perform(post("/admin/budget/expense")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(999));

        assertThat(LAST_EXPENSE_PAYLOAD.get()).isNotNull();
        assertThat(LAST_EXPENSE_PAYLOAD.get().get("category")).isEqualTo("General");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteExpenseShouldReturnResult() throws Exception {
        mockMvc.perform(delete("/admin/budget/expense/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Expense deleted successfully"));
    }
}

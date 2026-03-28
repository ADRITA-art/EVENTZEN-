package com.adrita.eventzen.integration;

import com.adrita.eventzen.entity.Venue;
import com.adrita.eventzen.entity.VenueType;
import com.adrita.eventzen.repository.VenueRepository;
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

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class EventBudgetIntegrationTest {

    private static final MockWebServer BUDGET_SERVER = new MockWebServer();
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Map<Long, BigDecimal> BUDGETS = new ConcurrentHashMap<>();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private VenueRepository venueRepository;

    @BeforeAll
    static void beforeAll() throws Exception {
        BUDGET_SERVER.setDispatcher(new Dispatcher() {
            @Override
            public MockResponse dispatch(RecordedRequest request) {
                try {
                    String path = request.getPath();

                    if ("GET".equals(request.getMethod()) && "/health".equals(path)) {
                        return jsonResponse(200, Map.of("status", "ok"));
                    }

                    if ("POST".equals(request.getMethod()) && "/api/budget".equals(path)) {
                        Map<String, Object> payload = MAPPER.readValue(request.getBody().readUtf8(), Map.class);
                        Long eventId = Long.valueOf(String.valueOf(payload.get("eventId")));
                        BigDecimal totalBudget = new BigDecimal(String.valueOf(payload.get("totalBudget")));
                        BUDGETS.put(eventId, totalBudget);
                        return jsonResponse(201, Map.of("eventId", eventId, "totalBudget", totalBudget));
                    }

                    if ("PUT".equals(request.getMethod()) && path != null && path.startsWith("/api/budget/")) {
                        Long eventId = Long.valueOf(path.substring("/api/budget/".length()));
                        if (!BUDGETS.containsKey(eventId)) {
                            return new MockResponse().setResponseCode(404);
                        }
                        Map<String, Object> payload = MAPPER.readValue(request.getBody().readUtf8(), Map.class);
                        BigDecimal totalBudget = new BigDecimal(String.valueOf(payload.get("totalBudget")));
                        BUDGETS.put(eventId, totalBudget);
                        return jsonResponse(200, Map.of("eventId", eventId, "totalBudget", totalBudget));
                    }

                    if ("GET".equals(request.getMethod()) && path != null && path.startsWith("/api/budget/")) {
                        Long eventId = Long.valueOf(path.substring("/api/budget/".length()));
                        BigDecimal totalBudget = BUDGETS.get(eventId);
                        if (totalBudget == null) {
                            return new MockResponse().setResponseCode(404);
                        }
                        return jsonResponse(200, Map.of(
                                "eventId", eventId,
                                "totalBudget", totalBudget,
                                "actualCost", BigDecimal.ZERO,
                                "remaining", totalBudget
                        ));
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
        registry.add("spring.datasource.url", () -> "jdbc:h2:mem:eventzen;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE");
        registry.add("spring.datasource.driverClassName", () -> "org.h2.Driver");
        registry.add("spring.datasource.username", () -> "sa");
        registry.add("spring.datasource.password", () -> "");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.sql.init.mode", () -> "never");
        registry.add("jwt.secret", () -> "test-secret-key-for-integration-tests-very-long");
        registry.add("jwt.expiration", () -> "86400000");
        registry.add("app.cors.allowed-origins", () -> "http://localhost:3000");
        registry.add("budget.service.base-url", () -> BUDGET_SERVER.url("/").toString());
    }

    @BeforeEach
    void setUp() {
        venueRepository.deleteAll();
        BUDGETS.clear();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createEventShouldCreateBudgetInBudgetService() throws Exception {
        Venue venue = new Venue();
        venue.setName("Grand Hall");
        venue.setState("Karnataka");
        venue.setCity("Bengaluru");
        venue.setCountry("India");
        venue.setType(VenueType.HALL);
        venue.setCapacity(500);
        venue.setPricePerHour(new BigDecimal("2500.00"));
        Venue savedVenue = venueRepository.save(venue);

        String body = """
                {
                  \"name\": \"Tech Fest\",
                  \"description\": \"Annual event\",
                  \"eventDate\": \"2026-08-20\",
                  \"startTime\": \"10:00:00\",
                  \"endTime\": \"14:00:00\",
                  \"venueId\": %d,
                  \"ticketPrice\": 1500.00,
                  \"maxCapacity\": 450
                }
                """.formatted(savedVenue.getId());

        String response = mockMvc.perform(post("/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long eventId = MAPPER.readTree(response).get("id").asLong();

        mockMvc.perform(get("/readiness"))
                .andExpect(status().isOk());

        BigDecimal budgetValue = BUDGETS.get(eventId);
        assertThat(budgetValue).isNotNull();
        assertThat(budgetValue).isEqualByComparingTo(new BigDecimal("10000.00"));
    }
}

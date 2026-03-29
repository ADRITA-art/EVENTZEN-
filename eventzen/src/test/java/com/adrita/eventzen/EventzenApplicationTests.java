package com.adrita.eventzen;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:h2:mem:eventzen-context;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
		"spring.datasource.driverClassName=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.sql.init.mode=never",
		"jwt.secret=test-secret-key-for-context-load",
		"jwt.expiration=86400000",
		"app.cors.allowed-origins=http://localhost:3000",
		"budget.service.base-url=http://localhost:4001",
		"budget.service.internal-key=test-key"
})
class EventzenApplicationTests {

	@Test
	void contextLoads() {
	}

}

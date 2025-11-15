package com.backend.hackathon;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class PingControllerTest {
    @Autowired
    TestRestTemplate template;

    @Test
    void shouldReturnPongWithAuthorization() {
        // Создаем заголовки
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "tma auth_date=1760727536&hash=some-hash&signature=some-signature&user=%7B%22id%22%3A1%2C%22first_name%22%3A%22Vladislav%22%7D");

        // Создаем HttpEntity с заголовками
        HttpEntity<String> entity = new HttpEntity<>(headers);

        // Выполняем запрос
        ResponseEntity<String> response = template.exchange(
                "/api/ping",
                HttpMethod.GET,
                entity,
                String.class
        );

        assertEquals("pong", response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}

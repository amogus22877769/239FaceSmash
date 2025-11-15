package com.backend.hackathon.TGBot;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Data
public class BotConfig {
    @Value("${botname}")
    private String botName;
    @Value("${token}")
    private String token;

    // set token and botname in application.properties
    // remember NOT TO RUN several backends with same tokens and botnames!!!!
}


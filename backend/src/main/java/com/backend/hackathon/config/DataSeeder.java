package com.backend.hackathon.config;

import com.backend.hackathon.entity.Person;
import com.backend.hackathon.repositrory.PersonRepository;
import com.backend.hackathon.service.PhotoCompressionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final PersonRepository personRepository;
    private final PhotoCompressionService photoCompressionService;

    // Common Russian female name endings
    private static final List<String> FEMALE_ENDINGS = Arrays.asList(
            "а", "я", "ия", "ь", "на", "ва", "ова", "ева", "ина", "ына"
    );

    @Override
    public void run(String... args) throws Exception {
        // Check if database is already seeded
        if (personRepository.count() > 0) {
            log.info("Database already contains data. Assuming person.sql has been loaded. Skipping seed.");
            
            // Skip photo compression on startup for low-memory environments
            // Compression can be triggered manually via /api/compress-photos endpoint
            log.info("Photo compression skipped on startup. Use /api/compress-photos endpoint to compress manually if needed.");
            return;
        }

        // DataSeeder is disabled - we always use person.sql for real data
        // This class is kept for potential future use but doesn't seed pravatar photos
        log.info("Database is empty. person.sql should be loaded by db-init service. Skipping pravatar seed.");
    }

    private String determineGender(String firstName) {
        String lowerName = firstName.toLowerCase();
        
        // Check if name ends with common female endings
        for (String ending : FEMALE_ENDINGS) {
            if (lowerName.endsWith(ending)) {
                return "false";
            }
        }
        
        // Default to male if not clearly female
        return "true";
    }
}

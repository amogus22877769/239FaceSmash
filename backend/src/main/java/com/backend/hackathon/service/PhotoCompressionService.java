package com.backend.hackathon.service;

import com.backend.hackathon.entity.Person;
import com.backend.hackathon.repositrory.PersonRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PhotoCompressionService {

    private final PersonRepository personRepository;
    private static final int MAX_WIDTH = 400;
    private static final int MAX_HEIGHT = 400;
    private static final double QUALITY = 0.7; // 70% quality

    @Transactional
    public int compressAllPhotos() {
        List<Person> allPersons = personRepository.findAll();
        int compressed = 0;
        
        for (Person person : allPersons) {
            String photo = person.getPhoto();
            if (photo == null || photo.trim().isEmpty()) {
                continue;
            }
            
            // Skip stock photos
            if (photo.contains("pravatar.cc") || photo.contains("placeholder")) {
                continue;
            }
            
            // Skip if already small (less than 200KB)
            if (photo.length() < 200000) {
                continue;
            }
            
            try {
                String compressedPhoto = compressBase64Image(photo);
                if (compressedPhoto != null && compressedPhoto.length() < photo.length()) {
                    person.setPhoto(compressedPhoto);
                    personRepository.save(person);
                    compressed++;
                    log.info("Compressed photo for person ID {}: {} -> {} bytes", 
                            person.getId(), photo.length(), compressedPhoto.length());
                }
            } catch (Exception e) {
                log.warn("Failed to compress photo for person ID {}: {}", person.getId(), e.getMessage());
            }
        }
        
        log.info("Compressed {} photos", compressed);
        return compressed;
    }
    
    /**
     * Resize a base64 image to specified dimensions on-the-fly (does not save to database)
     * @param base64Image The original base64 image string
     * @param width Target width
     * @param height Target height
     * @return Resized base64 image string, or null if error
     */
    public String resizeBase64Image(String base64Image, int width, int height) {
        if (base64Image == null || base64Image.trim().isEmpty()) {
            return null;
        }
        
        // Skip stock photos
        if (base64Image.contains("pravatar.cc") || base64Image.contains("placeholder")) {
            return base64Image; // Return as-is for stock photos
        }
        
        try {
            // Remove data URI prefix if present
            String base64Data = base64Image;
            String format = "jpg";
            
            if (base64Image.startsWith("data:image/")) {
                int commaIndex = base64Image.indexOf(",");
                if (commaIndex > 0) {
                    String header = base64Image.substring(0, commaIndex);
                    base64Data = base64Image.substring(commaIndex + 1);
                    
                    // Extract format
                    if (header.contains("png")) {
                        format = "png";
                    } else if (header.contains("jpeg") || header.contains("jpg")) {
                        format = "jpg";
                    }
                }
            }
            
            // Decode base64
            byte[] imageBytes = Base64.getDecoder().decode(base64Data);
            
            // Resize image
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            Thumbnails.of(new ByteArrayInputStream(imageBytes))
                    .size(width, height)
                    .outputFormat(format)
                    .outputQuality(QUALITY)
                    .toOutputStream(outputStream);
            
            byte[] resizedBytes = outputStream.toByteArray();
            
            // Encode back to base64
            String resizedBase64 = Base64.getEncoder().encodeToString(resizedBytes);
            
            // Add data URI prefix back
            return "data:image/" + format + ";base64," + resizedBase64;
            
        } catch (Exception e) {
            log.error("Error resizing image: {}", e.getMessage());
            return base64Image; // Return original on error
        }
    }
    
    private String compressBase64Image(String base64Image) {
        try {
            // Remove data URI prefix if present
            String base64Data = base64Image;
            String format = "jpg";
            
            if (base64Image.startsWith("data:image/")) {
                int commaIndex = base64Image.indexOf(",");
                if (commaIndex > 0) {
                    String header = base64Image.substring(0, commaIndex);
                    base64Data = base64Image.substring(commaIndex + 1);
                    
                    // Extract format
                    if (header.contains("png")) {
                        format = "png";
                    } else if (header.contains("jpeg") || header.contains("jpg")) {
                        format = "jpg";
                    }
                }
            }
            
            // Decode base64
            byte[] imageBytes = Base64.getDecoder().decode(base64Data);
            
            // Compress image
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            Thumbnails.of(new ByteArrayInputStream(imageBytes))
                    .size(MAX_WIDTH, MAX_HEIGHT)
                    .outputFormat(format)
                    .outputQuality(QUALITY)
                    .toOutputStream(outputStream);
            
            byte[] compressedBytes = outputStream.toByteArray();
            
            // Encode back to base64
            String compressedBase64 = Base64.getEncoder().encodeToString(compressedBytes);
            
            // Add data URI prefix back
            return "data:image/" + format + ";base64," + compressedBase64;
            
        } catch (Exception e) {
            log.error("Error compressing image: {}", e.getMessage());
            return null;
        }
    }
}


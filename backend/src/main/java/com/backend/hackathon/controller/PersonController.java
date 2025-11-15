package com.backend.hackathon.controller;

import com.backend.hackathon.entity.Person;
import com.backend.hackathon.entity.VoteRequest;
import com.backend.hackathon.service.PersonService;
import com.backend.hackathon.service.PhotoCompressionService;
import com.backend.hackathon.service.StudentConverterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.util.List;
import java.util.Objects;
import java.util.Random;

@RestController
@RequestMapping("/api")
public class PersonController {

    private final StudentConverterService converterService;
    private final PersonService personService;
    private final PhotoCompressionService photoCompressionService;

    public PersonController(PersonService personService, StudentConverterService converterService, PhotoCompressionService photoCompressionService) {
        this.personService = personService;
        this.converterService = converterService;
        this.photoCompressionService = photoCompressionService;
    }


    @GetMapping("/persons")
    public ResponseEntity<List<Person>> getPersons(
            @RequestParam(required = false, defaultValue = "false") boolean includePhotos){
        List<Person> persons = personService.getAllPersons();
        
        // If photos are not requested, exclude them to reduce response size (41MB -> ~100KB)
        // This prevents timeouts when loading all 909 persons
        if (!includePhotos) {
            persons.forEach(person -> {
                // Keep photo presence info for filtering, but clear actual data
                // Frontend can fetch individual photos via /api/persons/{id} if needed
                person.setPhoto(null);
            });
        }
        
        return ResponseEntity.ok().body(persons);
    }

    @GetMapping("/persons/filter/{male}")
    public ResponseEntity<List<Person>> getPersonsFilteredByMale(@PathVariable String male){
        return ResponseEntity.ok().body(personService.getPersonsFilteredByMale(male));
    }

    @GetMapping("/persons/{id}")
    public ResponseEntity<Person> getPersonById(
            @PathVariable long id,
            @RequestParam(required = false) Integer photoWidth,
            @RequestParam(required = false) Integer photoHeight){
        Person person = personService.getPersonById(id);
        
        // Resize photo if dimensions are specified
        if (person != null && person.getPhoto() != null && photoWidth != null && photoHeight != null) {
            String resizedPhoto = photoCompressionService.resizeBase64Image(person.getPhoto(), photoWidth, photoHeight);
            if (resizedPhoto != null) {
                person.setPhoto(resizedPhoto);
            }
        }
        
        return ResponseEntity.ok().body(person);
    }
    
    @GetMapping("/persons/{id}/photo")
    public ResponseEntity<String> getPersonPhoto(
            @PathVariable long id,
            @RequestParam(required = false, defaultValue = "400") int width,
            @RequestParam(required = false, defaultValue = "400") int height){
        Person person = personService.getPersonById(id);
        
        if (person == null || person.getPhoto() == null) {
            return ResponseEntity.notFound().build();
        }
        
        String resizedPhoto = photoCompressionService.resizeBase64Image(person.getPhoto(), width, height);
        if (resizedPhoto == null) {
            return ResponseEntity.ok().body(person.getPhoto()); // Return original on error
        }
        
        return ResponseEntity.ok().body(resizedPhoto);
    }

    @PostMapping("/persons")
    public ResponseEntity<Person> createPerson(@RequestBody Person person){
        return ResponseEntity.ok().body(personService.createPerson(person));
    }

    @PutMapping("/persons/{id}")
    public ResponseEntity<Person> updatePerson(@PathVariable int id,@RequestBody Person person){
        return ResponseEntity.ok().body(personService.updatePerson(id,person));
    }

    @DeleteMapping("/persons/{id}")
    public ResponseEntity<Void> deletePerson(@PathVariable int id){
        personService.deletePerson(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/persons/duo/filter/{male}")
    public ResponseEntity<List<Person>> getTwoRandomPersonsByMale(
            @PathVariable String male,
            @RequestParam(required = false, defaultValue = "false") boolean haveAvatar,
            @RequestParam(required = false) Boolean oldSchool,
            @RequestParam(required = false) Integer photoWidth,
            @RequestParam(required = false) Integer photoHeight) {
        List<Person> persons;
        
        if (haveAvatar) {
            persons = personService.getTwoRandomPersonsByMaleAndPhoto(male, true, oldSchool);
        } else {
            persons = personService.getTwoRandomPersonsByMale(male, oldSchool);
        }
        
        // Resize photos if dimensions are specified
        if (photoWidth != null && photoHeight != null) {
            for (Person person : persons) {
                if (person.getPhoto() != null) {
                    String resizedPhoto = photoCompressionService.resizeBase64Image(person.getPhoto(), photoWidth, photoHeight);
                    if (resizedPhoto != null) {
                        person.setPhoto(resizedPhoto);
                    }
                }
            }
        }
        
        return ResponseEntity.ok().body(persons);
    }

    @PostMapping("/persons/duo/vote")
    public ResponseEntity<Void> duoVote(@RequestBody VoteRequest voteRequest){
        personService.duoVote(voteRequest.getWinnerId(),voteRequest.getLoserId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/convert-and-save")
    public List<Person> convertAndSaveStudents() {
        try {
            ClassPathResource studentsResource = new ClassPathResource("students.json");
            ClassPathResource vkResource = new ClassPathResource("vk_results.json");

            InputStream studentsStream = studentsResource.getInputStream();
            InputStream vkStream = vkResource.getInputStream();

            return converterService.convertAndSaveStudents(studentsStream, vkStream);
        } catch (Exception e) {
            throw new RuntimeException("Ошибка при чтении и сохранении данных", e);
        }
    }

    @PostMapping("/clear-and-save")
    public List<Person> clearAndSaveStudents() {
        try {
            ClassPathResource studentsResource = new ClassPathResource("students.json");
            ClassPathResource vkResource = new ClassPathResource("vk_results.json");

            InputStream studentsStream = studentsResource.getInputStream();
            InputStream vkStream = vkResource.getInputStream();

            converterService.clearAndSaveStudents(studentsStream, vkStream);
            return converterService.convertAndSaveStudents(studentsStream, vkStream);
        } catch (Exception e) {
            throw new RuntimeException("Ошибка при очистке таблицы и сохранении новых данных", e);
        }
    }

    @PostMapping("/compress-photos")
    public ResponseEntity<String> compressPhotos() {
        int compressed = photoCompressionService.compressAllPhotos();
        return ResponseEntity.ok("Compressed " + compressed + " photos");
    }
}

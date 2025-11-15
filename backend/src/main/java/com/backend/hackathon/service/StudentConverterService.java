package com.backend.hackathon.service;

import com.backend.hackathon.entity.Person;
import com.backend.hackathon.repositrory.PersonRepository;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentConverterService {

    private static final double DEFAULT_RATING = 1000.0;
    private static final int BATCH_SIZE = 100; // Размер пакета

    @Autowired
    private PersonRepository personRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public List<Person> convertAndSaveStudents(InputStream studentsJsonStream, InputStream dataJsonStream) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            List<StudentData> studentDataList = objectMapper.readValue(
                    studentsJsonStream,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, StudentData.class)
            );

            List<VkData> vkDataList = objectMapper.readValue(
                    dataJsonStream,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, VkData.class)
            );

            Map<String, String> classByFullName = studentDataList.stream()
                    .collect(Collectors.toMap(StudentData::getName, StudentData::getSchoolClass));

            List<Person> allPersons = new ArrayList<>();
            for (VkData vkData : vkDataList) {
                Person person = convertToPerson(vkData, classByFullName);
                if (person != null) {
                    allPersons.add(person);
                }
            }

            // Сохраняем пакетами
            return saveInBatches(allPersons);

        } catch (Exception e) {
            throw new RuntimeException("Error converting and saving students data", e);
        }
    }

    private List<Person> saveInBatches(List<Person> persons) {
        List<Person> savedPersons = new ArrayList<>();

        for (int i = 0; i < persons.size(); i += BATCH_SIZE) {
            int end = Math.min(persons.size(), i + BATCH_SIZE);
            List<Person> batch = persons.subList(i, end);

            System.out.println("Saving batch " + (i/BATCH_SIZE + 1) + ", records: " + batch.size());

            List<Person> savedBatch = personRepository.saveAll(batch);
            savedPersons.addAll(savedBatch);

            // Очищаем persistence context после каждого пакета
            entityManager.flush();
            entityManager.clear();

            // Небольшая пауза между пакетами
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        System.out.println("Total saved: " + savedPersons.size());
        return savedPersons;
    }

    @Transactional
    public void clearAndSaveStudents(InputStream studentsJsonStream, InputStream dataJsonStream) {
        // Очищаем таблицу перед сохранением новых данных
        personRepository.deleteAll();
        convertAndSaveStudents(studentsJsonStream, dataJsonStream);
    }

    private Person convertToPerson(VkData vkData, Map<String, String> classByFullName) {
        Person person = new Person();

        // Разбиваем original_name на имя и фамилию
        String[] nameParts = vkData.getOriginalName().split(" ");
        if (nameParts.length >= 2) {
            person.setName(nameParts[1]); // Имя (второй элемент)
            person.setSurname(nameParts[0]); // Фамилия (первый элемент)
        } else {
            person.setName(vkData.getOriginalName());
            person.setSurname("");
        }

        // Ищем класс по полному имени в students.json
        String schoolClass = classByFullName.get(vkData.getOriginalName());
        if (schoolClass != null) {
            person.setSchoolClass(schoolClass);
        } else {
            person.setSchoolClass("unknown");
        }

        person.setRating(DEFAULT_RATING);
        person.setPhoto(vkData.getAvatarBase64());

        String firstName = nameParts.length >= 2 ? nameParts[1] : vkData.getOriginalName();
        person.setMale(determineGender(firstName));

        return person;
    }

    private String determineGender(String firstName) {
        if (firstName == null || firstName.isEmpty()) {
            return "unknown";
        }

        String[] femaleEndings = {"а", "я", "ья", "ия", "на", "ла", "та"};
        String lowerFirstName = firstName.toLowerCase();

        for (String ending : femaleEndings) {
            if (lowerFirstName.endsWith(ending)) {
                return "female";
            }
        }

        return "male";
    }

    // Внутренний класс для десериализации students.json
    private static class StudentData {
        @JsonProperty("name")
        private String name;

        @JsonProperty("class")
        private String schoolClass;

        public String getName() {
            return name;
        }

        public String getSchoolClass() {
            return schoolClass;
        }
    }

    // Внутренний класс для десериализации data.json
    private static class VkData {
        @JsonProperty("original_name")
        private String originalName;

        @JsonProperty("search_name")
        private String searchName;

        @JsonProperty("vk_id")
        private String vkId;

        @JsonProperty("vk_name")
        private String vkName;

        @JsonProperty("vk_profile")
        private String vkProfile;

        @JsonProperty("avatar_base64")
        private String avatarBase64;

        @JsonProperty("found_count")
        private int foundCount;

        public String getOriginalName() {
            return originalName;
        }

        public String getAvatarBase64() {
            return avatarBase64;
        }
    }
}
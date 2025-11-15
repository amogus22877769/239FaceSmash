package com.backend.hackathon.service;

import com.backend.hackathon.entity.Person;
import com.backend.hackathon.repositrory.PersonRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class PersonServiceImpl implements PersonService{

    private final PersonRepository personRepository;
    private final Random random = new Random();
    
    @PersistenceContext
    private EntityManager entityManager;

    public PersonServiceImpl(PersonRepository personRepository) {
        this.personRepository = personRepository;
    }


    @Override
    public List<Person> getAllPersons() {
        return personRepository.findAll();
    }

    @Override
    public List<Person> getPersonsFilteredByMale(String male) {
        List<Person> persons = personRepository.findAll();
        List<Person> personsFilteredByMalePersons = new ArrayList<>();
        for(Person person:persons){
            if (person.getMale().equals(male)){
                personsFilteredByMalePersons.add(person);
            }
        }
        return personsFilteredByMalePersons;
    }

    @Override
    public Person getPersonById(long id) {
        return personRepository.getPersonById(id);
    }

    @Override
    public Person createPerson(Person person) {
        person.setRating(1000);
        return personRepository.save(person);
    }

    @Override
    public Person updatePerson(long id,Person person) {
        return personRepository.save(person);
    }

    @Override
    public void deletePerson(long id) {
        Person person = personRepository.getPersonById(id);
        personRepository.delete(person);
    }

    @Override
    public List<Person> getTwoRandomPersonsByMale(String male, Boolean oldSchool) {
        List<Person> filteredPersons;

        if (oldSchool == null) {
            // Если параметр не передан - выбираем из всех классов
            filteredPersons = personRepository.findByMale(male);
        } else if (oldSchool) {
            // oldSchool=true: классы 9-11
            String classPattern = "%-%"; // любой класс
            List<Person> allPersons = personRepository.findByMaleAndClassLike(male, classPattern);
            filteredPersons = filterByClassRange(allPersons, 9, 11);
        } else {
            // oldSchool=false: классы 5-8
            String classPattern = "%-%"; // любой класс
            List<Person> allPersons = personRepository.findByMaleAndClassLike(male, classPattern);
            filteredPersons = filterByClassRange(allPersons, 5, 8);
        }



        if (filteredPersons.size() < 2) {
            throw new RuntimeException("Not enough persons found for male: " + male + " and oldSchool: " + oldSchool + ". Found: " + filteredPersons.size());
        }

        // Перемешиваем и берем первых двух
        Collections.shuffle(filteredPersons);
        List<Person> result = filteredPersons.subList(0, 2);


        return result;
    }

    @Override
    public List<Person> getTwoRandomPersonsByMaleAndPhoto(String male, boolean haveAvatar, Boolean oldSchool) {
        List<Person> filteredPersons;
        if (haveAvatar) {
            // Для случая с фото используем более строгую фильтрацию
            if (oldSchool == null) {
                // Сначала получаем всех с фото
                List<Person> withPhoto = personRepository.findPersonsByMaleWithPhoto(male);
                // Затем дополнительно фильтруем в коде
                filteredPersons = filterRealPhotos(withPhoto);
            } else {
                String classPattern = "%-%"; // любой класс
                // Используем метод репозитория для фото и класса
                List<Person> withPhotoAndClass = personRepository.findByMaleAndClassLikeWithPhoto(male, classPattern);
                List<Person> filteredByPhoto = filterRealPhotos(withPhotoAndClass);

                if (oldSchool) {
                    // oldSchool=true: классы 9-11
                    filteredPersons = filterByClassRange(filteredByPhoto, 9, 11);
                } else {
                    // oldSchool=false: классы 5-8
                    filteredPersons = filterByClassRange(filteredByPhoto, 5, 8);
                }
            }
        } else {
            // Без фото - используем ту же логику, что и в getTwoRandomPersonsByMale
            if (oldSchool == null) {
                filteredPersons = personRepository.findByMale(male);
            } else if (oldSchool) {
                String classPattern = "%-%"; // любой класс
                List<Person> allPersons = personRepository.findByMaleAndClassLike(male, classPattern);
                filteredPersons = filterByClassRange(allPersons, 9, 11);
            } else {
                String classPattern = "%-%"; // любой класс
                List<Person> allPersons = personRepository.findByMaleAndClassLike(male, classPattern);
                filteredPersons = filterByClassRange(allPersons, 5, 8);
            }
        }


        if (filteredPersons.size() < 2) {
            throw new RuntimeException("Not enough persons" + (haveAvatar ? " with photos" : "") +
                    " found for male: " + male + " and oldSchool: " + oldSchool + ". Found: " + filteredPersons.size());
        }

        // Перемешиваем и берем первых двух
        Collections.shuffle(filteredPersons);
        List<Person> result = filteredPersons.subList(0, 2);


        return result;
    }

    // Вспомогательный метод для фильтрации по диапазону классов
    private List<Person> filterByClassRange(List<Person> persons, int minClass, int maxClass) {
        return persons.stream()
                .filter(person -> {
                    String schoolClass = person.getSchoolClass();
                    if (schoolClass != null && schoolClass.contains("-")) {
                        try {
                            int classNumber = Integer.parseInt(schoolClass.split("-")[0]);
                            return classNumber >= minClass && classNumber <= maxClass;
                        } catch (NumberFormatException e) {
                            return false;
                        }
                    }
                    return false;
                })
                .collect(Collectors.toList());
    }

    // Вспомогательный метод для фильтрации реальных фото (не stock)
    private List<Person> filterRealPhotos(List<Person> persons) {
        List<Person> result = new ArrayList<>();
        for (Person person : persons) {
            String photo = person.getPhoto();
            if (photo != null && !photo.trim().isEmpty()) {
                // Проверяем, что это не stock photo
                if (!photo.contains("pravatar.cc") && !photo.contains("placeholder")) {
                    // Проверяем, что это реальное фото
                    boolean isValidPhoto = photo.startsWith("data:image/") ||
                            photo.startsWith("http://") ||
                            photo.startsWith("https://") ||
                            photo.startsWith("/9j/") ||
                            photo.startsWith("iVBORw0KGgo") ||
                            (photo.length() > 100 && !photo.startsWith("data:") && !photo.contains("."));
                    if (isValidPhoto) {
                        result.add(person);
                    }
                }
            }
        }
        return result;
    }

    @Override
    public void duoVote(long winnerId, long loserId) {
        Person winner = personRepository.getPersonById(winnerId);
        Person loser = personRepository.getPersonById(loserId);
        winner.setRating(winner.getRating()+10);
        loser.setRating(loser.getRating()-10);
    }
}

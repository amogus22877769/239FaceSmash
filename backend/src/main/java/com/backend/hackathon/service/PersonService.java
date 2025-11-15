package com.backend.hackathon.service;

import com.backend.hackathon.entity.Person;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface PersonService {
    List<Person> getAllPersons();

    List<Person> getPersonsFilteredByMale(String male);

    Person getPersonById(long id);

    Person createPerson(Person person);

    Person updatePerson(long id,Person person);

    void deletePerson(long id);

    List<Person> getTwoRandomPersonsByMale(String male, Boolean oldSchool);

    List<Person> getTwoRandomPersonsByMaleAndPhoto(String male, boolean haveAvatar, Boolean oldSchool);

    void duoVote(long winnerId, long loserId);
}

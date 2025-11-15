package com.backend.hackathon.repositrory;

import com.backend.hackathon.entity.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface PersonRepository extends JpaRepository<Person,Long>{
    Person getPersonById(long id);

    // Базовый метод для поиска по полу
    List<Person> findByMale(String male);

    // Метод для поиска по полу и классу
    @Query("SELECT p FROM Person p WHERE p.male = :male AND p.schoolClass LIKE :classPattern")
    List<Person> findByMaleAndClassLike(@Param("male") String male, @Param("classPattern") String classPattern);

    // Метод для поиска по полу, классу и наличию фото
    @Query("SELECT p FROM Person p WHERE p.male = :male AND p.schoolClass LIKE :classPattern AND p.photo IS NOT NULL AND LENGTH(p.photo) > 100")
    List<Person> findByMaleAndClassLikeWithPhoto(@Param("male") String male, @Param("classPattern") String classPattern);

    @Query(value = "SELECT * FROM person WHERE male = :male AND photo IS NOT NULL AND LENGTH(photo) > 100", nativeQuery = true)
    List<Person> findPersonsByMaleWithPhoto(@Param("male") String male);
}

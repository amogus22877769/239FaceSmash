DROP TABLE IF EXISTS person;

CREATE TABLE person
(
    id           BIGINT AUTO_INCREMENT NOT NULL,
    name         VARCHAR(255)          NULL,
    surname      VARCHAR(255)          NULL,
    school_class VARCHAR(255)          NULL,
    rating       DOUBLE                NULL,
    photo        LONGTEXT              NULL,  -- Изменено на LONGTEXT
    male         VARCHAR(255)          NULL,
    CONSTRAINT pk_person PRIMARY KEY (id)
);
package com.backend.hackathon.exceptionHandling;

import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {
//    @ExceptionHandler
//    public ResponseEntity<ExceptionDataObject> handleCustomException(CustomException customException) {
//        ExceptionDataObject data = new ExceptionDataObject();
//        data.setInfo(customException.getMessage());
//        return new ResponseEntity<>(data, HttpStatusCode.valueOf("set your status code"));
//    }

//   example! Replace CustomException with name of your exception.
}


// use this to add custom exceptions

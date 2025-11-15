package com.backend.hackathon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Ping controller")
public class PingController {


    @Operation(summary = "check ping")
    @GetMapping("/ping")
    public String ping(){
        return "pong";
    }
}

package com.backend.hackathon.entity;

import lombok.Data;

@Data
public class VoteRequest {
    private long winnerId;
    private long loserId;
}

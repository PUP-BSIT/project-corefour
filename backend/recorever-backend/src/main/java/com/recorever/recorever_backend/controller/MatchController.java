package com.recorever.recorever_backend.controller;

import com.recorever.recorever_backend.model.Match;
import com.recorever.recorever_backend.service.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MatchController {

    @Autowired
    private MatchService service;

    @GetMapping("/matches")
    public ResponseEntity<List<Match>> getAllMatches() {
        return ResponseEntity.ok(service.listAllMatches());
    }

    @GetMapping("/match/{id}")
    public ResponseEntity<?> getMatch(@PathVariable int id) {
        Match match = service.getMatchById(id);
        if (match == null) return ResponseEntity.status(404).body("Match not found");
        return ResponseEntity.ok(match);
    }

    @PutMapping("/match/{id}")
    public ResponseEntity<?> updateMatchStatus(@PathVariable int id,
                                               @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isEmpty()) {
            return ResponseEntity.badRequest().body("Status field is required.");
        }
        
        boolean updated = service.updateMatchStatus(id, status);
        if (!updated) return ResponseEntity.badRequest().body("Match update failed.");
        
        return ResponseEntity.ok(Map.of("success", true, "message", "Match status updated to " + status));
    }
}
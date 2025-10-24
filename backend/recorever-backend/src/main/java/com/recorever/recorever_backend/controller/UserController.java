package com.recorever.recorever_backend.controller;

import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.service.UserService;
import com.recorever.recorever_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserService service;

    @Autowired
    private UserRepository repo;

    @PostMapping("/register-user")
    public ResponseEntity<?> registerUser(@RequestParam String name,
                                          @RequestParam String email,
                                          @RequestParam String password) {
      Map<String, Object> result = service.register(name, email, password);
      if (result.containsKey("error")) {
          return ResponseEntity.badRequest().body(result.get("error"));
      }
      return ResponseEntity.status(201).body(result);
    }

    @PostMapping("/login-user")
    public ResponseEntity<?> loginUser(@RequestParam String email,
                                       @RequestParam String password) {
      Map<String, Object> result = service.login(email, password);
      if (result.containsKey("error")) {
          return ResponseEntity.status(401).body(result.get("error"));
      }
      return ResponseEntity.ok(result);
    }

    @GetMapping("/get-user-data")
    public ResponseEntity<?> getUser(@RequestParam int id) {
      User user = repo.findById(id);
      if (user == null) return ResponseEntity.status(404)
          .body("User not found");
      return ResponseEntity.ok(user);
    }

    @PutMapping("/update-user-data")
    public ResponseEntity<?> updateUser(@RequestParam int id,
                                        @RequestParam String name,
                                        @RequestParam String phone_number,
                                        @RequestParam String profile_picture) {
      boolean updated = repo
          .updateUser(id, name, phone_number, profile_picture);
      if (!updated) return ResponseEntity.badRequest().body("Invalid update");
      return ResponseEntity.ok(
          Map.of("success", true, "message", "Profile updated successfully."));
    }

    @DeleteMapping("/delete-user")
    public ResponseEntity<?> deleteUser(@RequestParam int id) {
      boolean deleted = repo.deleteUser(id);
      if (!deleted) return ResponseEntity.status(404).body("User not found.");
      return ResponseEntity.ok
        (Map.of("success", true, "message", "User account deactivated."));
    }
}
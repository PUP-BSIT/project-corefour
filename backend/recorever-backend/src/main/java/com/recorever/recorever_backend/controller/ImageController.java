package com.recorever.recorever_backend.controller;

import com.recorever.recorever_backend.model.Image;
import com.recorever.recorever_backend.service.ImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ImageController {

    @Autowired
    private ImageService service;

    @GetMapping("/images")
    public ResponseEntity<List<Image>> getAllImages() {
        List<Image> images = service.listAll();
        if (images.isEmpty()) {
            return ResponseEntity.status(404).body(null); 
        }
        return ResponseEntity.ok(images);
    }

    @GetMapping("/image/{id}")
    public ResponseEntity<?> getSingleImage(@PathVariable int id) {
        Image image = service.getById(id);
        if (image == null) {
            return ResponseEntity.status(404).body("Image not found.");
        }
        return ResponseEntity.ok(image);
    }

    @DeleteMapping("/image/{id}")
    public ResponseEntity<?> deleteImage(@PathVariable int id) {
        Image image = service.getById(id);
        if (image == null) {
            return ResponseEntity.status(404).body("Image not found."); 
        }
        
        boolean deleted = service.deleteImage(id);
        if (!deleted) {
            return ResponseEntity.badRequest().body("Failed to delete image.");
        }
        
        return ResponseEntity.ok(Map.of("success", true, "message", "Image soft deleted and file removed successfully."));
    }
}
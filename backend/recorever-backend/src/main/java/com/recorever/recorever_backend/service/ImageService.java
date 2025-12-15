package com.recorever.recorever_backend.service;
import com.recorever.recorever_backend.repository.ImageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.recorever.recorever_backend.model.Image;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;
import java.util.UUID;

@Service
public class ImageService {

    private final ImageRepository imageRepository;

    private final Path fileStorageLocation;

    public ImageService(@Value("${file.upload-dir}") String uploadDir, ImageRepository imageRepository) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the storage directory: " + this.fileStorageLocation, ex);
        }
        
        this.imageRepository = imageRepository;
    }

    public Image saveImageMetadata(Image image) {
        return imageRepository.save(image);
    }

    public String storeFile(MultipartFile file) {
        String originalFileName = Objects.requireNonNull(file.getOriginalFilename());
        // Generate a unique name
        String newFileName = UUID.randomUUID().toString() + "_" + originalFileName.replaceAll("[^a-zA-Z0-9\\.\\-]", "_");

        try {
            Path targetLocation = this.fileStorageLocation.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation);
            
            return newFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFileName, ex);
        }
    }

    public Path loadFileAsResource(String fileName) {
        return this.fileStorageLocation.resolve(fileName).normalize();
    }

    public boolean deleteFile(String fileName) {
        try {
            Path targetLocation = this.fileStorageLocation.resolve(fileName).normalize();
            return Files.deleteIfExists(targetLocation);
        } catch (IOException ex) {
            System.err.println("Error deleting file: " + fileName + ". Reason: " + ex.getMessage());
            return false;
        }
    }
}
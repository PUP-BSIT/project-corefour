package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.model.Image;
import com.recorever.recorever_backend.repository.ImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class ImageService {
    
    private static final String UPLOAD_DIR = "uploads/images/"; 

    @Autowired
    private ImageRepository repo;

    public List<Image> listAll() { return repo.getAllImages(); }

    public Image getById(int id) { return repo.getImageById(id); }
    
    public Image uploadReportImage(int reportId, MultipartFile file) throws IOException {
        String filePath = saveFileToDisk(file, "report_" + reportId);
        int imageId = repo.saveReportImage(reportId, filePath);
        
        if (imageId > 0) {
            return getById(imageId);
        }
        throw new IOException("Failed to save image metadata to database.");
    }

    public Image uploadClaimImage(int claimId, MultipartFile file) throws IOException {
        String filePath = saveFileToDisk(file, "claim_" + claimId);
        int imageId = repo.saveClaimImage(claimId, filePath);

        if (imageId > 0) {
            return getById(imageId);
        }
        throw new IOException("Failed to save image metadata to database.");
    }

    public boolean deleteImage(int imageId) {
        Image image = repo.getImageById(imageId);
        if (image == null) return false;

        boolean deletedDb = repo.softDeleteImage(imageId);
        
        // Physically delete the file from storage if DB update was successful
        if (deletedDb) {
            try {
                Path filePath = Paths.get(image.getFile_path());
                File fileToDelete = filePath.toFile();
                if (fileToDelete.exists()) {
                    Files.deleteIfExists(filePath);
                }
            } catch (IOException e) {
                System.err.println("Failed to delete physical file from disk: " + e.getMessage());
            }
        }
        return deletedDb;
    }
    
    // --- Helper for Mock File Saving ---
    private String saveFileToDisk(MultipartFile file, String prefix) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null) {
            int lastDot = originalFilename.lastIndexOf('.');
            if (lastDot > 0) {
                extension = originalFilename.substring(lastDot);
            }
        }
        
        String newFilename = prefix + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path destinationFile = uploadPath.resolve(newFilename);
        file.transferTo(destinationFile);
        
        return UPLOAD_DIR + newFilename; 
    }
}
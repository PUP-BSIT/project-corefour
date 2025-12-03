package com.recorever.recorever_backend.controller;

import com.recorever.recorever_backend.model.Image;
import com.recorever.recorever_backend.repository.ImageRepository;
import com.recorever.recorever_backend.service.ImageService;
import com.recorever.recorever_backend.dto.ImageResponseDTO; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.nio.file.Path;
import java.nio.file.Files;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ImageController {

    @Autowired
    private ImageRepository imageRepository;
    
    @Autowired
    private ImageService imageService;

    private ImageResponseDTO convertToDto(Image image) {
        if (image == null) return null;
        
        ImageResponseDTO dto = new ImageResponseDTO();
        dto.setImageId(image.getImageId());
        dto.setFileName(image.getFileName());
        dto.setFileType(image.getFileType());
        dto.setReportId(image.getReportId());
        dto.setClaimId(image.getClaimId());
        dto.setUploadedAt(image.getUploadedAt());

        String imageUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/image/download/")
                .path(image.getFilePath()) 
                .toUriString();
        dto.setImageUrl(imageUrl);
        
        return dto;
    }

    @GetMapping("/images")
    public List<ImageResponseDTO> getAllImages() {
        return imageRepository.findAll().stream()
                .filter(img -> !img.isDeleted()) 
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/image/{id}")
    public ResponseEntity<ImageResponseDTO> getImageDetails(@PathVariable int id) {
        return imageRepository.findById(id)
                .filter(img -> !img.isDeleted())
                .map(this::convertToDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/image/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable int id) {
        return imageRepository.findById(id).map(image -> {
            imageService.deleteFile(image.getFilePath()); 

            image.setDeleted(true); 
            imageRepository.save(image); 
            
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/report/{id}/upload-image")
    public ResponseEntity<List<ImageResponseDTO>> uploadReportImages(
            @PathVariable int id,
            @RequestParam("files") List<MultipartFile> files) {

        List<ImageResponseDTO> uploadedImages = files.stream().map(file -> {
            String uniqueFileName = imageService.storeFile(file);
            Image image = new Image(file.getOriginalFilename(),
                    file.getContentType(), uniqueFileName, id);
            Image savedImage = imageRepository.save(image);
            return convertToDto(savedImage); 
        }).collect(Collectors.toList());

        return ResponseEntity.ok(uploadedImages);
    }

    @PostMapping("/claim/{id}/upload-image")
    public ResponseEntity<ImageResponseDTO> uploadClaimImage(
            @PathVariable int id,
            @RequestParam("file") MultipartFile file) {

        String uniqueFileName = imageService.storeFile(file);
        Image image = new Image(file.getOriginalFilename(),
                file.getContentType(), uniqueFileName, id, true);
        Image savedImage = imageRepository.save(image);
        return ResponseEntity.ok(convertToDto(savedImage)); 
    }

    @GetMapping("/image/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        Path filePath = imageService.loadFileAsResource(fileName);
        try {
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() || resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
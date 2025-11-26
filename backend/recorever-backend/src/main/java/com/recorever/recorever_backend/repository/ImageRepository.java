package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.model.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ImageRepository extends JpaRepository<Image, Integer> {
    List<Image> findByReportIdAndIsDeletedFalse(Integer reportId);
    List<Image> findByClaimIdAndIsDeletedFalse(Integer claimId);
}
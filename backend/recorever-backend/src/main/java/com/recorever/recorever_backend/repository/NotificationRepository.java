package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.model.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository 
        extends JpaRepository<Notification, Integer> {

    @Query("SELECT n FROM Notification n WHERE n.user_id = :userId " +
           "ORDER BY n.created_at DESC")
    List<Notification> findByUserId(@Param("userId") int userId, 
                                    Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user_id = :userId")
    int countByUserId(@Param("userId") int userId);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.status = 'read' " +
           "WHERE n.notif_id = :notifId")
    int markAsRead(@Param("notifId") int notifId);
}
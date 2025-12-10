package com.recorever.recorever_backend.model;

import jakarta.persistence.*; 
import lombok.Data;
import lombok.NoArgsConstructor; 
import lombok.AllArgsConstructor; 
import java.util.List; 

@Entity 
@Table(name = "claims")
@Data
@NoArgsConstructor
@AllArgsConstructor 
public class Claim {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int claim_id;

    private int report_id;
    private int user_id;
    
    private String claim_code;
    private String status; 
    private String admin_remarks;
    private String created_at;

    @OneToMany(mappedBy = "claimId", fetch = FetchType.LAZY) 
    private List<Image> proofImages;
}
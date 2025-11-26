package com.recorever.recorever_backend.model;

import jakarta.persistence.*; 
import lombok.Data;
import lombok.NoArgsConstructor; 
import lombok.AllArgsConstructor; 
import java.util.List; 

@Entity 
@Table(name = "claim") 
@Data
@NoArgsConstructor
@AllArgsConstructor 
public class Claim {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int claim_id;

    private int report_id;
    private int user_id;
    private String proof_description;
    private String item_name;
    private String status; 
    private String created_at;

    @OneToMany(mappedBy = "claimId", fetch = FetchType.LAZY) 
    private List<Image> proofImages;

}
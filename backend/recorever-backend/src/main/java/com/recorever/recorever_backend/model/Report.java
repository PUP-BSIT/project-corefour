package com.recorever.recorever_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "report")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Report {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private int report_id;

  private int user_id;
  private String type;
  private String item_name;
  private String location;
  private String date_lost_found;
  private String date_reported;
  private String date_resolved;
  private String description;
  private String status;
  private String surrender_code;
  private boolean is_deleted;

  @Transient
  private String reporter_name;

  @Transient
  private String expiry_date;

  @OneToMany(mappedBy = "reportId", fetch = FetchType.LAZY)
  private List<Image> images = new ArrayList<>();
}
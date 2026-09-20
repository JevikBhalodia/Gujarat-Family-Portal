package gov.gujarat.portal.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "schemes")
public class Scheme {
    @Id
    private Long id;

    @Column(name = "department_id", nullable = false)
    private Long departmentId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "rules_json", columnDefinition = "TEXT")
    private String rulesJson;

    @Column(name = "required_docs_json", columnDefinition = "TEXT")
    private String requiredDocsJson;

    @Column(nullable = false, length = 20)
    private String type; // one_time, quota, time

    @Column(name = "validity_months")
    private Integer validityMonths;

    @Column(name = "benefit_total")
    private Long benefitTotal;

    @Column
    private LocalDate deadline;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "faq_json", columnDefinition = "TEXT")
    private String faqJson;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Scheme() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRulesJson() {
        return rulesJson;
    }

    public void setRulesJson(String rulesJson) {
        this.rulesJson = rulesJson;
    }

    public String getRequiredDocsJson() {
        return requiredDocsJson;
    }

    public void setRequiredDocsJson(String requiredDocsJson) {
        this.requiredDocsJson = requiredDocsJson;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getValidityMonths() {
        return validityMonths;
    }

    public void setValidityMonths(Integer validityMonths) {
        this.validityMonths = validityMonths;
    }

    public Long getBenefitTotal() {
        return benefitTotal;
    }

    public void setBenefitTotal(Long benefitTotal) {
        this.benefitTotal = benefitTotal;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getFaqJson() {
        return faqJson;
    }

    public void setFaqJson(String faqJson) {
        this.faqJson = faqJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

package gov.gujarat.portal.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "families")
public class Family {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "family_code", nullable = false, unique = true, length = 32)
    private String familyCode;

    @Column(nullable = false, length = 100)
    private String district;

    @Column(name = "income_annual", nullable = false)
    private BigDecimal incomeAnnual = BigDecimal.ZERO;

    @Column(name = "ration_card_ref", length = 100)
    private String rationCardRef;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Family() {}

    public Family(String familyCode, String district, BigDecimal incomeAnnual, String rationCardRef) {
        this.familyCode = familyCode;
        this.district = district;
        this.incomeAnnual = incomeAnnual;
        this.rationCardRef = rationCardRef;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFamilyCode() {
        return familyCode;
    }

    public void setFamilyCode(String familyCode) {
        this.familyCode = familyCode;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public BigDecimal getIncomeAnnual() {
        return incomeAnnual;
    }

    public void setIncomeAnnual(BigDecimal incomeAnnual) {
        this.incomeAnnual = incomeAnnual;
    }

    public String getRationCardRef() {
        return rationCardRef;
    }

    public void setRationCardRef(String rationCardRef) {
        this.rationCardRef = rationCardRef;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

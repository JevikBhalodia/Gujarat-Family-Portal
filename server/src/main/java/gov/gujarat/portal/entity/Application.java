package gov.gujarat.portal.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "family_id", nullable = false)
    private Long familyId;

    @Column(name = "scheme_id", nullable = false)
    private Long schemeId;

    @Column(name = "applied_by_member_id", nullable = false)
    private Long appliedByMemberId;

    @Column(nullable = false, length = 20)
    private String status = "active"; // active, expired

    @Column(name = "facts_snapshot", columnDefinition = "TEXT")
    private String factsSnapshot;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "benefit_total")
    private Long benefitTotal;

    @Column(name = "benefit_used", nullable = false)
    private Long benefitUsed = 0L;

    @Column(name = "expired_reason", length = 50)
    private String expiredReason; // validity_ended, quota_exhausted, revoked

    @Column(name = "revoke_reason", columnDefinition = "TEXT")
    private String revokeReason;

    @Column(name = "revoked_by")
    private Long revokedBy;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Application() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFamilyId() {
        return familyId;
    }

    public void setFamilyId(Long familyId) {
        this.familyId = familyId;
    }

    public Long getSchemeId() {
        return schemeId;
    }

    public void setSchemeId(Long schemeId) {
        this.schemeId = schemeId;
    }

    public Long getAppliedByMemberId() {
        return appliedByMemberId;
    }

    public void setAppliedByMemberId(Long appliedByMemberId) {
        this.appliedByMemberId = appliedByMemberId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getFactsSnapshot() {
        return factsSnapshot;
    }

    public void setFactsSnapshot(String factsSnapshot) {
        this.factsSnapshot = factsSnapshot;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Long getBenefitTotal() {
        return benefitTotal;
    }

    public void setBenefitTotal(Long benefitTotal) {
        this.benefitTotal = benefitTotal;
    }

    public Long getBenefitUsed() {
        return benefitUsed;
    }

    public void setBenefitUsed(Long benefitUsed) {
        this.benefitUsed = benefitUsed;
    }

    public String getExpiredReason() {
        return expiredReason;
    }

    public void setExpiredReason(String expiredReason) {
        this.expiredReason = expiredReason;
    }

    public String getRevokeReason() {
        return revokeReason;
    }

    public void setRevokeReason(String revokeReason) {
        this.revokeReason = revokeReason;
    }

    public Long getRevokedBy() {
        return revokedBy;
    }

    public void setRevokedBy(Long revokedBy) {
        this.revokedBy = revokedBy;
    }

    public LocalDateTime getExpiredAt() {
        return expiredAt;
    }

    public void setExpiredAt(LocalDateTime expiredAt) {
        this.expiredAt = expiredAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

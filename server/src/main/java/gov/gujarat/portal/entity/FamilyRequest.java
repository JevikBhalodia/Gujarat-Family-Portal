package gov.gujarat.portal.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "family_requests")
public class FamilyRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String type; // join, move

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "from_family_id")
    private Long fromFamilyId;

    @Column(name = "to_family_id", nullable = false)
    private Long toFamilyId;

    @Column(nullable = false, length = 20)
    private String status = "pending"; // pending, approved, rejected

    @Column(name = "decided_by")
    private Long decidedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public FamilyRequest() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public Long getFromFamilyId() {
        return fromFamilyId;
    }

    public void setFromFamilyId(Long fromFamilyId) {
        this.fromFamilyId = fromFamilyId;
    }

    public Long getToFamilyId() {
        return toFamilyId;
    }

    public void setToFamilyId(Long toFamilyId) {
        this.toFamilyId = toFamilyId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getDecidedBy() {
        return decidedBy;
    }

    public void setDecidedBy(Long decidedBy) {
        this.decidedBy = decidedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

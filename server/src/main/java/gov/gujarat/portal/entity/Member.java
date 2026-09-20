package gov.gujarat.portal.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "members")
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "family_id", nullable = false)
    private Long familyId;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private LocalDate dob;

    @Column(nullable = false, length = 10)
    private String gender; // M, F, Other

    @Column(name = "relation_to_head", nullable = false, length = 50)
    private String relationToHead;

    @Column(name = "family_role", nullable = false, length = 20)
    private String familyRole; // "head", "member"

    @Column(nullable = false, length = 20)
    private String access = "view"; // "view", "apply"

    @Column(nullable = false, length = 20)
    private String status = "active"; // "pending", "active", "removed"

    @Column(name = "removal_reason", length = 100)
    private String removalReason;

    @Column(name = "id_type", nullable = false, length = 20)
    private String idType; // "aadhaar", "birth_cert"

    @Column(name = "id_hash", nullable = false, length = 128)
    private String idHash;

    @Column(name = "id_last4", nullable = false, length = 4)
    private String idLast4;

    @Column(name = "id_verified", nullable = false)
    private boolean idVerified = false;

    @Column(name = "birth_cert_doc_id")
    private Long birthCertDocId;

    @Column(name = "needs_aadhaar", nullable = false)
    private boolean needsAadhaar = false;

    @com.fasterxml.jackson.annotation.JsonProperty("is_disabled")
    @Column(name = "is_disabled", nullable = false)
    private boolean disabled = false;

    @com.fasterxml.jackson.annotation.JsonProperty("is_student")
    @Column(name = "is_student", nullable = false)
    private boolean student = false;

    @com.fasterxml.jackson.annotation.JsonProperty("is_widowed")
    @Column(name = "is_widowed", nullable = false)
    private boolean widowed = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Member() {}

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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getDob() {
        return dob;
    }

    public void setDob(LocalDate dob) {
        this.dob = dob;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getRelationToHead() {
        return relationToHead;
    }

    public void setRelationToHead(String relationToHead) {
        this.relationToHead = relationToHead;
    }

    public String getFamilyRole() {
        return familyRole;
    }

    public void setFamilyRole(String familyRole) {
        this.familyRole = familyRole;
    }

    public String getAccess() {
        return access;
    }

    public void setAccess(String access) {
        this.access = access;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemovalReason() {
        return removalReason;
    }

    public void setRemovalReason(String removalReason) {
        this.removalReason = removalReason;
    }

    public String getIdType() {
        return idType;
    }

    public void setIdType(String idType) {
        this.idType = idType;
    }

    public String getIdHash() {
        return idHash;
    }

    public void setIdHash(String idHash) {
        this.idHash = idHash;
    }

    public String getIdLast4() {
        return idLast4;
    }

    public void setIdLast4(String idLast4) {
        this.idLast4 = idLast4;
    }

    public boolean isIdVerified() {
        return idVerified;
    }

    public void setIdVerified(boolean idVerified) {
        this.idVerified = idVerified;
    }

    public Long getBirthCertDocId() {
        return birthCertDocId;
    }

    public void setBirthCertDocId(Long birthCertDocId) {
        this.birthCertDocId = birthCertDocId;
    }

    public boolean isNeedsAadhaar() {
        return needsAadhaar;
    }

    public void setNeedsAadhaar(boolean needsAadhaar) {
        this.needsAadhaar = needsAadhaar;
    }

    public boolean isDisabled() {
        return disabled;
    }

    public void setDisabled(boolean disabled) {
        this.disabled = disabled;
    }

    public boolean isStudent() {
        return student;
    }

    public void setStudent(boolean student) {
        this.student = student;
    }

    public boolean isWidowed() {
        return widowed;
    }

    public void setWidowed(boolean widowed) {
        this.widowed = widowed;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

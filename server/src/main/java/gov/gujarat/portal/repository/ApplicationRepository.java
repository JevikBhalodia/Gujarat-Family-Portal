package gov.gujarat.portal.repository;

import gov.gujarat.portal.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByFamilyIdOrderByCreatedAtDesc(Long familyId);
    List<Application> findByFamilyIdAndStatusOrderByCreatedAtDesc(Long familyId, String status);
    Optional<Application> findByFamilyIdAndSchemeIdAndStatus(Long familyId, Long schemeId, String status);
    List<Application> findByFamilyId(Long familyId);

    @Modifying
    @Query("UPDATE Application a SET a.status = 'expired', a.expiredReason = 'validity_ended', a.expiredAt = :now WHERE a.status = 'active' AND a.endDate IS NOT NULL AND a.endDate < :today")
    int expireOutdatedApplications(@Param("today") LocalDate today, @Param("now") LocalDateTime now);

    @Query("SELECT a FROM Application a JOIN Scheme s ON a.schemeId = s.id WHERE a.familyId = :familyId AND s.departmentId = :departmentId ORDER BY a.createdAt DESC")
    List<Application> findByFamilyIdAndDepartmentId(@Param("familyId") Long familyId, @Param("departmentId") Long departmentId);

    @Query("SELECT a FROM Application a JOIN Scheme s ON a.schemeId = s.id WHERE s.departmentId = :deptId")
    List<Application> findAllByDepartmentId(@Param("deptId") Long deptId);
}

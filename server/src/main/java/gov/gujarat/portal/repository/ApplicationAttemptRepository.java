package gov.gujarat.portal.repository;

import gov.gujarat.portal.entity.ApplicationAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationAttemptRepository extends JpaRepository<ApplicationAttempt, Long> {
    List<ApplicationAttempt> findTop20ByFamilyIdOrderByCreatedAtDesc(Long familyId);

    @Query("SELECT aa FROM ApplicationAttempt aa JOIN Scheme s ON aa.schemeId = s.id WHERE s.departmentId = :deptId AND aa.passed = false")
    List<ApplicationAttempt> findFailedAttemptsByDepartmentId(@Param("deptId") Long deptId);
}

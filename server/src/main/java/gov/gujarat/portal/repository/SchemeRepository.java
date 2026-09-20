package gov.gujarat.portal.repository;

import gov.gujarat.portal.entity.Scheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SchemeRepository extends JpaRepository<Scheme, Long> {
    List<Scheme> findByActiveTrue();

    @Query("SELECT s FROM Scheme s WHERE s.active = true AND (s.deadline IS NULL OR s.deadline >= :today) ORDER BY s.id ASC")
    List<Scheme> findAvailableSchemes(@Param("today") LocalDate today);

    List<Scheme> findByDepartmentIdAndActiveTrue(Long departmentId);
}

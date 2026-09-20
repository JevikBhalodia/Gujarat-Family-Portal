package gov.gujarat.portal.repository;

import gov.gujarat.portal.entity.QueryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QueryRepository extends JpaRepository<QueryEntity, Long> {
    List<QueryEntity> findByFamilyIdOrderByCreatedAtDesc(Long familyId);
    List<QueryEntity> findByDepartmentIdAndStatusOrderByCreatedAtDesc(Long departmentId, String status);
    Optional<QueryEntity> findByIdAndDepartmentId(Long id, Long departmentId);
}

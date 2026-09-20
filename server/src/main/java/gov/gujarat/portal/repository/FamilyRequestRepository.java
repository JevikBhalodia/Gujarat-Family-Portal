package gov.gujarat.portal.repository;

import gov.gujarat.portal.entity.FamilyRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FamilyRequestRepository extends JpaRepository<FamilyRequest, Long> {
    List<FamilyRequest> findByToFamilyIdAndStatus(Long toFamilyId, String status);
    Optional<FamilyRequest> findByIdAndToFamilyIdAndStatus(Long id, Long toFamilyId, String status);
}

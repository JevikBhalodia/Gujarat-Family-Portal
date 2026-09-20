package gov.gujarat.portal.repository;

import gov.gujarat.portal.entity.FamilyEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FamilyEventRepository extends JpaRepository<FamilyEvent, Long> {
    List<FamilyEvent> findTop20ByFamilyIdOrderByCreatedAtDesc(Long familyId);
}

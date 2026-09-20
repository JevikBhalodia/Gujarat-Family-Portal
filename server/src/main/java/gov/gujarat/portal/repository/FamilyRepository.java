package gov.gujarat.portal.repository;

import gov.gujarat.portal.entity.Family;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FamilyRepository extends JpaRepository<Family, Long> {
    Optional<Family> findByFamilyCodeIgnoreCase(String familyCode);
    boolean existsByFamilyCode(String familyCode);
}

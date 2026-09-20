package gov.gujarat.portal.repository;

import gov.gujarat.portal.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByFamilyIdAndStatus(Long familyId, String status);
    List<Member> findByFamilyIdAndStatusNot(Long familyId, String status);
    List<Member> findByFamilyId(Long familyId);
    List<Member> findByStatus(String status);
    Optional<Member> findByUserIdAndStatus(Long userId, String status);
    Optional<Member> findByUserIdAndStatusIn(Long userId, List<String> statuses);
    Optional<Member> findByIdAndFamilyIdAndStatus(Long id, Long familyId, String status);
    Optional<Member> findByIdAndFamilyId(Long id, Long familyId);
    Optional<Member> findByFamilyIdAndFamilyRoleAndStatus(Long familyId, String familyRole, String status);

    @Query("SELECT m FROM Member m WHERE m.familyId = :familyId AND m.status != 'removed' ORDER BY CASE WHEN m.familyRole = 'head' THEN 0 ELSE 1 END, m.createdAt ASC")
    List<Member> findActiveFamilyMembersOrdered(@Param("familyId") Long familyId);
}

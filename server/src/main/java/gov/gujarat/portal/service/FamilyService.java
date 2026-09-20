package gov.gujarat.portal.service;

import gov.gujarat.portal.entity.*;
import gov.gujarat.portal.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.*;

@Service
public class FamilyService {

    private final FamilyRepository familyRepository;
    private final MemberRepository memberRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final FamilyRequestRepository requestRepository;
    private final FamilyEventRepository eventRepository;
    private final VerifierService verifierService;
    private final AuditService auditService;

    public FamilyService(
            FamilyRepository familyRepository,
            MemberRepository memberRepository,
            UserRepository userRepository,
            DocumentRepository documentRepository,
            FamilyRequestRepository requestRepository,
            FamilyEventRepository eventRepository,
            VerifierService verifierService,
            AuditService auditService
    ) {
        this.familyRepository = familyRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.requestRepository = requestRepository;
        this.eventRepository = eventRepository;
        this.verifierService = verifierService;
        this.auditService = auditService;
    }

    public String generateFamilyCode(String district) {
        String prefix = (district != null && district.length() >= 3) ? district.substring(0, 3).toUpperCase() : "GEN";
        Random random = new Random();
        String code;
        do {
            int digits = 10000 + random.nextInt(90000);
            code = String.format("GJ-%s-%d", prefix, digits);
        } while (familyRepository.existsByFamilyCode(code));
        return code;
    }

    public static class CreateFamilyResult {
        public Family family;
        public Member headMember;

        public CreateFamilyResult(Family family, Member headMember) {
            this.family = family;
            this.headMember = headMember;
        }
    }

    @Transactional
    public CreateFamilyResult createFamily(
            Long creatorUserId,
            String district,
            BigDecimal incomeAnnual,
            String rationCardRef,
            String headName,
            LocalDate headDob,
            String headGender,
            String aadhaarNo
    ) {
        Optional<Member> existing = memberRepository.findByUserIdAndStatusIn(creatorUserId, List.of("active", "pending"));
        if (existing.isPresent()) {
            throw new IllegalArgumentException("User is already associated with an active or pending family.");
        }

        VerifierService.IdVerificationResult idVer = verifierService.verifyId("aadhaar", aadhaarNo, headName, headDob);
        if (!idVer.verified) {
            throw new IllegalArgumentException(idVer.error != null ? idVer.error : "Aadhaar verification failed for family head.");
        }

        String familyCode = generateFamilyCode(district);

        Family family = new Family();
        family.setFamilyCode(familyCode);
        family.setDistrict(district);
        family.setIncomeAnnual(incomeAnnual != null ? incomeAnnual : BigDecimal.ZERO);
        family.setRationCardRef(rationCardRef);
        family = familyRepository.save(family);

        Member headMember = new Member();
        headMember.setFamilyId(family.getId());
        headMember.setUserId(creatorUserId);
        headMember.setName(headName);
        headMember.setDob(headDob);
        headMember.setGender(headGender);
        headMember.setRelationToHead("Self");
        headMember.setFamilyRole("head");
        headMember.setAccess("apply");
        headMember.setStatus("active");
        headMember.setIdType("aadhaar");
        headMember.setIdHash(idVer.idHash);
        headMember.setIdLast4(idVer.idLast4);
        headMember.setIdVerified(true);
        headMember = memberRepository.save(headMember);

        // Update user's memberId
        Optional<User> userOpt = userRepository.findById(creatorUserId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setMemberId(headMember.getId());
            userRepository.save(user);
        }

        // Family event & audit
        FamilyEvent event = new FamilyEvent(family.getId(), "create", headMember.getId(), creatorUserId, "Family created by Head");
        eventRepository.save(event);

        auditService.logAudit(creatorUserId, "FAMILY_CREATED", "family", family.getId());

        return new CreateFamilyResult(family, headMember);
    }

    public Map<String, Object> getFamilyDetails(Long familyId) {
        Optional<Family> familyOpt = familyRepository.findById(familyId);
        if (familyOpt.isEmpty()) return null;

        List<Member> members = memberRepository.findActiveFamilyMembersOrdered(familyId);
        List<FamilyRequest> pendingRequests = requestRepository.findByToFamilyIdAndStatus(familyId, "pending");
        List<FamilyEvent> recentEvents = eventRepository.findTop20ByFamilyIdOrderByCreatedAtDesc(familyId);

        Map<String, Object> res = new HashMap<>();
        res.put("family", familyOpt.get());
        res.put("members", members);
        res.put("pendingRequests", pendingRequests);
        res.put("recentEvents", recentEvents);
        return res;
    }

    @Transactional
    public Member addMember(
            Long familyId,
            Long actorUserId,
            String name,
            LocalDate dob,
            String gender,
            String relationToHead,
            String idNumber,
            String certNumber,
            String certFileUrl,
            boolean isDisabled,
            boolean isStudent,
            boolean isWidowed
    ) {
        LocalDate today = LocalDate.now();
        int age = Period.between(dob, today).getYears();
        boolean isChild = age < 18;

        String idHash;
        String idLast4;
        Long birthCertDocId = null;
        String idType;

        if (isChild) {
            idType = "birth_cert";
            if (certNumber == null || certNumber.isBlank()) {
                throw new IllegalArgumentException("Birth Certificate registration number is mandatory for children under 18.");
            }

            VerifierService.DocVerificationResult docVer = verifierService.verifyDocument(
                    "birth_cert", certNumber, name, dob, name, dob
            );
            if (!docVer.verified) {
                throw new IllegalArgumentException("Birth certificate verification failed: " + docVer.error);
            }

            idHash = verifierService.hashIdentity(certNumber);
            idLast4 = certNumber.length() >= 4 ? certNumber.substring(certNumber.length() - 4) : certNumber;

            Document doc = new Document();
            doc.setFamilyId(familyId);
            doc.setType("birth_cert");
            doc.setDocNumber(certNumber.trim());
            doc.setIssuedOn(dob);
            doc.setFileUrl(certFileUrl != null && !certFileUrl.isBlank() ? certFileUrl : "/uploads/default_birth_cert.pdf");
            doc.setVerified(true);
            doc = documentRepository.save(doc);
            birthCertDocId = doc.getId();
        } else {
            idType = "aadhaar";
            if (idNumber == null || idNumber.isBlank()) {
                throw new IllegalArgumentException("Aadhaar number is mandatory for adult members (18+).");
            }
            VerifierService.IdVerificationResult idVer = verifierService.verifyId("aadhaar", idNumber, name, dob);
            if (!idVer.verified) {
                throw new IllegalArgumentException("Aadhaar verification failed: " + idVer.error);
            }
            idHash = idVer.idHash;
            idLast4 = idVer.idLast4;
        }

        Member member = new Member();
        member.setFamilyId(familyId);
        member.setUserId(null); // child or unlinked adult member
        member.setName(name);
        member.setDob(dob);
        member.setGender(gender);
        member.setRelationToHead(relationToHead);
        member.setFamilyRole("member");
        member.setAccess("view");
        member.setStatus("active");
        member.setIdType(idType);
        member.setIdHash(idHash);
        member.setIdLast4(idLast4);
        member.setIdVerified(true);
        member.setBirthCertDocId(birthCertDocId);
        member.setNeedsAadhaar(false);
        member.setDisabled(isDisabled);
        member.setStudent(isStudent);
        member.setWidowed(isWidowed);

        member = memberRepository.save(member);

        if (birthCertDocId != null) {
            Optional<Document> docOpt = documentRepository.findById(birthCertDocId);
            if (docOpt.isPresent()) {
                Document doc = docOpt.get();
                doc.setMemberId(member.getId());
                documentRepository.save(doc);
            }
        }

        FamilyEvent event = new FamilyEvent(familyId, "add", member.getId(), actorUserId,
                String.format("Added member %s (%s)", name, relationToHead));
        eventRepository.save(event);

        auditService.logAudit(actorUserId, "MEMBER_ADDED", "members", member.getId());

        return member;
    }

    @Transactional
    public Member updateMember(
            Long memberId,
            Long familyId,
            Long actorUserId,
            String access,
            Boolean isDisabled,
            Boolean isStudent,
            Boolean isWidowed
    ) {
        Member member = memberRepository.findByIdAndFamilyId(memberId, familyId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in family."));

        if (access != null && !access.isBlank()) member.setAccess(access);
        if (isDisabled != null) member.setDisabled(isDisabled);
        if (isStudent != null) member.setStudent(isStudent);
        if (isWidowed != null) member.setWidowed(isWidowed);

        member = memberRepository.save(member);

        auditService.logAudit(actorUserId, "MEMBER_UPDATED", "members", memberId);

        return member;
    }

    @Transactional
    public void removeMember(Long memberId, Long familyId, Long actorUserId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("A removal reason (death, marriage, divorce, other) is mandatory.");
        }

        Member member = memberRepository.findByIdAndFamilyId(memberId, familyId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found."));

        if ("head".equalsIgnoreCase(member.getFamilyRole())) {
            throw new IllegalArgumentException("The Family Head cannot be removed. You must transfer the head role to another verified adult member first.");
        }

        member.setStatus("removed");
        member.setRemovalReason(reason);
        memberRepository.save(member);

        FamilyEvent event = new FamilyEvent(familyId, "remove", memberId, actorUserId, "Removed member (" + reason + ")");
        eventRepository.save(event);

        auditService.logAudit(actorUserId, "MEMBER_REMOVED", "members", memberId);
    }

    @Transactional
    public void changeHead(Long familyId, Long currentHeadId, Long newHeadMemberId, Long actorUserId) {
        Member candidate = memberRepository.findByIdAndFamilyIdAndStatus(newHeadMemberId, familyId, "active")
                .orElseThrow(() -> new IllegalArgumentException("Candidate member not found."));

        int age = Period.between(candidate.getDob(), LocalDate.now()).getYears();
        if (age < 18) {
            throw new IllegalArgumentException("Only an adult (18+) can become Family Head.");
        }
        if (!candidate.isIdVerified()) {
            throw new IllegalArgumentException("Candidate member must have verified identity.");
        }

        // Demote current head
        Optional<Member> currentHeadOpt = memberRepository.findById(currentHeadId);
        if (currentHeadOpt.isPresent()) {
            Member currentHead = currentHeadOpt.get();
            currentHead.setFamilyRole("member");
            memberRepository.save(currentHead);
        }

        // Promote new head
        candidate.setFamilyRole("head");
        candidate.setAccess("apply");
        memberRepository.save(candidate);

        FamilyEvent event = new FamilyEvent(familyId, "change_head", newHeadMemberId, actorUserId, "Family head transferred");
        eventRepository.save(event);

        auditService.logAudit(actorUserId, "HEAD_TRANSFERRED", "families", familyId);
    }
}

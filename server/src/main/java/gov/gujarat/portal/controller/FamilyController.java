package gov.gujarat.portal.controller;

import gov.gujarat.portal.entity.*;
import gov.gujarat.portal.repository.FamilyRepository;
import gov.gujarat.portal.repository.FamilyRequestRepository;
import gov.gujarat.portal.repository.MemberRepository;
import gov.gujarat.portal.security.UserPrincipal;
import gov.gujarat.portal.service.FamilyService;
import gov.gujarat.portal.service.VerifierService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.Period;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
public class FamilyController {

    private final FamilyService familyService;
    private final FamilyRepository familyRepository;
    private final MemberRepository memberRepository;
    private final FamilyRequestRepository requestRepository;
    private final VerifierService verifierService;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    public FamilyController(
            FamilyService familyService,
            FamilyRepository familyRepository,
            MemberRepository memberRepository,
            FamilyRequestRepository requestRepository,
            VerifierService verifierService
    ) {
        this.familyService = familyService;
        this.familyRepository = familyRepository;
        this.memberRepository = memberRepository;
        this.requestRepository = requestRepository;
        this.verifierService = verifierService;
    }

    public static class CreateFamilyRequest {
        public String district;
        public BigDecimal income_annual;
        public String ration_card_ref;
        public String head_name;
        public String head_dob;
        public String head_gender;
        public String aadhaar_no;
    }

    @PostMapping("/families")
    public ResponseEntity<?> createFamily(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateFamilyRequest req
    ) {
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        if (req == null || req.district == null || req.head_name == null || req.head_dob == null || req.head_gender == null || req.aadhaar_no == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "District, Head Name, DOB, Gender, and Aadhaar are required."));
        }

        try {
            LocalDate dob = LocalDate.parse(req.head_dob);
            FamilyService.CreateFamilyResult res = familyService.createFamily(
                    principal.getUserId(),
                    req.district,
                    req.income_annual,
                    req.ration_card_ref,
                    req.head_name,
                    dob,
                    req.head_gender,
                    req.aadhaar_no
            );

            return ResponseEntity.status(201).body(Map.of(
                    "success", true,
                    "message", "Family created successfully with you as Family Head.",
                    "family", res.family,
                    "headMember", res.headMember
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/families/me")
    public ResponseEntity<?> getMyFamily(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getFamilyId() == null) {
            return ResponseEntity.status(404).body(Map.of("error", "You are not associated with any family."));
        }

        Map<String, Object> details = familyService.getFamilyDetails(principal.getFamilyId());
        return ResponseEntity.ok(details);
    }

    public static class JoinFamilyRequest {
        public String family_code;
        public String name;
        public String dob;
        public String gender;
        public String relation_to_head;
        public String aadhaar_no;
    }

    @PostMapping("/families/join-request")
    public ResponseEntity<?> submitJoinRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody JoinFamilyRequest req
    ) {
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        if (req == null || req.family_code == null || req.name == null || req.dob == null || req.gender == null || req.aadhaar_no == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Family code, name, DOB, gender, and Aadhaar are required."));
        }

        Optional<Family> famOpt = familyRepository.findByFamilyCodeIgnoreCase(req.family_code.trim());
        if (famOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Family not found with provided code."));
        }

        Family targetFamily = famOpt.get();
        String idHash = verifierService.hashIdentity(req.aadhaar_no);
        String idLast4 = req.aadhaar_no.length() >= 4 ? req.aadhaar_no.substring(req.aadhaar_no.length() - 4) : req.aadhaar_no;

        Member pendingMember = new Member();
        pendingMember.setFamilyId(targetFamily.getId());
        pendingMember.setUserId(principal.getUserId());
        pendingMember.setName(req.name);
        pendingMember.setDob(LocalDate.parse(req.dob));
        pendingMember.setGender(req.gender);
        pendingMember.setRelationToHead(req.relation_to_head != null ? req.relation_to_head : "Member");
        pendingMember.setFamilyRole("member");
        pendingMember.setAccess("view");
        pendingMember.setStatus("pending");
        pendingMember.setIdType("aadhaar");
        pendingMember.setIdHash(idHash);
        pendingMember.setIdLast4(idLast4);
        pendingMember.setIdVerified(true);
        pendingMember = memberRepository.save(pendingMember);

        FamilyRequest fReq = new FamilyRequest();
        fReq.setType("join");
        fReq.setMemberId(pendingMember.getId());
        fReq.setToFamilyId(targetFamily.getId());
        fReq.setStatus("pending");
        fReq = requestRepository.save(fReq);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Join request submitted to family head.",
                "request", fReq
        ));
    }

    @PostMapping("/family/requests/{id}/approve")
    public ResponseEntity<?> approveRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        if (principal == null || !principal.isHead()) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: Only the family head can approve requests."));
        }

        Optional<FamilyRequest> reqOpt = requestRepository.findByIdAndToFamilyIdAndStatus(id, principal.getFamilyId(), "pending");
        if (reqOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Pending request not found."));
        }

        String access = body != null && body.containsKey("access") ? body.get("access") : "view";
        FamilyRequest fReq = reqOpt.get();

        Optional<Member> memOpt = memberRepository.findById(fReq.getMemberId());
        if (memOpt.isPresent()) {
            Member m = memOpt.get();
            m.setStatus("active");
            m.setAccess(access);
            memberRepository.save(m);
        }

        fReq.setStatus("approved");
        fReq.setDecidedBy(principal.getMemberId());
        requestRepository.save(fReq);

        return ResponseEntity.ok(Map.of("success", true, "message", "Request approved successfully."));
    }

    @PostMapping("/family/requests/{id}/reject")
    public ResponseEntity<?> rejectRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        if (principal == null || !principal.isHead()) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: Only the family head can reject requests."));
        }

        Optional<FamilyRequest> reqOpt = requestRepository.findByIdAndToFamilyIdAndStatus(id, principal.getFamilyId(), "pending");
        if (reqOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Pending request not found."));
        }

        FamilyRequest fReq = reqOpt.get();
        fReq.setStatus("rejected");
        fReq.setDecidedBy(principal.getMemberId());
        requestRepository.save(fReq);

        Optional<Member> memOpt = memberRepository.findById(fReq.getMemberId());
        if (memOpt.isPresent()) {
            Member m = memOpt.get();
            m.setStatus("removed");
            m.setRemovalReason("Request rejected by head");
            memberRepository.save(m);
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Request rejected."));
    }

    @PostMapping("/family/members")
    public ResponseEntity<?> addMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("name") String name,
            @RequestParam("dob") String dobStr,
            @RequestParam("gender") String gender,
            @RequestParam("relation_to_head") String relationToHead,
            @RequestParam(value = "id_number", required = false) String idNumber,
            @RequestParam(value = "cert_number", required = false) String certNumber,
            @RequestParam(value = "is_disabled", required = false, defaultValue = "false") boolean isDisabled,
            @RequestParam(value = "is_student", required = false, defaultValue = "false") boolean isStudent,
            @RequestParam(value = "is_widowed", required = false, defaultValue = "false") boolean isWidowed,
            @RequestParam(value = "birth_cert_file", required = false) MultipartFile birthCertFile
    ) {
        if (principal == null || !principal.isHead()) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: Only the family head can add members."));
        }

        if (name == null || dobStr == null || gender == null || relationToHead == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name, DOB, Gender, and Relation to Head are required."));
        }

        try {
            LocalDate dob = LocalDate.parse(dobStr);
            int age = Period.between(dob, LocalDate.now()).getYears();

            String certFileUrl = null;
            if (birthCertFile != null && !birthCertFile.isEmpty()) {
                File dir = new File(uploadDir);
                if (!dir.exists()) dir.mkdirs();

                String ext = "";
                String orig = birthCertFile.getOriginalFilename();
                if (orig != null && orig.contains(".")) {
                    ext = orig.substring(orig.lastIndexOf("."));
                }
                String fileName = "birth_cert_" + UUID.randomUUID() + ext;
                Path target = Paths.get(uploadDir, fileName);
                Files.write(target, birthCertFile.getBytes());
                certFileUrl = "/uploads/" + fileName;
            }

            Member member = familyService.addMember(
                    principal.getFamilyId(),
                    principal.getUserId(),
                    name,
                    dob,
                    gender,
                    relationToHead,
                    idNumber,
                    certNumber,
                    certFileUrl,
                    isDisabled,
                    isStudent,
                    isWidowed
            );

            return ResponseEntity.status(201).body(Map.of(
                    "success", true,
                    "message", age < 18 ? "Child member added with verified birth certificate." : "Adult member added successfully.",
                    "member", member
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class UpdateMemberRequest {
        public String access;
        public Boolean is_disabled;
        public Boolean is_student;
        public Boolean is_widowed;
    }

    @PatchMapping("/family/members/{id}")
    public ResponseEntity<?> updateMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody UpdateMemberRequest req
    ) {
        if (principal == null || !principal.isHead()) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: Only the family head can update members."));
        }

        try {
            Member updated = familyService.updateMember(
                    id,
                    principal.getFamilyId(),
                    principal.getUserId(),
                    req.access,
                    req.is_disabled,
                    req.is_student,
                    req.is_widowed
            );
            return ResponseEntity.ok(Map.of("success", true, "member", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class RemoveMemberRequest {
        public String reason;
    }

    @DeleteMapping("/family/members/{id}")
    public ResponseEntity<?> removeMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody RemoveMemberRequest req
    ) {
        if (principal == null || !principal.isHead()) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: Only the family head can remove members."));
        }

        try {
            familyService.removeMember(id, principal.getFamilyId(), principal.getUserId(), req != null ? req.reason : null);
            return ResponseEntity.ok(Map.of("success", true, "message", "Member removed successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class ChangeHeadRequest {
        public Long member_id;
    }

    @PostMapping("/family/change-head")
    public ResponseEntity<?> changeHead(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody ChangeHeadRequest req
    ) {
        if (principal == null || !principal.isHead()) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: Only the family head can transfer ownership."));
        }
        if (req == null || req.member_id == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Target new Head member ID is required."));
        }

        try {
            familyService.changeHead(principal.getFamilyId(), principal.getMemberId(), req.member_id, principal.getUserId());
            return ResponseEntity.ok(Map.of("success", true, "message", "Family head role successfully transferred."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

package gov.gujarat.portal.controller;

import gov.gujarat.portal.entity.Department;
import gov.gujarat.portal.entity.Member;
import gov.gujarat.portal.repository.DepartmentRepository;
import gov.gujarat.portal.repository.MemberRepository;
import gov.gujarat.portal.security.UserPrincipal;
import gov.gujarat.portal.service.VerifierService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/me")
public class MeController {

    private final DepartmentRepository departmentRepository;
    private final MemberRepository memberRepository;
    private final VerifierService verifierService;

    public MeController(
            DepartmentRepository departmentRepository,
            MemberRepository memberRepository,
            VerifierService verifierService
    ) {
        this.departmentRepository = departmentRepository;
        this.memberRepository = memberRepository;
        this.verifierService = verifierService;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        Department department = null;
        if (principal.getDepartmentId() != null) {
            department = departmentRepository.findById(principal.getDepartmentId()).orElse(null);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("user", principal.getUser());
        response.put("member", principal.getMember());
        response.put("family", principal.getFamily());
        response.put("department", department);

        return ResponseEntity.ok(response);
    }

    public static class VerifyIdRequest {
        public String aadhaar_number;
    }

    @PostMapping("/verify-id")
    public ResponseEntity<?> verifyId(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody VerifyIdRequest request
    ) {
        if (principal == null || principal.getMember() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "You must belong to an active family to verify identity."));
        }

        if (request == null || request.aadhaar_number == null || request.aadhaar_number.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Aadhaar number is required."));
        }

        VerifierService.IdVerificationResult result = verifierService.verifyId(
                "aadhaar", request.aadhaar_number, principal.getMember().getName(), principal.getMember().getDob()
        );

        if (!result.verified) {
            return ResponseEntity.badRequest().body(Map.of("error", result.error));
        }

        Member member = memberRepository.findById(principal.getMemberId()).orElse(null);
        if (member != null) {
            member.setIdVerified(true);
            member.setIdHash(result.idHash);
            member.setIdLast4(result.idLast4);
            member.setIdType("aadhaar");
            memberRepository.save(member);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Identity verified successfully via UIDAI stub.",
                "idLast4", result.idLast4
        ));
    }
}

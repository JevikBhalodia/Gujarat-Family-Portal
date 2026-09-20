package gov.gujarat.portal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import gov.gujarat.portal.entity.*;
import gov.gujarat.portal.repository.*;
import gov.gujarat.portal.security.UserPrincipal;
import gov.gujarat.portal.service.ApplicationPipelineService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class ApplicationController {

    private final ApplicationPipelineService pipelineService;
    private final ApplicationRepository applicationRepository;
    private final ApplicationAttemptRepository attemptRepository;
    private final SchemeRepository schemeRepository;
    private final DepartmentRepository departmentRepository;
    private final MemberRepository memberRepository;
    private final ObjectMapper objectMapper;

    public ApplicationController(
            ApplicationPipelineService pipelineService,
            ApplicationRepository applicationRepository,
            ApplicationAttemptRepository attemptRepository,
            SchemeRepository schemeRepository,
            DepartmentRepository departmentRepository,
            MemberRepository memberRepository,
            ObjectMapper objectMapper
    ) {
        this.pipelineService = pipelineService;
        this.applicationRepository = applicationRepository;
        this.attemptRepository = attemptRepository;
        this.schemeRepository = schemeRepository;
        this.departmentRepository = departmentRepository;
        this.memberRepository = memberRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/schemes/{id}/apply")
    public ResponseEntity<?> applyForScheme(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        if (principal == null || principal.getFamilyId() == null) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: You must belong to an active family."));
        }

        if (!principal.canApply()) {
            return ResponseEntity.status(403).body(Map.of("error",
                    "Forbidden: You have 'view' only access. Applying requires 'apply' permission granted by your family head."));
        }

        try {
            ApplicationPipelineService.ApplyResult result = pipelineService.applyForScheme(
                    principal.getFamilyId(), id, principal.getMemberId()
            );

            if (!result.ok) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Application checklist failed. Please review the requirements below.",
                        "checks", result.checks
                ));
            }

            return ResponseEntity.status(201).body(Map.of(
                    "success", true,
                    "message", "Application successfully verified and enrolled!",
                    "applicationId", result.applicationId,
                    "checks", result.checks
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/applications")
    public ResponseEntity<?> getApplications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "status", required = false) String status
    ) {
        if (principal == null || principal.getFamilyId() == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Family context missing."));
        }

        pipelineService.runExpireOnRead();

        List<Application> apps = (status != null && !status.isBlank())
                ? applicationRepository.findByFamilyIdAndStatusOrderByCreatedAtDesc(principal.getFamilyId(), status)
                : applicationRepository.findByFamilyIdOrderByCreatedAtDesc(principal.getFamilyId());

        List<Map<String, Object>> response = new ArrayList<>();

        for (Application app : apps) {
            Optional<Scheme> schemeOpt = schemeRepository.findById(app.getSchemeId());
            String schemeName = "";
            String schemeCategory = "";
            String schemeType = "";
            String departmentName = "";

            if (schemeOpt.isPresent()) {
                Scheme s = schemeOpt.get();
                schemeName = s.getName();
                schemeCategory = s.getCategory();
                schemeType = s.getType();
                if (s.getDepartmentId() != null) {
                    Optional<Department> d = departmentRepository.findById(s.getDepartmentId());
                    if (d.isPresent()) departmentName = d.get().getName();
                }
            }

            String appliedByName = "";
            if (app.getAppliedByMemberId() != null) {
                Optional<Member> m = memberRepository.findById(app.getAppliedByMemberId());
                if (m.isPresent()) appliedByName = m.get().getName();
            }

            int benefitProgress = 0;
            if (app.getBenefitTotal() != null && app.getBenefitTotal() > 0 && app.getBenefitUsed() != null) {
                benefitProgress = (int) Math.min(100, Math.round(((double) app.getBenefitUsed() / app.getBenefitTotal()) * 100));
            }

            Map<String, Object> item = new HashMap<>();
            item.put("id", app.getId());
            item.put("family_id", app.getFamilyId());
            item.put("scheme_id", app.getSchemeId());
            item.put("applied_by_member_id", app.getAppliedByMemberId());
            item.put("status", app.getStatus());
            item.put("start_date", app.getStartDate());
            item.put("end_date", app.getEndDate());
            item.put("benefit_total", app.getBenefitTotal());
            item.put("benefit_used", app.getBenefitUsed());
            item.put("expired_reason", app.getExpiredReason());
            item.put("revoke_reason", app.getRevokeReason());
            item.put("created_at", app.getCreatedAt());
            item.put("scheme_name", schemeName);
            item.put("scheme_category", schemeCategory);
            item.put("scheme_type", schemeType);
            item.put("department_name", departmentName);
            item.put("applied_by_name", appliedByName);
            item.put("benefit_progress", benefitProgress);
            try {
                item.put("facts_snapshot", objectMapper.readTree(app.getFactsSnapshot() != null ? app.getFactsSnapshot() : "{}"));
            } catch (Exception e) {
                item.put("facts_snapshot", Collections.emptyMap());
            }

            response.add(item);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/applications/attempts")
    public ResponseEntity<?> getApplicationAttempts(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getFamilyId() == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Family context missing."));
        }

        List<ApplicationAttempt> attempts = attemptRepository.findTop20ByFamilyIdOrderByCreatedAtDesc(principal.getFamilyId());
        List<Map<String, Object>> response = new ArrayList<>();

        for (ApplicationAttempt att : attempts) {
            String schemeName = "";
            Optional<Scheme> s = schemeRepository.findById(att.getSchemeId());
            if (s.isPresent()) schemeName = s.get().getName();

            String memberName = "";
            Optional<Member> m = memberRepository.findById(att.getMemberId());
            if (m.isPresent()) memberName = m.get().getName();

            Map<String, Object> item = new HashMap<>();
            item.put("id", att.getId());
            item.put("family_id", att.getFamilyId());
            item.put("scheme_id", att.getSchemeId());
            item.put("member_id", att.getMemberId());
            item.put("passed", att.isPassed());
            item.put("created_at", att.getCreatedAt());
            item.put("scheme_name", schemeName);
            item.put("member_name", memberName);
            try {
                item.put("checks", objectMapper.readTree(att.getChecksJson() != null ? att.getChecksJson() : "[]"));
            } catch (Exception e) {
                item.put("checks", Collections.emptyList());
            }

            response.add(item);
        }

        return ResponseEntity.ok(response);
    }
}

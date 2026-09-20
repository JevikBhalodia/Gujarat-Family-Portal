package gov.gujarat.portal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import gov.gujarat.portal.entity.*;
import gov.gujarat.portal.repository.*;
import gov.gujarat.portal.security.UserPrincipal;
import gov.gujarat.portal.service.AnalyticsService;
import gov.gujarat.portal.service.AuditService;
import gov.gujarat.portal.service.QueryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AnalyticsService analyticsService;
    private final QueryService queryService;
    private final AuditService auditService;
    private final FamilyRepository familyRepository;
    private final MemberRepository memberRepository;
    private final ApplicationRepository applicationRepository;
    private final SchemeRepository schemeRepository;
    private final QueryRepository queryRepository;
    private final ObjectMapper objectMapper;

    public AdminController(
            AnalyticsService analyticsService,
            QueryService queryService,
            AuditService auditService,
            FamilyRepository familyRepository,
            MemberRepository memberRepository,
            ApplicationRepository applicationRepository,
            SchemeRepository schemeRepository,
            QueryRepository queryRepository,
            ObjectMapper objectMapper
    ) {
        this.analyticsService = analyticsService;
        this.queryService = queryService;
        this.auditService = auditService;
        this.familyRepository = familyRepository;
        this.memberRepository = memberRepository;
        this.applicationRepository = applicationRepository;
        this.schemeRepository = schemeRepository;
        this.queryRepository = queryRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/analytics/summary")
    public ResponseEntity<?> getSummary(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "scheme_id", required = false) Long schemeId,
            @RequestParam(value = "district", required = false) String district
    ) {
        Long deptId = principal.getDepartmentId() != null ? principal.getDepartmentId() : 1L;
        return ResponseEntity.ok(analyticsService.getSummary(deptId, schemeId, district));
    }

    @GetMapping("/analytics/by-district")
    public ResponseEntity<?> getByDistrict(@AuthenticationPrincipal UserPrincipal principal) {
        Long deptId = principal.getDepartmentId() != null ? principal.getDepartmentId() : 1L;
        return ResponseEntity.ok(analyticsService.getByDistrict(deptId));
    }

    @GetMapping("/analytics/failed-checks")
    public ResponseEntity<?> getFailedChecks(@AuthenticationPrincipal UserPrincipal principal) {
        Long deptId = principal.getDepartmentId() != null ? principal.getDepartmentId() : 1L;
        return ResponseEntity.ok(analyticsService.getTopFailedChecks(deptId));
    }

    @GetMapping("/analytics/awareness-gap")
    public ResponseEntity<?> getAwarenessGap(@AuthenticationPrincipal UserPrincipal principal) {
        Long deptId = principal.getDepartmentId() != null ? principal.getDepartmentId() : 1L;
        return ResponseEntity.ok(analyticsService.getAwarenessGap(deptId));
    }

    @GetMapping("/analytics/schemes-breakdown")
    public ResponseEntity<?> getSchemesBreakdown(@AuthenticationPrincipal UserPrincipal principal) {
        Long deptId = principal.getDepartmentId() != null ? principal.getDepartmentId() : 1L;
        return ResponseEntity.ok(analyticsService.getActiveVsExpiredPerScheme(deptId));
    }

    @GetMapping("/families/{code}/applications")
    public ResponseEntity<?> lookupFamily(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String code
    ) {
        String cleanCode = code.trim().toUpperCase();
        Optional<Family> famOpt = familyRepository.findByFamilyCodeIgnoreCase(cleanCode);
        if (famOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", String.format("Family with code '%s' not found.", cleanCode)));
        }

        Family family = famOpt.get();
        List<Member> members = memberRepository.findByFamilyIdAndStatus(family.getId(), "active");

        Long deptId = principal.getDepartmentId() != null ? principal.getDepartmentId() : 1L;
        List<Application> apps = applicationRepository.findByFamilyIdAndDepartmentId(family.getId(), deptId);

        List<Map<String, Object>> formattedApps = new ArrayList<>();
        for (Application a : apps) {
            String schemeName = "";
            String schemeCategory = "";
            String schemeType = "";
            Optional<Scheme> s = schemeRepository.findById(a.getSchemeId());
            if (s.isPresent()) {
                schemeName = s.get().getName();
                schemeCategory = s.get().getCategory();
                schemeType = s.get().getType();
            }

            String appliedByName = "";
            if (a.getAppliedByMemberId() != null) {
                Optional<Member> m = memberRepository.findById(a.getAppliedByMemberId());
                if (m.isPresent()) appliedByName = m.get().getName();
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("family_id", a.getFamilyId());
            map.put("scheme_id", a.getSchemeId());
            map.put("scheme_name", schemeName);
            map.put("scheme_category", schemeCategory);
            map.put("scheme_type", schemeType);
            map.put("applied_by_name", appliedByName);
            map.put("status", a.getStatus());
            map.put("start_date", a.getStartDate());
            map.put("end_date", a.getEndDate());
            map.put("benefit_total", a.getBenefitTotal());
            map.put("benefit_used", a.getBenefitUsed());
            map.put("expired_reason", a.getExpiredReason());
            map.put("revoke_reason", a.getRevokeReason());
            map.put("created_at", a.getCreatedAt());
            try {
                map.put("facts_snapshot", objectMapper.readTree(a.getFactsSnapshot() != null ? a.getFactsSnapshot() : "{}"));
            } catch (Exception e) {
                map.put("facts_snapshot", Collections.emptyMap());
            }
            formattedApps.add(map);
        }

        auditService.logAudit(
                principal.getUserId(),
                "ADMIN_FAMILY_LOOKUP",
                "families",
                family.getId(),
                String.format("Lookup family %s by officer dept#%d", family.getFamilyCode(), deptId)
        );

        return ResponseEntity.ok(Map.of(
                "family", family,
                "members", members,
                "applications", formattedApps
        ));
    }

    public static class RevokeRequest {
        public String reason;
    }

    @PostMapping("/applications/{id}/revoke")
    public ResponseEntity<?> revokeApplication(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody RevokeRequest req
    ) {
        if (req == null || req.reason == null || req.reason.trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "A revocation reason is mandatory."));
        }

        Optional<Application> appOpt = applicationRepository.findById(id);
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Application not found."));
        }

        Application app = appOpt.get();
        Optional<Scheme> schemeOpt = schemeRepository.findById(app.getSchemeId());
        Long deptId = principal.getDepartmentId() != null ? principal.getDepartmentId() : 1L;

        if (schemeOpt.isPresent() && !Objects.equals(schemeOpt.get().getDepartmentId(), deptId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: You cannot revoke applications outside your department."));
        }

        if ("expired".equalsIgnoreCase(app.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Application is already expired or revoked."));
        }

        app.setStatus("expired");
        app.setExpiredReason("revoked");
        app.setRevokeReason(req.reason.trim());
        app.setRevokedBy(principal.getUserId());
        app.setExpiredAt(LocalDateTime.now());
        Application saved = applicationRepository.save(app);

        auditService.logAudit(
                principal.getUserId(),
                "APPLICATION_REVOKED",
                "applications",
                id,
                "Revoke reason: " + req.reason.trim()
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Application revoked successfully.",
                "application", saved
        ));
    }

    @GetMapping("/queries")
    public ResponseEntity<?> getDepartmentQueries(@AuthenticationPrincipal UserPrincipal principal) {
        Long deptId = principal.getDepartmentId() != null ? principal.getDepartmentId() : 1L;
        List<QueryEntity> queries = queryRepository.findByDepartmentIdAndStatusOrderByCreatedAtDesc(deptId, "escalated");

        List<Map<String, Object>> response = new ArrayList<>();
        for (QueryEntity q : queries) {
            String schemeName = "";
            Optional<Scheme> s = schemeRepository.findById(q.getSchemeId());
            if (s.isPresent()) schemeName = s.get().getName();

            String familyCode = "";
            Optional<Family> f = familyRepository.findById(q.getFamilyId());
            if (f.isPresent()) familyCode = f.get().getFamilyCode();

            String memberName = "";
            Optional<Member> m = memberRepository.findById(q.getMemberId());
            if (m.isPresent()) memberName = m.get().getName();

            Map<String, Object> item = new HashMap<>();
            item.put("id", q.getId());
            item.put("scheme_id", q.getSchemeId());
            item.put("scheme_name", schemeName);
            item.put("family_id", q.getFamilyId());
            item.put("family_code", familyCode);
            item.put("member_id", q.getMemberId());
            item.put("member_name", memberName);
            item.put("question", q.getQuestion());
            item.put("bot_answer", q.getBotAnswer());
            item.put("status", q.getStatus());
            item.put("created_at", q.getCreatedAt());

            response.add(item);
        }

        return ResponseEntity.ok(response);
    }

    public static class ReplyRequest {
        public String reply;
    }

    @PostMapping("/queries/{id}/reply")
    public ResponseEntity<?> replyQuery(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody ReplyRequest req
    ) {
        if (req == null || req.reply == null || req.reply.trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Reply text is required."));
        }

        Long deptId = principal.getDepartmentId() != null ? principal.getDepartmentId() : 1L;
        try {
            QueryEntity updated = queryService.replyToQuery(id, principal.getUserId(), deptId, req.reply.trim());

            auditService.logAudit(
                    principal.getUserId(),
                    "ADMIN_REPLIED_QUERY",
                    "queries",
                    id
            );

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Reply sent to citizen.",
                    "query", updated
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

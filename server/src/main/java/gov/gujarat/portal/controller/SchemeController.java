package gov.gujarat.portal.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import gov.gujarat.portal.entity.*;
import gov.gujarat.portal.repository.*;
import gov.gujarat.portal.security.UserPrincipal;
import gov.gujarat.portal.service.EligibilityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/schemes")
public class SchemeController {

    private final SchemeRepository schemeRepository;
    private final DepartmentRepository departmentRepository;
    private final FamilyRepository familyRepository;
    private final MemberRepository memberRepository;
    private final DocumentRepository documentRepository;
    private final EligibilityService eligibilityService;
    private final ObjectMapper objectMapper;

    public SchemeController(
            SchemeRepository schemeRepository,
            DepartmentRepository departmentRepository,
            FamilyRepository familyRepository,
            MemberRepository memberRepository,
            DocumentRepository documentRepository,
            EligibilityService eligibilityService,
            ObjectMapper objectMapper
    ) {
        this.schemeRepository = schemeRepository;
        this.departmentRepository = departmentRepository;
        this.familyRepository = familyRepository;
        this.memberRepository = memberRepository;
        this.documentRepository = documentRepository;
        this.eligibilityService = eligibilityService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public ResponseEntity<?> getSchemes(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "view", defaultValue = "applicable") String view
    ) {
        LocalDate today = LocalDate.now();
        List<Scheme> allSchemes = schemeRepository.findAvailableSchemes(today);

        Map<String, Object> familyFacts = null;
        List<Document> familyDocs = Collections.emptyList();

        if (principal != null && principal.getFamilyId() != null) {
            Family family = familyRepository.findById(principal.getFamilyId()).orElse(null);
            List<Member> members = memberRepository.findByFamilyIdAndStatus(principal.getFamilyId(), "active");
            if (family != null) {
                familyFacts = eligibilityService.deriveFacts(family, members);
            }
            familyDocs = documentRepository.findByFamilyIdOrderByCreatedAtDesc(principal.getFamilyId());
        }

        List<Map<String, Object>> evaluated = new ArrayList<>();

        for (Scheme scheme : allSchemes) {
            EligibilityService.EvaluationResult ev = new EligibilityService.EvaluationResult("eligible");
            if (familyFacts != null) {
                ev = eligibilityService.evaluate(scheme, familyFacts);
            }

            List<String> requiredDocs = new ArrayList<>();
            if (scheme.getRequiredDocsJson() != null && !scheme.getRequiredDocsJson().isBlank()) {
                try {
                    requiredDocs = objectMapper.readValue(scheme.getRequiredDocsJson(), new TypeReference<List<String>>() {});
                } catch (Exception e) {}
            }

            List<Map<String, Object>> docStatuses = new ArrayList<>();
            for (String reqDoc : requiredDocs) {
                Document match = familyDocs.stream()
                        .filter(d -> reqDoc.equalsIgnoreCase(d.getType()))
                        .findFirst()
                        .orElse(null);
                boolean present = match != null && match.isVerified();
                boolean isExpired = match != null && match.getValidUntil() != null && match.getValidUntil().isBefore(today);
                Map<String, Object> ds = new HashMap<>();
                ds.put("type", reqDoc);
                ds.put("present", present && !isExpired);
                ds.put("isExpired", isExpired);
                docStatuses.add(ds);
            }

            String departmentName = "";
            if (scheme.getDepartmentId() != null) {
                Optional<Department> d = departmentRepository.findById(scheme.getDepartmentId());
                if (d.isPresent()) departmentName = d.get().getName();
            }

            Map<String, Object> item = new HashMap<>();
            item.put("id", scheme.getId());
            item.put("name", scheme.getName());
            item.put("category", scheme.getCategory());
            item.put("description", scheme.getDescription());
            item.put("department_id", scheme.getDepartmentId());
            item.put("department_name", departmentName);
            item.put("type", scheme.getType());
            item.put("validity_months", scheme.getValidityMonths());
            item.put("benefit_total", scheme.getBenefitTotal());
            item.put("deadline", scheme.getDeadline());
            item.put("is_active", scheme.isActive());
            try {
                item.put("rules_json", objectMapper.readTree(scheme.getRulesJson() != null ? scheme.getRulesJson() : "[]"));
                item.put("faq_json", objectMapper.readTree(scheme.getFaqJson() != null ? scheme.getFaqJson() : "[]"));
            } catch (Exception e) {
                item.put("rules_json", Collections.emptyList());
                item.put("faq_json", Collections.emptyList());
            }
            item.put("required_docs_json", requiredDocs);
            item.put("docStatus", docStatuses);
            item.put("eligibility", ev);

            evaluated.add(item);
        }

        // Search filter
        if (q != null && !q.isBlank()) {
            String term = q.toLowerCase().trim();
            evaluated = evaluated.stream().filter(s -> {
                String name = (String) s.getOrDefault("name", "");
                String desc = (String) s.getOrDefault("description", "");
                return name.toLowerCase().contains(term) || desc.toLowerCase().contains(term);
            }).toList();
        }

        // Category filter
        if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
            evaluated = evaluated.stream().filter(s -> {
                String cat = (String) s.getOrDefault("category", "");
                return cat.equalsIgnoreCase(category);
            }).toList();
        }

        // View filter: 'applicable' = eligible + maybe
        if ("applicable".equalsIgnoreCase(view)) {
            evaluated = evaluated.stream().filter(s -> {
                EligibilityService.EvaluationResult ev = (EligibilityService.EvaluationResult) s.get("eligibility");
                return ev != null && !"not_eligible".equalsIgnoreCase(ev.status);
            }).sorted((a, b) -> {
                EligibilityService.EvaluationResult ea = (EligibilityService.EvaluationResult) a.get("eligibility");
                EligibilityService.EvaluationResult eb = (EligibilityService.EvaluationResult) b.get("eligibility");
                if ("eligible".equalsIgnoreCase(ea.status) && !"eligible".equalsIgnoreCase(eb.status)) return -1;
                if (!"eligible".equalsIgnoreCase(ea.status) && "eligible".equalsIgnoreCase(eb.status)) return 1;
                return 0;
            }).toList();
        }

        return ResponseEntity.ok(Map.of(
                "facts", familyFacts != null ? familyFacts : Collections.emptyMap(),
                "count", evaluated.size(),
                "schemes", evaluated
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSchemeDetails(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        Optional<Scheme> schemeOpt = schemeRepository.findById(id);
        if (schemeOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Scheme not found."));
        }

        Scheme scheme = schemeOpt.get();
        EligibilityService.EvaluationResult ev = new EligibilityService.EvaluationResult("eligible");

        if (principal != null && principal.getFamilyId() != null) {
            Family family = familyRepository.findById(principal.getFamilyId()).orElse(null);
            List<Member> members = memberRepository.findByFamilyIdAndStatus(principal.getFamilyId(), "active");
            if (family != null) {
                Map<String, Object> facts = eligibilityService.deriveFacts(family, members);
                ev = eligibilityService.evaluate(scheme, facts);
            }
        }

        String departmentName = "";
        if (scheme.getDepartmentId() != null) {
            Optional<Department> d = departmentRepository.findById(scheme.getDepartmentId());
            if (d.isPresent()) departmentName = d.get().getName();
        }

        Map<String, Object> item = new HashMap<>();
        item.put("id", scheme.getId());
        item.put("name", scheme.getName());
        item.put("category", scheme.getCategory());
        item.put("description", scheme.getDescription());
        item.put("department_id", scheme.getDepartmentId());
        item.put("department_name", departmentName);
        item.put("type", scheme.getType());
        item.put("validity_months", scheme.getValidityMonths());
        item.put("benefit_total", scheme.getBenefitTotal());
        item.put("deadline", scheme.getDeadline());
        item.put("is_active", scheme.isActive());
        try {
            item.put("rules_json", objectMapper.readTree(scheme.getRulesJson() != null ? scheme.getRulesJson() : "[]"));
            item.put("faq_json", objectMapper.readTree(scheme.getFaqJson() != null ? scheme.getFaqJson() : "[]"));
            item.put("required_docs_json", objectMapper.readTree(scheme.getRequiredDocsJson() != null ? scheme.getRequiredDocsJson() : "[]"));
        } catch (Exception e) {}
        item.put("eligibility", ev);

        return ResponseEntity.ok(item);
    }
}

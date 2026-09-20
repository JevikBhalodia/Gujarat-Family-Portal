package gov.gujarat.portal.controller;

import gov.gujarat.portal.entity.Department;
import gov.gujarat.portal.entity.QueryEntity;
import gov.gujarat.portal.entity.Scheme;
import gov.gujarat.portal.repository.DepartmentRepository;
import gov.gujarat.portal.repository.QueryRepository;
import gov.gujarat.portal.repository.SchemeRepository;
import gov.gujarat.portal.security.UserPrincipal;
import gov.gujarat.portal.service.QueryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/queries")
public class QueryController {

    private final QueryService queryService;
    private final QueryRepository queryRepository;
    private final SchemeRepository schemeRepository;
    private final DepartmentRepository departmentRepository;

    public QueryController(
            QueryService queryService,
            QueryRepository queryRepository,
            SchemeRepository schemeRepository,
            DepartmentRepository departmentRepository
    ) {
        this.queryService = queryService;
        this.queryRepository = queryRepository;
        this.schemeRepository = schemeRepository;
        this.departmentRepository = departmentRepository;
    }

    public static class ChatRequest {
        public Long scheme_id;
        public String question;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> askBot(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody ChatRequest req
    ) {
        if (principal == null || principal.getFamilyId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "You must belong to a family to ask questions."));
        }
        if (req == null || req.scheme_id == null || req.question == null || req.question.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Scheme ID and question are required."));
        }

        try {
            QueryService.ChatResult res = queryService.askSchemeBot(
                    principal.getFamilyId(),
                    principal.getMemberId(),
                    req.scheme_id,
                    req.question
            );
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/escalate")
    public ResponseEntity<?> escalateQuery(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        if (principal == null || principal.getFamilyId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Family context missing."));
        }

        try {
            QueryEntity escalated = queryService.escalateToDepartment(id, principal.getFamilyId());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Query escalated to the respective government department. An officer will reply shortly.",
                    "query", escalated
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getFamilyQueries(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getFamilyId() == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Family context missing."));
        }

        List<QueryEntity> queries = queryRepository.findByFamilyIdOrderByCreatedAtDesc(principal.getFamilyId());
        List<Map<String, Object>> response = new ArrayList<>();

        for (QueryEntity q : queries) {
            String schemeName = "";
            Optional<Scheme> s = schemeRepository.findById(q.getSchemeId());
            if (s.isPresent()) schemeName = s.get().getName();

            String departmentName = "";
            if (q.getDepartmentId() != null) {
                Optional<Department> d = departmentRepository.findById(q.getDepartmentId());
                if (d.isPresent()) departmentName = d.get().getName();
            }

            Map<String, Object> item = new HashMap<>();
            item.put("id", q.getId());
            item.put("family_id", q.getFamilyId());
            item.put("member_id", q.getMemberId());
            item.put("scheme_id", q.getSchemeId());
            item.put("scheme_name", schemeName);
            item.put("department_id", q.getDepartmentId());
            item.put("department_name", departmentName);
            item.put("question", q.getQuestion());
            item.put("bot_answer", q.getBotAnswer());
            item.put("status", q.getStatus());
            item.put("admin_reply", q.getAdminReply());
            item.put("replied_by", q.getRepliedBy());
            item.put("created_at", q.getCreatedAt());

            response.add(item);
        }

        return ResponseEntity.ok(response);
    }
}

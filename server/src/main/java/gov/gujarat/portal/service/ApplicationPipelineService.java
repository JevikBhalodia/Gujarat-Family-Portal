package gov.gujarat.portal.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import gov.gujarat.portal.entity.*;
import gov.gujarat.portal.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ApplicationPipelineService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationAttemptRepository attemptRepository;
    private final MemberRepository memberRepository;
    private final FamilyRepository familyRepository;
    private final SchemeRepository schemeRepository;
    private final DocumentRepository documentRepository;
    private final EligibilityService eligibilityService;
    private final ObjectMapper objectMapper;

    public ApplicationPipelineService(
            ApplicationRepository applicationRepository,
            ApplicationAttemptRepository attemptRepository,
            MemberRepository memberRepository,
            FamilyRepository familyRepository,
            SchemeRepository schemeRepository,
            DocumentRepository documentRepository,
            EligibilityService eligibilityService,
            ObjectMapper objectMapper
    ) {
        this.applicationRepository = applicationRepository;
        this.attemptRepository = attemptRepository;
        this.memberRepository = memberRepository;
        this.familyRepository = familyRepository;
        this.schemeRepository = schemeRepository;
        this.documentRepository = documentRepository;
        this.eligibilityService = eligibilityService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void runExpireOnRead() {
        applicationRepository.expireOutdatedApplications(LocalDate.now(), LocalDateTime.now());
    }

    public static class StepCheck {
        public String name;
        public boolean passed;
        public String reason;

        public StepCheck() {}

        public StepCheck(String name, boolean passed) {
            this.name = name;
            this.passed = passed;
        }

        public StepCheck(String name, boolean passed, String reason) {
            this.name = name;
            this.passed = passed;
            this.reason = reason;
        }
    }

    public static class ApplyResult {
        public boolean ok;
        public Long applicationId;
        public List<StepCheck> checks = new ArrayList<>();

        public ApplyResult(boolean ok, Long applicationId, List<StepCheck> checks) {
            this.ok = ok;
            this.applicationId = applicationId;
            this.checks = checks;
        }
    }

    @Transactional
    public ApplyResult applyForScheme(Long familyId, Long schemeId, Long applicantMemberId) {
        runExpireOnRead();

        List<StepCheck> checks = new ArrayList<>();

        // Fetch applicant member
        Optional<Member> memberOpt = memberRepository.findByIdAndFamilyIdAndStatus(applicantMemberId, familyId, "active");
        if (memberOpt.isEmpty()) {
            checks.add(new StepCheck("permission", false, "Applicant is not an active member of this family."));
            logAttempt(familyId, schemeId, applicantMemberId, false, checks);
            return new ApplyResult(false, null, checks);
        }

        Member applicant = memberOpt.get();

        // 1. Permission Check
        boolean isHead = "head".equalsIgnoreCase(applicant.getFamilyRole());
        boolean hasApply = "apply".equalsIgnoreCase(applicant.getAccess());
        if (!isHead && !hasApply) {
            checks.add(new StepCheck("permission", false,
                    "You only have 'view' access. Apply permission must be granted by your family head."));
            logAttempt(familyId, schemeId, applicantMemberId, false, checks);
            return new ApplyResult(false, null, checks);
        }
        checks.add(new StepCheck("permission", true));

        // 2. Identity Check
        if (!applicant.isIdVerified()) {
            checks.add(new StepCheck("identity", false,
                    "Applicant identity is not verified. Please complete Aadhaar verification in your profile."));
            logAttempt(familyId, schemeId, applicantMemberId, false, checks);
            return new ApplyResult(false, null, checks);
        }
        checks.add(new StepCheck("identity", true));

        // 3. Scheme Open Check
        Optional<Scheme> schemeOpt = schemeRepository.findById(schemeId);
        if (schemeOpt.isEmpty()) {
            checks.add(new StepCheck("scheme_open", false, "Scheme not found."));
            logAttempt(familyId, schemeId, applicantMemberId, false, checks);
            return new ApplyResult(false, null, checks);
        }

        Scheme scheme = schemeOpt.get();
        LocalDate today = LocalDate.now();

        if (!scheme.isActive() || (scheme.getDeadline() != null && scheme.getDeadline().isBefore(today))) {
            checks.add(new StepCheck("scheme_open", false, "Scheme is currently closed or deadline has expired."));
            logAttempt(familyId, schemeId, applicantMemberId, false, checks);
            return new ApplyResult(false, null, checks);
        }
        checks.add(new StepCheck("scheme_open", true));

        // 4. Eligibility Check on Fresh Facts
        Family family = familyRepository.findById(familyId).orElse(null);
        List<Member> activeMembers = memberRepository.findByFamilyIdAndStatus(familyId, "active");

        Map<String, Object> freshFacts = eligibilityService.deriveFacts(family, activeMembers);
        EligibilityService.EvaluationResult evaluation = eligibilityService.evaluate(scheme, freshFacts);

        if (!"eligible".equalsIgnoreCase(evaluation.status)) {
            List<String> reasons = new ArrayList<>();
            for (EligibilityService.RuleCheckResult f : evaluation.failed) {
                reasons.add(f.message);
            }
            for (EligibilityService.RuleCheckResult m : evaluation.missing) {
                reasons.add(m.message);
            }
            checks.add(new StepCheck("eligibility", false,
                    reasons.isEmpty() ? "Family does not meet scheme eligibility rules." : String.join("; ", reasons)));
            logAttempt(familyId, schemeId, applicantMemberId, false, checks);
            return new ApplyResult(false, null, checks);
        }
        checks.add(new StepCheck("eligibility", true));

        // 5. Documents Check
        List<String> requiredDocs = new ArrayList<>();
        if (scheme.getRequiredDocsJson() != null && !scheme.getRequiredDocsJson().isBlank()) {
            try {
                requiredDocs = objectMapper.readValue(scheme.getRequiredDocsJson(), new TypeReference<List<String>>() {});
            } catch (Exception e) {
                // empty
            }
        }

        List<Document> familyDocs = documentRepository.findByFamilyIdAndVerifiedTrue(familyId);
        List<String> missingDocs = new ArrayList<>();

        for (String reqDocType : requiredDocs) {
            Document match = familyDocs.stream()
                    .filter(d -> reqDocType.equalsIgnoreCase(d.getType()))
                    .findFirst()
                    .orElse(null);

            if (match == null) {
                missingDocs.add(reqDocType);
            } else if (match.getValidUntil() != null && match.getValidUntil().isBefore(today)) {
                missingDocs.add(reqDocType + " (expired)");
            }
        }

        if (!missingDocs.isEmpty()) {
            checks.add(new StepCheck("documents", false,
                    "Missing or expired mandatory documents: " + String.join(", ", missingDocs)));
            logAttempt(familyId, schemeId, applicantMemberId, false, checks);
            return new ApplyResult(false, null, checks);
        }
        checks.add(new StepCheck("documents", true));

        // 6. Duplicate Check (no active application)
        Optional<Application> existingApp = applicationRepository.findByFamilyIdAndSchemeIdAndStatus(familyId, schemeId, "active");
        if (existingApp.isPresent()) {
            checks.add(new StepCheck("duplicate", false,
                    "Family already has an active application enrolled in this scheme."));
            logAttempt(familyId, schemeId, applicantMemberId, false, checks);
            return new ApplyResult(false, null, checks);
        }
        checks.add(new StepCheck("duplicate", true));

        // 7. Create Application
        LocalDate startDate = today;
        LocalDate endDate = null;
        if (scheme.getValidityMonths() != null && scheme.getValidityMonths() > 0) {
            endDate = today.plusMonths(scheme.getValidityMonths());
        }

        Application application = new Application();
        application.setFamilyId(familyId);
        application.setSchemeId(schemeId);
        application.setAppliedByMemberId(applicantMemberId);
        application.setStatus("active");
        try {
            application.setFactsSnapshot(objectMapper.writeValueAsString(freshFacts));
        } catch (Exception e) {
            application.setFactsSnapshot("{}");
        }
        application.setStartDate(startDate);
        application.setEndDate(endDate);
        application.setBenefitTotal(scheme.getBenefitTotal());
        application.setBenefitUsed(0L);

        Application savedApp = applicationRepository.save(application);
        checks.add(new StepCheck("create", true));

        logAttempt(familyId, schemeId, applicantMemberId, true, checks);

        return new ApplyResult(true, savedApp.getId(), checks);
    }

    private void logAttempt(Long familyId, Long schemeId, Long memberId, boolean passed, List<StepCheck> checks) {
        try {
            String checksJson = objectMapper.writeValueAsString(checks);
            ApplicationAttempt attempt = new ApplicationAttempt(familyId, schemeId, memberId, passed, checksJson);
            attemptRepository.save(attempt);
        } catch (Exception e) {
            // ignore logging error
        }
    }
}

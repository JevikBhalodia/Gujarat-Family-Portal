package gov.gujarat.portal.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import gov.gujarat.portal.entity.*;
import gov.gujarat.portal.repository.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AnalyticsService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationAttemptRepository attemptRepository;
    private final SchemeRepository schemeRepository;
    private final FamilyRepository familyRepository;
    private final MemberRepository memberRepository;
    private final EligibilityService eligibilityService;
    private final ObjectMapper objectMapper;

    public AnalyticsService(
            ApplicationRepository applicationRepository,
            ApplicationAttemptRepository attemptRepository,
            SchemeRepository schemeRepository,
            FamilyRepository familyRepository,
            MemberRepository memberRepository,
            EligibilityService eligibilityService,
            ObjectMapper objectMapper
    ) {
        this.applicationRepository = applicationRepository;
        this.attemptRepository = attemptRepository;
        this.schemeRepository = schemeRepository;
        this.familyRepository = familyRepository;
        this.memberRepository = memberRepository;
        this.eligibilityService = eligibilityService;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> getSummary(Long departmentId, Long schemeId, String district) {
        List<Application> apps = applicationRepository.findAllByDepartmentId(departmentId);

        if (schemeId != null) {
            apps = apps.stream().filter(a -> Objects.equals(a.getSchemeId(), schemeId)).toList();
        }

        if (district != null && !district.isBlank()) {
            apps = apps.stream().filter(a -> {
                Optional<Family> f = familyRepository.findById(a.getFamilyId());
                return f.isPresent() && district.equalsIgnoreCase(f.get().getDistrict());
            }).toList();
        }

        int activeCount = 0;
        int expiredCount = 0;
        int revokedCount = 0;

        for (Application a : apps) {
            if ("active".equalsIgnoreCase(a.getStatus())) {
                activeCount++;
            } else {
                expiredCount++;
                if ("revoked".equalsIgnoreCase(a.getExpiredReason())) {
                    revokedCount++;
                }
            }
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalApplications", apps.size());
        summary.put("activeCount", activeCount);
        summary.put("expiredCount", expiredCount);
        summary.put("revokedCount", revokedCount);
        return summary;
    }

    public List<Map<String, Object>> getActiveVsExpiredPerScheme(Long departmentId) {
        List<Scheme> schemes = schemeRepository.findByDepartmentIdAndActiveTrue(departmentId);
        List<Application> allApps = applicationRepository.findAllByDepartmentId(departmentId);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Scheme s : schemes) {
            long active = allApps.stream().filter(a -> Objects.equals(a.getSchemeId(), s.getId()) && "active".equalsIgnoreCase(a.getStatus())).count();
            long expired = allApps.stream().filter(a -> Objects.equals(a.getSchemeId(), s.getId()) && "expired".equalsIgnoreCase(a.getStatus())).count();
            long revoked = allApps.stream().filter(a -> Objects.equals(a.getSchemeId(), s.getId()) && "revoked".equalsIgnoreCase(a.getExpiredReason())).count();

            Map<String, Object> row = new HashMap<>();
            row.put("schemeId", s.getId());
            row.put("schemeName", s.getName());
            row.put("active", active);
            row.put("expired", expired);
            row.put("revoked", revoked);
            result.add(row);
        }
        return result;
    }

    public List<Map<String, Object>> getByDistrict(Long departmentId) {
        List<Family> families = familyRepository.findAll();
        List<Application> deptApps = applicationRepository.findAllByDepartmentId(departmentId);

        Map<String, List<Application>> appsByFamily = new HashMap<>();
        for (Application a : deptApps) {
            appsByFamily.computeIfAbsent(String.valueOf(a.getFamilyId()), k -> new ArrayList<>()).add(a);
        }

        Map<String, int[]> statsByDistrict = new LinkedHashMap<>();
        for (Family f : families) {
            String dist = f.getDistrict() != null ? f.getDistrict() : "Unknown";
            statsByDistrict.putIfAbsent(dist, new int[]{0, 0}); // total, active

            List<Application> fApps = appsByFamily.getOrDefault(String.valueOf(f.getId()), Collections.emptyList());
            statsByDistrict.get(dist)[0] += fApps.size();
            statsByDistrict.get(dist)[1] += (int) fApps.stream().filter(a -> "active".equalsIgnoreCase(a.getStatus())).count();
        }

        List<Map<String, Object>> list = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : statsByDistrict.entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("district", entry.getKey());
            item.put("totalApplications", entry.getValue()[0]);
            item.put("activeCount", entry.getValue()[1]);
            list.add(item);
        }
        return list;
    }

    public List<Map<String, Object>> getTopFailedChecks(Long departmentId) {
        List<ApplicationAttempt> failedAttempts = attemptRepository.findFailedAttemptsByDepartmentId(departmentId);

        Map<String, Integer> counts = new LinkedHashMap<>();
        counts.put("permission", 0);
        counts.put("identity", 0);
        counts.put("scheme_open", 0);
        counts.put("eligibility", 0);
        counts.put("documents", 0);
        counts.put("duplicate", 0);

        for (ApplicationAttempt attempt : failedAttempts) {
            if (attempt.getChecksJson() != null && !attempt.getChecksJson().isBlank()) {
                try {
                    List<ApplicationPipelineService.StepCheck> checks = objectMapper.readValue(
                            attempt.getChecksJson(),
                            new TypeReference<List<ApplicationPipelineService.StepCheck>>() {}
                    );
                    for (ApplicationPipelineService.StepCheck check : checks) {
                        if (!check.passed && counts.containsKey(check.name)) {
                            counts.put(check.name, counts.get(check.name) + 1);
                        }
                    }
                } catch (Exception e) {
                    // ignore
                }
            }
        }

        List<Map<String, Object>> res = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : counts.entrySet()) {
            Map<String, Object> m = new HashMap<>();
            m.put("checkName", entry.getKey());
            m.put("failedCount", entry.getValue());
            res.add(m);
        }
        return res;
    }

    public List<Map<String, Object>> getAwarenessGap(Long departmentId) {
        List<Scheme> schemes = schemeRepository.findByDepartmentIdAndActiveTrue(departmentId);
        List<Family> families = familyRepository.findAll();
        List<Member> allActiveMembers = memberRepository.findByStatus("active");
        List<Application> allApps = applicationRepository.findAll();

        Set<String> appliedSet = new HashSet<>();
        for (Application app : allApps) {
            appliedSet.add(app.getFamilyId() + "_" + app.getSchemeId());
        }

        List<Map<String, Object>> results = new ArrayList<>();

        for (Scheme scheme : schemes) {
            int eligibleNotApplied = 0;

            for (Family fam : families) {
                if (appliedSet.contains(fam.getId() + "_" + scheme.getId())) {
                    continue;
                }

                List<Member> famMembers = allActiveMembers.stream()
                        .filter(m -> Objects.equals(m.getFamilyId(), fam.getId()))
                        .toList();

                Map<String, Object> facts = eligibilityService.deriveFacts(fam, famMembers);
                EligibilityService.EvaluationResult ev = eligibilityService.evaluate(scheme, facts);

                if ("eligible".equalsIgnoreCase(ev.status)) {
                    eligibleNotApplied++;
                }
            }

            Map<String, Object> item = new HashMap<>();
            item.put("schemeId", scheme.getId());
            item.put("schemeName", scheme.getName());
            item.put("eligibleNotApplied", eligibleNotApplied);
            results.add(item);
        }

        return results;
    }
}

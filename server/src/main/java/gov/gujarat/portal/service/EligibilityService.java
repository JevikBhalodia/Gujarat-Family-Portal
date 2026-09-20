package gov.gujarat.portal.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import gov.gujarat.portal.entity.Family;
import gov.gujarat.portal.entity.Member;
import gov.gujarat.portal.entity.Scheme;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.util.*;

@Service
public class EligibilityService {

    private final ObjectMapper objectMapper;

    public EligibilityService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> deriveFacts(Family family, List<Member> members) {
        List<Member> activeMembers = members.stream()
                .filter(m -> "active".equalsIgnoreCase(m.getStatus()))
                .toList();

        Member headMember = activeMembers.stream()
                .filter(m -> "head".equalsIgnoreCase(m.getFamilyRole()))
                .findFirst()
                .orElse(null);

        LocalDate now = LocalDate.now();

        Integer headAge = null;
        String headGender = null;

        if (headMember != null && headMember.getDob() != null) {
            headAge = Period.between(headMember.getDob(), now).getYears();
            headGender = headMember.getGender();
        }

        boolean hasGirlChild = activeMembers.stream().anyMatch(m -> {
            if (m.getDob() == null) return false;
            int age = Period.between(m.getDob(), now).getYears();
            return "F".equalsIgnoreCase(m.getGender()) && age < 18;
        });

        boolean hasSenior = activeMembers.stream().anyMatch(m -> {
            if (m.getDob() == null) return false;
            int age = Period.between(m.getDob(), now).getYears();
            return age >= 60;
        });

        boolean hasDisabledMember = activeMembers.stream().anyMatch(Member::isDisabled);
        boolean hasWidow = activeMembers.stream().anyMatch(Member::isWidowed);
        boolean hasStudent = activeMembers.stream().anyMatch(Member::isStudent);

        Map<String, Object> facts = new HashMap<>();
        facts.put("district", family != null ? family.getDistrict() : null);
        facts.put("income_annual", family != null && family.getIncomeAnnual() != null ? family.getIncomeAnnual().doubleValue() : null);
        facts.put("family_size", activeMembers.size());
        facts.put("head_age", headAge);
        facts.put("head_gender", headGender);
        facts.put("has_girl_child", hasGirlChild);
        facts.put("has_senior", hasSenior);
        facts.put("has_disabled_member", hasDisabledMember);
        facts.put("has_widow", hasWidow);
        facts.put("has_student", hasStudent);

        return facts;
    }

    public static class RuleCheckResult {
        public String field;
        public String op;
        public Object expected;
        public Object actual;
        public String message;

        public RuleCheckResult() {}

        public RuleCheckResult(String field, String op, Object expected, Object actual, String message) {
            this.field = field;
            this.op = op;
            this.expected = expected;
            this.actual = actual;
            this.message = message;
        }
    }

    public static class EvaluationResult {
        public String status; // "eligible", "maybe", "not_eligible"
        public List<RuleCheckResult> failed = new ArrayList<>();
        public List<RuleCheckResult> missing = new ArrayList<>();

        public EvaluationResult(String status) {
            this.status = status;
        }
    }

    public EvaluationResult evaluate(Scheme scheme, Map<String, Object> facts) {
        List<Map<String, Object>> rules = new ArrayList<>();
        if (scheme.getRulesJson() != null && !scheme.getRulesJson().isBlank()) {
            try {
                rules = objectMapper.readValue(scheme.getRulesJson(), new TypeReference<List<Map<String, Object>>>() {});
            } catch (Exception e) {
                // empty rules
            }
        }

        List<RuleCheckResult> failed = new ArrayList<>();
        List<RuleCheckResult> missing = new ArrayList<>();

        for (Map<String, Object> rule : rules) {
            String field = (String) rule.get("field");
            String op = (String) rule.get("op");
            Object expected = rule.get("value");

            if (!facts.containsKey(field) || facts.get(field) == null) {
                missing.add(new RuleCheckResult(field, op, expected, null,
                        "Fact '" + field + "' is not completed in family profile."));
                continue;
            }

            Object actual = facts.get(field);
            boolean passed = compareValues(actual, op, expected);

            if (!passed) {
                failed.add(new RuleCheckResult(field, op, expected, actual,
                        String.format("Requirement failed: %s (%s) must satisfy %s %s", field, actual, op, expected)));
            }
        }

        if (!failed.isEmpty()) {
            EvaluationResult res = new EvaluationResult("not_eligible");
            res.failed = failed;
            res.missing = missing;
            return res;
        }

        if (!missing.isEmpty()) {
            EvaluationResult res = new EvaluationResult("maybe");
            res.failed = failed;
            res.missing = missing;
            return res;
        }

        EvaluationResult res = new EvaluationResult("eligible");
        res.failed = failed;
        res.missing = missing;
        return res;
    }

    private boolean compareValues(Object actual, String op, Object expected) {
        if (actual == null || op == null) return false;

        switch (op) {
            case "eq":
                if (actual instanceof Number && expected instanceof Number) {
                    return ((Number) actual).doubleValue() == ((Number) expected).doubleValue();
                }
                return String.valueOf(actual).equalsIgnoreCase(String.valueOf(expected));

            case "neq":
                if (actual instanceof Number && expected instanceof Number) {
                    return ((Number) actual).doubleValue() != ((Number) expected).doubleValue();
                }
                return !String.valueOf(actual).equalsIgnoreCase(String.valueOf(expected));

            case "lte":
                if (actual instanceof Number && expected instanceof Number) {
                    return ((Number) actual).doubleValue() <= ((Number) expected).doubleValue();
                }
                try {
                    return Double.parseDouble(String.valueOf(actual)) <= Double.parseDouble(String.valueOf(expected));
                } catch (Exception e) {
                    return false;
                }

            case "gte":
                if (actual instanceof Number && expected instanceof Number) {
                    return ((Number) actual).doubleValue() >= ((Number) expected).doubleValue();
                }
                try {
                    return Double.parseDouble(String.valueOf(actual)) >= Double.parseDouble(String.valueOf(expected));
                } catch (Exception e) {
                    return false;
                }

            case "in":
                if (expected instanceof List<?> list) {
                    return list.contains(actual) || list.contains(String.valueOf(actual));
                }
                return false;

            default:
                return false;
        }
    }
}

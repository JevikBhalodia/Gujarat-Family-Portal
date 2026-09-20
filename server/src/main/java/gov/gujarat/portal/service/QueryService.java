package gov.gujarat.portal.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import gov.gujarat.portal.entity.QueryEntity;
import gov.gujarat.portal.entity.Scheme;
import gov.gujarat.portal.repository.QueryRepository;
import gov.gujarat.portal.repository.SchemeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class QueryService {

    private final QueryRepository queryRepository;
    private final SchemeRepository schemeRepository;
    private final ObjectMapper objectMapper;

    public QueryService(
            QueryRepository queryRepository,
            SchemeRepository schemeRepository,
            ObjectMapper objectMapper
    ) {
        this.queryRepository = queryRepository;
        this.schemeRepository = schemeRepository;
        this.objectMapper = objectMapper;
    }

    public static class ChatResult {
        public Long queryId;
        public String botAnswer;
        public boolean matched;
        public boolean canEscalate;

        public ChatResult(Long queryId, String botAnswer, boolean matched, boolean canEscalate) {
            this.queryId = queryId;
            this.botAnswer = botAnswer;
            this.matched = matched;
            this.canEscalate = canEscalate;
        }
    }

    @Transactional
    public ChatResult askSchemeBot(Long familyId, Long memberId, Long schemeId, String question) {
        Scheme scheme = schemeRepository.findById(schemeId)
                .orElseThrow(() -> new IllegalArgumentException("Scheme not found."));

        List<Map<String, String>> faqs = new ArrayList<>();
        if (scheme.getFaqJson() != null && !scheme.getFaqJson().isBlank()) {
            try {
                faqs = objectMapper.readValue(scheme.getFaqJson(), new TypeReference<List<Map<String, String>>>() {});
            } catch (Exception e) {
                // ignore
            }
        }

        String qLower = question.toLowerCase().trim();
        List<String> qWords = Arrays.stream(qLower.split("\\s+"))
                .filter(w -> w.length() > 2)
                .toList();

        Map<String, String> bestFaq = null;
        int maxMatchCount = 0;

        for (Map<String, String> item : faqs) {
            String faqText = (item.getOrDefault("q", "") + " " + item.getOrDefault("a", "")).toLowerCase();
            int matchCount = 0;
            for (String word : qWords) {
                if (faqText.contains(word)) {
                    matchCount++;
                }
            }
            if (matchCount > maxMatchCount) {
                maxMatchCount = matchCount;
                bestFaq = item;
            }
        }

        String botAnswer;
        boolean matched = false;

        if (bestFaq != null && maxMatchCount >= 2) {
            botAnswer = bestFaq.get("a");
            matched = true;
        } else if (scheme.getDescription() != null && qWords.stream().anyMatch(w -> scheme.getDescription().toLowerCase().contains(w))) {
            botAnswer = "Based on the scheme details: " + scheme.getDescription();
            matched = true;
        } else {
            botAnswer = String.format("I could not locate a precise answer in the scheme FAQ. You can click 'Raise to Authority' below to send this question directly to the %s department officers.", scheme.getName());
            matched = false;
        }

        QueryEntity queryEntity = new QueryEntity();
        queryEntity.setFamilyId(familyId);
        queryEntity.setMemberId(memberId);
        queryEntity.setSchemeId(schemeId);
        queryEntity.setQuestion(question);
        queryEntity.setBotAnswer(botAnswer);
        queryEntity.setStatus("answered_by_bot");
        queryEntity.setDepartmentId(scheme.getDepartmentId());

        QueryEntity saved = queryRepository.save(queryEntity);

        return new ChatResult(saved.getId(), botAnswer, matched, true);
    }

    @Transactional
    public QueryEntity escalateToDepartment(Long queryId, Long familyId) {
        QueryEntity query = queryRepository.findById(queryId)
                .orElseThrow(() -> new IllegalArgumentException("Query not found."));

        if (!Objects.equals(query.getFamilyId(), familyId)) {
            throw new IllegalArgumentException("Unauthorized to escalate this query.");
        }

        query.setStatus("escalated");
        return queryRepository.save(query);
    }

    @Transactional
    public QueryEntity replyToQuery(Long queryId, Long adminUserId, Long departmentId, String replyText) {
        QueryEntity query = queryRepository.findByIdAndDepartmentId(queryId, departmentId)
                .orElseThrow(() -> new IllegalArgumentException("Query not found or not within your department."));

        query.setStatus("answered");
        query.setAdminReply(replyText);
        query.setRepliedBy(adminUserId);

        return queryRepository.save(query);
    }
}

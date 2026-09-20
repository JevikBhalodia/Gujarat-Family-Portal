package gov.gujarat.portal;

import com.fasterxml.jackson.databind.ObjectMapper;
import gov.gujarat.portal.service.ApplicationPipelineService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ApplicationPipelineTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ApplicationPipelineService pipelineService;

    @Test
    void test7StepApplyPipeline() throws Exception {
        // Log in as head of Patel family (9876543210)
        String verifyRes = mockMvc.perform(post("/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("mobile", "9876543210", "otp", "123456"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<?, ?> map = objectMapper.readValue(verifyRes, Map.class);
        String token = (String) map.get("token");

        // Try applying for Vahali Dikri Yojana (Scheme 1) for Patel family (Family 1, Head Member 1)
        // Family 1 has girl child (Priya, Age 6), income 180k <= 200k, and required docs: ration_card, income_certificate, birth_cert!
        mockMvc.perform(post("/schemes/1/apply")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.checks").isArray())
                .andExpect(jsonPath("$.checks[0].name").value("permission"))
                .andExpect(jsonPath("$.checks[0].passed").value(true))
                .andExpect(jsonPath("$.checks[6].name").value("create"))
                .andExpect(jsonPath("$.checks[6].passed").value(true));

        // Duplicate check: trying to apply again should be blocked by Step 6 (duplicate)
        mockMvc.perform(post("/schemes/1/apply")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.checks[5].name").value("duplicate"))
                .andExpect(jsonPath("$.checks[5].passed").value(false));

        // Verify application shows up in /applications
        mockMvc.perform(get("/applications")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testAdminAnalyticsAndLookup() throws Exception {
        // Log in as Admin 1 (Dept 1)
        String verifyRes = mockMvc.perform(post("/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("mobile", "9998887771", "otp", "123456"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<?, ?> map = objectMapper.readValue(verifyRes, Map.class);
        String token = (String) map.get("token");

        // Admin Analytics Summary
        mockMvc.perform(get("/admin/analytics/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalApplications").isNumber());

        // Admin Family Lookup
        mockMvc.perform(get("/admin/families/GJ-AHM-00101/applications")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.family.family_code").value("GJ-AHM-00101"))
                .andExpect(jsonPath("$.members").isArray());
    }
}

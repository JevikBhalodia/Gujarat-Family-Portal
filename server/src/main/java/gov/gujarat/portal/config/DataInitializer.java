package gov.gujarat.portal.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import gov.gujarat.portal.entity.*;
import gov.gujarat.portal.repository.*;
import gov.gujarat.portal.service.VerifierService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SchemeRepository schemeRepository;
    private final FamilyRepository familyRepository;
    private final MemberRepository memberRepository;
    private final DocumentRepository documentRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationAttemptRepository attemptRepository;
    private final VerifierService verifierService;
    private final ObjectMapper objectMapper;

    public DataInitializer(
            DepartmentRepository departmentRepository,
            UserRepository userRepository,
            SchemeRepository schemeRepository,
            FamilyRepository familyRepository,
            MemberRepository memberRepository,
            DocumentRepository documentRepository,
            ApplicationRepository applicationRepository,
            ApplicationAttemptRepository attemptRepository,
            VerifierService verifierService,
            ObjectMapper objectMapper
    ) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.schemeRepository = schemeRepository;
        this.familyRepository = familyRepository;
        this.memberRepository = memberRepository;
        this.documentRepository = documentRepository;
        this.applicationRepository = applicationRepository;
        this.attemptRepository = attemptRepository;
        this.verifierService = verifierService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        if (departmentRepository.count() > 0) {
            log.info("Database already initialized with data.");
            return;
        }

        log.info("--- Initializing Gujarat Portal Spring Boot Database ---");

        // 1. Departments
        Department dept1 = new Department();
        dept1.setName("Department of Health & Family Welfare");
        dept1 = departmentRepository.save(dept1);

        Department dept2 = new Department();
        dept2.setName("Department of Women & Child Development");
        dept2 = departmentRepository.save(dept2);

        // 2. Department Admins
        User admin1 = new User("9998887771", "admin");
        admin1.setDepartmentId(dept1.getId());
        userRepository.save(admin1);

        User admin2 = new User("9998887772", "admin");
        admin2.setDepartmentId(dept2.getId());
        userRepository.save(admin2);

        // 3. Schemes
        Scheme s1 = new Scheme();
        s1.setId(1L);
        s1.setDepartmentId(dept2.getId());
        s1.setName("Vahali Dikri Yojana");
        s1.setCategory("Women & Child");
        s1.setDescription("Financial assistance for first and second girl child to promote female education and prevent female foeticide. Covers education and marriage milestones.");
        s1.setType("one_time");
        s1.setBenefitTotal(110000L);
        s1.setDeadline(LocalDate.parse("2027-12-31"));
        s1.setActive(true);
        s1.setRulesJson(objectMapper.writeValueAsString(List.of(
                Map.of("field", "has_girl_child", "op", "eq", "value", true),
                Map.of("field", "income_annual", "op", "lte", "value", 200000)
        )));
        s1.setRequiredDocsJson(objectMapper.writeValueAsString(List.of("income_certificate", "birth_cert", "ration_card")));
        s1.setFaqJson(objectMapper.writeValueAsString(List.of(
                Map.of("q", "Who is eligible for Vahali Dikri Yojana?", "a", "Families with girl child born on or after August 2, 2019 and annual family income up to ₹2,00,000."),
                Map.of("q", "What is the total financial assistance amount?", "a", "₹4,000 upon admission in 1st standard, ₹6,000 upon admission in 9th standard, and ₹1,00,000 upon reaching 18 years of age."),
                Map.of("q", "What documents are required to apply?", "a", "Child birth certificate, Family income certificate, Ration card, and Aadhaar card of parents.")
        )));
        schemeRepository.save(s1);

        Scheme s2 = new Scheme();
        s2.setId(2L);
        s2.setDepartmentId(dept1.getId());
        s2.setName("Mukhyamantri Amrutam (MA) Health Cover");
        s2.setCategory("Health");
        s2.setDescription("Tertiary medical treatment coverage up to ₹5 Lakh per family per year for catastrophic illnesses like cardiovascular, oncology, and renal care.");
        s2.setType("quota");
        s2.setValidityMonths(12);
        s2.setBenefitTotal(500000L);
        s2.setDeadline(LocalDate.parse("2028-12-31"));
        s2.setActive(true);
        s2.setRulesJson(objectMapper.writeValueAsString(List.of(
                Map.of("field", "income_annual", "op", "lte", "value", 400000)
        )));
        s2.setRequiredDocsJson(objectMapper.writeValueAsString(List.of("income_certificate", "ration_card")));
        s2.setFaqJson(objectMapper.writeValueAsString(List.of(
                Map.of("q", "How much hospital coverage does MA provide?", "a", "Up to ₹5,00,000 per family per year on a family floater cashless basis."),
                Map.of("q", "Which hospitals accept MA card?", "a", "All empanelled government and private tertiary specialty hospitals across Gujarat."),
                Map.of("q", "What is the eligibility income threshold?", "a", "Annual income must not exceed ₹4,00,000 as certified by Talati/Mamlatdar.")
        )));
        schemeRepository.save(s2);

        Scheme s3 = new Scheme();
        s3.setId(3L);
        s3.setDepartmentId(dept2.getId());
        s3.setName("Indira Gandhi National Old Age Pension Scheme");
        s3.setCategory("Social Security");
        s3.setDescription("Monthly pension allowance for senior citizens aged 60 and above living below poverty line or under modest annual income.");
        s3.setType("time");
        s3.setValidityMonths(12);
        s3.setBenefitTotal(12000L);
        s3.setDeadline(LocalDate.parse("2027-06-30"));
        s3.setActive(true);
        s3.setRulesJson(objectMapper.writeValueAsString(List.of(
                Map.of("field", "has_senior", "op", "eq", "value", true),
                Map.of("field", "income_annual", "op", "lte", "value", 150000)
        )));
        s3.setRequiredDocsJson(objectMapper.writeValueAsString(List.of("income_certificate", "aadhaar")));
        s3.setFaqJson(objectMapper.writeValueAsString(List.of(
                Map.of("q", "What is the minimum age to receive old-age pension?", "a", "The applicant or senior family member must be 60 years or older."),
                Map.of("q", "How often is the allowance disbursed?", "a", "Disbursed monthly directly to the verified bank account linked with Aadhaar."),
                Map.of("q", "Is physical renewal required annually?", "a", "No, digital life certificate (Jeevan Pramaan) or digital verification is supported.")
        )));
        schemeRepository.save(s3);

        Scheme s4 = new Scheme();
        s4.setId(4L);
        s4.setDepartmentId(dept1.getId());
        s4.setName("Divyang Sahay Yojana (Disability Support)");
        s4.setCategory("Disability Support");
        s4.setDescription("Monthly financial assistance and rehabilitation equipment subsidy for persons with permanent physical or neurological disability.");
        s4.setType("time");
        s4.setValidityMonths(24);
        s4.setBenefitTotal(24000L);
        s4.setDeadline(LocalDate.parse("2028-03-31"));
        s4.setActive(true);
        s4.setRulesJson(objectMapper.writeValueAsString(List.of(
                Map.of("field", "has_disabled_member", "op", "eq", "value", true)
        )));
        s4.setRequiredDocsJson(objectMapper.writeValueAsString(List.of("disability_certificate")));
        s4.setFaqJson(objectMapper.writeValueAsString(List.of(
                Map.of("q", "What percentage of disability is required?", "a", "40% or more certified disability evaluated by a Civil Hospital medical board."),
                Map.of("q", "Is there an income limit for disability support?", "a", "No, this assistance is entitlement-based for all verified disabled citizens of Gujarat."),
                Map.of("q", "What documents must be uploaded?", "a", "Official UDID or civil hospital Disability Certificate.")
        )));
        schemeRepository.save(s4);

        Scheme s5 = new Scheme();
        s5.setId(5L);
        s5.setDepartmentId(dept2.getId());
        s5.setName("Ganga Swarupa Yojana (Widow Assistance)");
        s5.setCategory("Social Security");
        s5.setDescription("Monthly direct financial support of ₹1,250 for widowed women to ensure dignified social and economic independence.");
        s5.setType("time");
        s5.setValidityMonths(12);
        s5.setBenefitTotal(15000L);
        s5.setDeadline(LocalDate.parse("2027-12-31"));
        s5.setActive(true);
        s5.setRulesJson(objectMapper.writeValueAsString(List.of(
                Map.of("field", "has_widow", "op", "eq", "value", true),
                Map.of("field", "income_annual", "op", "lte", "value", 120000)
        )));
        s5.setRequiredDocsJson(objectMapper.writeValueAsString(List.of("income_certificate", "death_certificate")));
        s5.setFaqJson(objectMapper.writeValueAsString(List.of(
                Map.of("q", "Who qualifies for Ganga Swarupa Yojana?", "a", "Widowed women residing in Gujarat with annual income up to ₹1,20,000."),
                Map.of("q", "Does assistance stop if child turns 21?", "a", "No, under amended Gujarat government rules, pension continues for the widow regardless of child age."),
                Map.of("q", "What proof of death is accepted?", "a", "Official municipal or panchayat issued Death Certificate of the spouse.")
        )));
        schemeRepository.save(s5);

        Scheme s6 = new Scheme();
        s6.setId(6L);
        s6.setDepartmentId(dept1.getId());
        s6.setName("MYSY Higher Education Scholarship");
        s6.setCategory("Education");
        s6.setDescription("Tuition fee scholarship and hostel allowance assistance for meritorious students pursuing degree or diploma courses in Gujarat.");
        s6.setType("time");
        s6.setValidityMonths(12);
        s6.setBenefitTotal(50000L);
        s6.setDeadline(LocalDate.parse("2026-11-30"));
        s6.setActive(true);
        s6.setRulesJson(objectMapper.writeValueAsString(List.of(
                Map.of("field", "has_student", "op", "eq", "value", true),
                Map.of("field", "income_annual", "op", "lte", "value", 600000)
        )));
        s6.setRequiredDocsJson(objectMapper.writeValueAsString(List.of("income_certificate", "admission_letter")));
        s6.setFaqJson(objectMapper.writeValueAsString(List.of(
                Map.of("q", "What courses are eligible under MYSY?", "a", "Approved Engineering, Medical, Pharmacy, Polytechnic and general undergraduate programs."),
                Map.of("q", "What is the family income ceiling?", "a", "Annual family income must not exceed ₹6,00,000."),
                Map.of("q", "Can this be renewed for 2nd and 3rd year?", "a", "Yes, with passing grade and attendance verification.")
        )));
        schemeRepository.save(s6);

        // 4. Primary Demo Family: Patel Family (Ahmedabad)
        Family patelFamily = new Family();
        patelFamily.setFamilyCode("GJ-AHM-00101");
        patelFamily.setDistrict("Ahmedabad");
        patelFamily.setIncomeAnnual(new BigDecimal("180000"));
        patelFamily.setRationCardRef("RC-AHM-889922");
        patelFamily = familyRepository.save(patelFamily);

        User userHead = userRepository.save(new User("9876543210", "citizen"));
        User userSpouse = userRepository.save(new User("9876543211", "citizen"));
        User userBrother = userRepository.save(new User("9876543212", "citizen"));

        // Documents for Patel family
        Document d1 = new Document();
        d1.setFamilyId(patelFamily.getId());
        d1.setType("ration_card");
        d1.setDocNumber("RC-AHM-889922");
        d1.setIssuedOn(LocalDate.parse("2022-01-01"));
        d1.setValidUntil(LocalDate.parse("2030-12-31"));
        d1.setFileUrl("/uploads/rc_patel.pdf");
        d1.setVerified(true);
        documentRepository.save(d1);

        Document d2 = new Document();
        d2.setFamilyId(patelFamily.getId());
        d2.setType("income_certificate");
        d2.setDocNumber("INC-2026-9921");
        d2.setIssuedOn(LocalDate.parse("2026-01-10"));
        d2.setValidUntil(LocalDate.parse("2027-03-31"));
        d2.setFileUrl("/uploads/income_patel.pdf");
        d2.setVerified(true);
        documentRepository.save(d2);

        Document d3 = new Document();
        d3.setFamilyId(patelFamily.getId());
        d3.setType("birth_cert");
        d3.setDocNumber("BC-GJ-2020-001");
        d3.setIssuedOn(LocalDate.parse("2020-05-14"));
        d3.setFileUrl("/uploads/birth_priya.pdf");
        d3.setVerified(true);
        d3 = documentRepository.save(d3);

        // Members for Patel family
        Member mHead = new Member();
        mHead.setFamilyId(patelFamily.getId());
        mHead.setUserId(userHead.getId());
        mHead.setName("Ramesh Patel");
        mHead.setDob(LocalDate.parse("1984-04-12"));
        mHead.setGender("M");
        mHead.setRelationToHead("Self");
        mHead.setFamilyRole("head");
        mHead.setAccess("apply");
        mHead.setStatus("active");
        mHead.setIdType("aadhaar");
        mHead.setIdHash(verifierService.hashIdentity("990011223344"));
        mHead.setIdLast4("3344");
        mHead.setIdVerified(true);
        mHead = memberRepository.save(mHead);
        userHead.setMemberId(mHead.getId());
        userRepository.save(userHead);

        Member mSpouse = new Member();
        mSpouse.setFamilyId(patelFamily.getId());
        mSpouse.setUserId(userSpouse.getId());
        mSpouse.setName("Geeta Patel");
        mSpouse.setDob(LocalDate.parse("1987-08-25"));
        mSpouse.setGender("F");
        mSpouse.setRelationToHead("Spouse");
        mSpouse.setFamilyRole("member");
        mSpouse.setAccess("apply");
        mSpouse.setStatus("active");
        mSpouse.setIdType("aadhaar");
        mSpouse.setIdHash(verifierService.hashIdentity("990011223355"));
        mSpouse.setIdLast4("3355");
        mSpouse.setIdVerified(true);
        mSpouse = memberRepository.save(mSpouse);
        userSpouse.setMemberId(mSpouse.getId());
        userRepository.save(userSpouse);

        Member mBrother = new Member();
        mBrother.setFamilyId(patelFamily.getId());
        mBrother.setUserId(userBrother.getId());
        mBrother.setName("Bhavesh Patel");
        mBrother.setDob(LocalDate.parse("1991-02-14"));
        mBrother.setGender("M");
        mBrother.setRelationToHead("Brother");
        mBrother.setFamilyRole("member");
        mBrother.setAccess("view");
        mBrother.setStatus("active");
        mBrother.setIdType("aadhaar");
        mBrother.setIdHash(verifierService.hashIdentity("990011223366"));
        mBrother.setIdLast4("3366");
        mBrother.setIdVerified(true);
        mBrother = memberRepository.save(mBrother);
        userBrother.setMemberId(mBrother.getId());
        userRepository.save(userBrother);

        Member mChild = new Member();
        mChild.setFamilyId(patelFamily.getId());
        mChild.setName("Priya Patel");
        mChild.setDob(LocalDate.parse("2020-05-14"));
        mChild.setGender("F");
        mChild.setRelationToHead("Daughter");
        mChild.setFamilyRole("member");
        mChild.setAccess("view");
        mChild.setStatus("active");
        mChild.setIdType("birth_cert");
        mChild.setIdHash(verifierService.hashIdentity("BC-GJ-2020-001"));
        mChild.setIdLast4("0001");
        mChild.setIdVerified(true);
        mChild.setBirthCertDocId(d3.getId());
        mChild = memberRepository.save(mChild);
        d3.setMemberId(mChild.getId());
        documentRepository.save(d3);

        // Pre-enrolled application for Patel family: MA health cover
        Application appPatel = new Application();
        appPatel.setFamilyId(patelFamily.getId());
        appPatel.setSchemeId(2L);
        appPatel.setAppliedByMemberId(mHead.getId());
        appPatel.setStatus("active");
        appPatel.setStartDate(LocalDate.parse("2026-01-15"));
        appPatel.setEndDate(LocalDate.parse("2027-01-15"));
        appPatel.setBenefitTotal(500000L);
        appPatel.setBenefitUsed(35000L);
        appPatel.setFactsSnapshot("{\"district\":\"Ahmedabad\",\"income_annual\":180000}");
        applicationRepository.save(appPatel);

        // 5. Seed 30 realistic families across 4 districts
        log.info("Seeding 30 families across Ahmedabad, Surat, Rajkot, Vadodara...");
        List<String> districts = List.of("Ahmedabad", "Surat", "Rajkot", "Vadodara");
        List<String> lastNames = List.of("Shah", "Mehta", "Desai", "Vora", "Joshi", "Trivedi", "Solanki", "Parmar", "Chauhan", "Gohil");

        for (int i = 2; i <= 31; i++) {
            String district = districts.get(i % districts.size());
            String lastName = lastNames.get(i % lastNames.size());
            int income = 80000 + (i * 14000);
            String code = String.format("GJ-%s-%04d", district.substring(0, 3).toUpperCase(), 100 + i);

            Family fam = new Family();
            fam.setFamilyCode(code);
            fam.setDistrict(district);
            fam.setIncomeAnnual(new BigDecimal(income));
            fam.setRationCardRef(String.format("RC-%s-%d", district.substring(0, 3), 90000 + i));
            fam = familyRepository.save(fam);

            int headAge = 28 + (i % 45);
            int birthYear = 2026 - headAge;
            boolean isSenior = headAge >= 60;
            boolean hasWidow = (i % 7 == 0);
            boolean isDisabled = (i % 6 == 0);
            boolean hasStudent = (i % 5 == 0);
            String idNum = String.format("770011%06d", i);

            Member head = new Member();
            head.setFamilyId(fam.getId());
            head.setName("Kiran " + lastName);
            head.setDob(LocalDate.parse(String.format("%04d-03-15", birthYear)));
            head.setGender(i % 3 == 0 ? "F" : "M");
            head.setRelationToHead("Self");
            head.setFamilyRole("head");
            head.setAccess("apply");
            head.setStatus("active");
            head.setIdType("aadhaar");
            head.setIdHash(verifierService.hashIdentity(idNum));
            head.setIdLast4(idNum.substring(idNum.length() - 4));
            head.setIdVerified(true);
            head.setDisabled(isDisabled);
            head.setStudent(hasStudent);
            head.setWidowed(hasWidow);
            head = memberRepository.save(head);

            if (i % 2 == 0) {
                String childCertNo = String.format("BC-%s-%d", district.substring(0, 3), 8000 + i);
                Document childDoc = new Document();
                childDoc.setFamilyId(fam.getId());
                childDoc.setType("birth_cert");
                childDoc.setDocNumber(childCertNo);
                childDoc.setIssuedOn(LocalDate.parse("2021-06-01"));
                childDoc.setFileUrl("/uploads/sample_bc.pdf");
                childDoc.setVerified(true);
                childDoc = documentRepository.save(childDoc);

                Member child = new Member();
                child.setFamilyId(fam.getId());
                child.setName("Ananya " + lastName);
                child.setDob(LocalDate.parse("2021-06-01"));
                child.setGender("F");
                child.setRelationToHead("Daughter");
                child.setFamilyRole("member");
                child.setAccess("view");
                child.setStatus("active");
                child.setIdType("birth_cert");
                child.setIdHash(verifierService.hashIdentity(childCertNo));
                child.setIdLast4(childCertNo.substring(childCertNo.length() - 4));
                child.setIdVerified(true);
                child.setBirthCertDocId(childDoc.getId());
                child = memberRepository.save(child);

                childDoc.setMemberId(child.getId());
                documentRepository.save(childDoc);
            }

            Document incDoc = new Document();
            incDoc.setFamilyId(fam.getId());
            incDoc.setType("income_certificate");
            incDoc.setDocNumber(String.format("INC-%s-%d", district.substring(0, 3), 7000 + i));
            incDoc.setIssuedOn(LocalDate.parse("2026-01-01"));
            incDoc.setValidUntil(LocalDate.parse("2027-03-31"));
            incDoc.setFileUrl("/uploads/inc.pdf");
            incDoc.setVerified(true);
            documentRepository.save(incDoc);

            long schemeChoice = (i % 6) + 1;
            String appStatus = "active";
            String expReason = null;
            String revReason = null;
            Long revBy = null;
            long benefitUsed = 0;

            if (i % 4 == 0) {
                appStatus = "expired";
                expReason = "validity_ended";
            } else if (i % 5 == 0) {
                appStatus = "expired";
                expReason = "revoked";
                revReason = "Eligibility criteria no longer met after field inspection.";
                revBy = 1L;
            } else if (i % 7 == 0) {
                appStatus = "expired";
                expReason = "benefit_exhausted";
                benefitUsed = 500000;
            }

            Application app = new Application();
            app.setFamilyId(fam.getId());
            app.setSchemeId(schemeChoice);
            app.setAppliedByMemberId(head.getId());
            app.setStatus(appStatus);
            app.setStartDate(LocalDate.parse("2025-10-01"));
            app.setEndDate(LocalDate.parse("2026-10-01"));
            app.setBenefitTotal(500000L);
            app.setBenefitUsed(benefitUsed);
            app.setExpiredReason(expReason);
            app.setRevokeReason(revReason);
            app.setRevokedBy(revBy);
            app.setFactsSnapshot(String.format("{\"district\":\"%s\",\"income_annual\":%d}", district, income));
            applicationRepository.save(app);

            // Log attempt
            List<Map<String, Object>> checks = List.of(
                    Map.of("name", "permission", "passed", true),
                    Map.of("name", "identity", "passed", true),
                    Map.of("name", "scheme_open", "passed", true),
                    Map.of("name", "eligibility", "passed", i % 8 != 0),
                    Map.of("name", "documents", "passed", true),
                    Map.of("name", "duplicate", "passed", true),
                    Map.of("name", "create", "passed", i % 8 != 0)
            );
            ApplicationAttempt attempt = new ApplicationAttempt(fam.getId(), schemeChoice, head.getId(), i % 8 != 0, objectMapper.writeValueAsString(checks));
            attemptRepository.save(attempt);
        }

        log.info("✓ Spring Boot seeding completed successfully (6 schemes, 30 families, demo users, applications)!");
    }
}

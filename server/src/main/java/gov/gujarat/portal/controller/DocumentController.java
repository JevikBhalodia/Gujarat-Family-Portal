package gov.gujarat.portal.controller;

import gov.gujarat.portal.entity.Document;
import gov.gujarat.portal.entity.Member;
import gov.gujarat.portal.repository.DocumentRepository;
import gov.gujarat.portal.repository.MemberRepository;
import gov.gujarat.portal.security.UserPrincipal;
import gov.gujarat.portal.service.VerifierService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final MemberRepository memberRepository;
    private final VerifierService verifierService;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    public DocumentController(
            DocumentRepository documentRepository,
            MemberRepository memberRepository,
            VerifierService verifierService
    ) {
        this.documentRepository = documentRepository;
        this.memberRepository = memberRepository;
        this.verifierService = verifierService;
    }

    @GetMapping
    public ResponseEntity<?> getDocuments(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getFamilyId() == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Family context missing."));
        }

        List<Document> docs = documentRepository.findByFamilyIdOrderByCreatedAtDesc(principal.getFamilyId());
        List<Map<String, Object>> response = new ArrayList<>();

        for (Document d : docs) {
            String memberName = null;
            if (d.getMemberId() != null) {
                Optional<Member> m = memberRepository.findById(d.getMemberId());
                if (m.isPresent()) memberName = m.get().getName();
            }

            Map<String, Object> item = new HashMap<>();
            item.put("id", d.getId());
            item.put("family_id", d.getFamilyId());
            item.put("member_id", d.getMemberId());
            item.put("member_name", memberName);
            item.put("type", d.getType());
            item.put("doc_number", d.getDocNumber());
            item.put("issued_on", d.getIssuedOn());
            item.put("valid_until", d.getValidUntil());
            item.put("file_url", d.getFileUrl());
            item.put("verified", d.isVerified());
            item.put("created_at", d.getCreatedAt());

            response.add(item);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> uploadDocument(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("type") String type,
            @RequestParam("doc_number") String docNumber,
            @RequestParam(value = "member_id", required = false) Long memberId,
            @RequestParam(value = "issued_on", required = false) String issuedOnStr,
            @RequestParam(value = "valid_until", required = false) String validUntilStr,
            @RequestParam(value = "doc_file", required = false) MultipartFile docFile
    ) {
        if (principal == null || principal.getFamilyId() == null) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden: You must belong to an active family."));
        }

        if (!principal.canApply()) {
            return ResponseEntity.status(403).body(Map.of("error",
                    "Forbidden: You have 'view' only access. Uploading documents requires 'apply' permission."));
        }

        if (type == null || type.isBlank() || docNumber == null || docNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Document type and document number are required."));
        }

        VerifierService.DocVerificationResult verResult = verifierService.verifyDocument(
                type, docNumber.trim(), null, null, null, null
        );

        if (!verResult.verified) {
            return ResponseEntity.badRequest().body(Map.of("error", verResult.error));
        }

        String fileUrl = "/uploads/sample_verified_doc.pdf";
        if (docFile != null && !docFile.isEmpty()) {
            try {
                File dir = new File(uploadDir);
                if (!dir.exists()) dir.mkdirs();

                String ext = "";
                String orig = docFile.getOriginalFilename();
                if (orig != null && orig.contains(".")) {
                    ext = orig.substring(orig.lastIndexOf("."));
                }
                String fileName = "doc_" + UUID.randomUUID() + ext;
                Path target = Paths.get(uploadDir, fileName);
                Files.write(target, docFile.getBytes());
                fileUrl = "/uploads/" + fileName;
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("error", "Failed to save file: " + e.getMessage()));
            }
        }

        Document document = new Document();
        document.setFamilyId(principal.getFamilyId());
        document.setMemberId(memberId);
        document.setType(type.trim());
        document.setDocNumber(docNumber.trim());
        if (issuedOnStr != null && !issuedOnStr.isBlank()) {
            document.setIssuedOn(LocalDate.parse(issuedOnStr));
        }
        if (validUntilStr != null && !validUntilStr.isBlank()) {
            document.setValidUntil(LocalDate.parse(validUntilStr));
        }
        document.setFileUrl(fileUrl);
        document.setVerified(true);

        Document saved = documentRepository.save(document);

        return ResponseEntity.status(201).body(Map.of(
                "success", true,
                "message", type.replace('_', ' ') + " verified and stored in family document locker.",
                "document", saved
        ));
    }
}

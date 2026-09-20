package gov.gujarat.portal.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.HexFormat;

@Service
public class VerifierService {

    private final String hashSalt;

    public VerifierService(@Value("${app.hash.salt:gujarat_gov_salt_secure_99}") String hashSalt) {
        this.hashSalt = hashSalt;
    }

    public String hashIdentity(String rawId) {
        if (rawId == null || rawId.isBlank()) {
            throw new IllegalArgumentException("Missing ID identifier to hash");
        }
        String cleaned = rawId.trim().replaceAll("[\\s-]", "");
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(hashSalt.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hashBytes = sha256Hmac.doFinal(cleaned.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error hashing identity document", e);
        }
    }

    public static class IdVerificationResult {
        public final boolean verified;
        public final String idHash;
        public final String idLast4;
        public final String error;
        public final String provider;

        public IdVerificationResult(boolean verified, String idHash, String idLast4, String error, String provider) {
            this.verified = verified;
            this.idHash = idHash;
            this.idLast4 = idLast4;
            this.error = error;
            this.provider = provider;
        }

        public static IdVerificationResult success(String idHash, String idLast4) {
            return new IdVerificationResult(true, idHash, idLast4, null, "UIDAI_STUB");
        }

        public static IdVerificationResult failure(String error) {
            return new IdVerificationResult(false, null, null, error, null);
        }
    }

    public IdVerificationResult verifyId(String idType, String idNumber, String name, LocalDate dob) {
        if (idNumber == null || idNumber.isBlank()) {
            return IdVerificationResult.failure("ID number is required.");
        }
        String cleaned = idNumber.trim().replaceAll("[\\s-]", "");
        if ("aadhaar".equalsIgnoreCase(idType) && !cleaned.matches("^\\d{12}$")) {
            return IdVerificationResult.failure("Aadhaar must be a 12-digit number.");
        }

        String idHash = hashIdentity(cleaned);
        String idLast4 = cleaned.length() >= 4 ? cleaned.substring(cleaned.length() - 4) : cleaned;

        return IdVerificationResult.success(idHash, idLast4);
    }

    public static class DocVerificationResult {
        public final boolean verified;
        public final String error;
        public final String docNumber;
        public final String provider;

        public DocVerificationResult(boolean verified, String error, String docNumber, String provider) {
            this.verified = verified;
            this.error = error;
            this.docNumber = docNumber;
            this.provider = provider;
        }

        public static DocVerificationResult success(String docNumber) {
            return new DocVerificationResult(true, null, docNumber, "CIVIL_REGISTRATION_SYSTEM_STUB");
        }

        public static DocVerificationResult failure(String error) {
            return new DocVerificationResult(false, error, null, null);
        }
    }

    public DocVerificationResult verifyDocument(
            String type,
            String docNumber,
            String expectedName,
            LocalDate expectedDob,
            String certName,
            LocalDate certDob
    ) {
        if (docNumber == null || docNumber.isBlank() || type == null || type.isBlank()) {
            return DocVerificationResult.failure("Document type and number are required.");
        }

        if ("birth_cert".equalsIgnoreCase(type)) {
            String cleanedDoc = docNumber.trim();
            if (cleanedDoc.length() < 4) {
                return DocVerificationResult.failure("Invalid Birth Certificate registration number.");
            }

            if (certName != null && expectedName != null) {
                String cName = certName.toLowerCase().trim();
                String eName = expectedName.toLowerCase().trim();
                if (!cName.contains(eName) && !eName.contains(cName)) {
                    return DocVerificationResult.failure(
                            String.format("Name on birth certificate ('%s') does not match member name ('%s').", certName, expectedName)
                    );
                }
            }

            if (certDob != null && expectedDob != null && !certDob.equals(expectedDob)) {
                return DocVerificationResult.failure(
                        String.format("Date of birth on certificate (%s) does not match child record (%s).", certDob, expectedDob)
                );
            }
        }

        return DocVerificationResult.success(docNumber.trim());
    }
}

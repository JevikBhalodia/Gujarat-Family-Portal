package gov.gujarat.portal.service;

import gov.gujarat.portal.entity.AuditLog;
import gov.gujarat.portal.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void logAudit(Long actorId, String action, String entity, Long entityId, String details) {
        try {
            AuditLog auditLog = new AuditLog(actorId, action, entity, entityId, details);
            auditLogRepository.save(auditLog);

            // Append to CHANGES.log if accessible
            String now = LocalDateTime.now().format(FORMATTER);
            String line = String.format("[%s] AUDIT: %s on %s#%d by user#%d%s\n",
                    now, action, entity, entityId != null ? entityId : 0, actorId != null ? actorId : 0,
                    (details != null && !details.isBlank()) ? " - " + details : "");

            File changeLog = new File("../CHANGES.log");
            if (!changeLog.exists()) {
                changeLog = new File("CHANGES.log");
            }
            if (changeLog.exists()) {
                try (PrintWriter out = new PrintWriter(new FileWriter(changeLog, true))) {
                    out.print(line);
                }
            }
        } catch (Exception e) {
            log.error("Failed to write audit log: {}", e.getMessage());
        }
    }

    public void logAudit(Long actorId, String action, String entity, Long entityId) {
        logAudit(actorId, action, entity, entityId, "");
    }
}

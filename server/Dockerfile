# Multi-stage Dockerfile for Spring Boot 3 (Java 21)
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build application
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy built jar
COPY --from=builder /build/target/*.jar app.jar

# Ensure uploads and data directories exist
RUN mkdir -p ./uploads ./data

# Environment defaults (can be overridden in Render dashboard)
ENV PORT=8080
ENV SPRING_DATASOURCE_URL="jdbc:h2:file:./data/gujarat_portal;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE"
ENV SPRING_JPA_HIBERNATE_DDL_AUTO="update"
ENV APP_JWT_SECRET="supersecret_gujarat_portal_key_2026_spring_boot_enterprise_jwt_salt_super_long_key_for_sha256"
ENV APP_HASH_SALT="gujarat_gov_salt_secure_99"
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]

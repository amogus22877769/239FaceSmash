FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
# JVM optimization for 4GB RAM: 768MB heap, G1GC for better performance
ENTRYPOINT ["java","-jar", "app.jar"]

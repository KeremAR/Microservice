FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/departman-service-0.0.1-SNAPSHOT.jar department-service.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "department-service.jar"]
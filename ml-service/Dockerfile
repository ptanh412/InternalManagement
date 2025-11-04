# ML Service Dockerfile
FROM openjdk:17-jdk-slim

# Install Python and required packages for ML integration
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy Python ML training package
COPY ml-training-python/ /app/ml-training-python/

# Create Python virtual environment and install dependencies
RUN cd /app/ml-training-python && \
    python3 -m venv venv && \
    . venv/bin/activate && \
    pip install --no-cache-dir -r requirements.txt

# Copy Maven files
COPY pom.xml /app/
COPY .mvn/ /app/.mvn/
COPY mvnw /app/
RUN chmod +x /app/mvnw

# Download dependencies (this layer will be cached)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src/ /app/src/

# Build the application
RUN ./mvnw clean package -DskipTests

# Create directories for models and logs
RUN mkdir -p /app/models /app/model-backups /var/log/ml-service

# Expose port
EXPOSE 8090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8090/ml-service/actuator/health || exit 1

# Set environment variables
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xmx2g -Xms1g"
ENV PYTHON_PATH="/app/ml-training-python"

# Run the application
CMD ["sh", "-c", "java $JAVA_OPTS -jar /app/target/ml-service-1.0.0.jar"]
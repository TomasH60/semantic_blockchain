# Use an official slim Python image (based on Alpine Linux)
FROM python:3.10-alpine

# Set working directory
WORKDIR /app

# Copy all backend files
COPY . .

# Install system dependencies
RUN apk add --no-cache wget unzip openjdk11 bash

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Ontop CLI
RUN wget https://github.com/ontop/ontop/releases/download/ontop-5.3.0/ontop-cli-5.3.0.zip \
    && unzip -q -o ontop-cli-5.3.0.zip -d ontop-cli \
    && rm ontop-cli-5.3.0.zip \
    && chmod +x ontop-cli/ontop \
    && wget https://jdbc.postgresql.org/download/postgresql-42.7.5.jar \
    && mkdir -p ontop-cli/jdbc \
    && mv postgresql-42.7.5.jar ontop-cli/jdbc/

# Install Apache Jena (riot)
RUN wget https://archive.apache.org/dist/jena/binaries/apache-jena-5.4.0.tar.gz \
    && tar -xzf apache-jena-5.4.0.tar.gz \
    && mv apache-jena-5.4.0 jena \
    && rm apache-jena-5.4.0.tar.gz \
    && chmod +x jena/bin/*

# Expose API
CMD ["bash", "-c", "ENV_PATH=.env.docker uvicorn main:app --host 0.0.0.0 --port 8000"]

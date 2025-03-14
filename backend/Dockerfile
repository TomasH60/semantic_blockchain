# Use an official Python image
FROM python:3.10

# Set the working directory inside the container
WORKDIR /app

# Copy the FastAPI backend code
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Ensure Ontop CLI (version 5.3.0) is installed
RUN wget https://github.com/ontop/ontop/releases/download/ontop-5.3.0/ontop-cli-5.3.0.zip \
    && unzip ontop-cli-5.3.0.zip -d ontop-cli \
    && rm ontop-cli-5.3.0.zip \
    && chmod +x ontop-cli/ontop.bat \
    && wget https://jdbc.postgresql.org/download/postgresql-42.7.5.jar \
    && mv postgresql-42.7.5.jar ontop-cli/jdbc/ \
    && apt update \
    && apt install bash-completion \
    && apt install -y default-jdk


CMD ["bash", "-c", "ontop-cli/ontop endpoint --ontology=ontology.owl --mapping=mapping.obda --properties=ontop.properties & uvicorn main:app --host 0.0.0.0 --port 8000"]


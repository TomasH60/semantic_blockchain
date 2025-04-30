# BP Semantic Blockchain

## Introduction
This project focuses on applying the Semantic Web principles on top of a blockhain for enhanced data transformation and exploration. 
This implementation uses the TRON blockchain for data gathering, but in theory is blockchain agnostic, provided that the indexer is setup sufficiently for a different blockchain.

## Features
- Web GUI for accessing and interacting with the transformed data
- SPARQL endpoint via Ontop
- Reasoning over the transformed data
- Semantic graph visualization tool for exploring the data
- Data dump export in formats: RDF/XML, Turtle, JSON-LD
## Requirements

Here listed are the requirements required in order to run this project locally:
- **Unix based** development enviroment (Ubuntu, Debian, WSL,  macOS...)
- **Postgres JDBC driver** version >= 42.7.x
- **Python** version >= 3.13.x
	- **pip** version >= 25.0.x
- **Node** version >= 23.11.x
	- **npm** verstion >= 10.9.x
- **Docker** version >= 28.1.x
	- **Docker daemon** 
	-  or **colima** (for macOS) version >= 0.8.x
	- **Docker compose** version >= 2.27.x
- **Ontop cli** version >= 5.3.x
- **Apache Jena cli** version >= 5.4.x

## Installation

This installation manual goes through the installation process on Ubuntu and macOS as an example.
###  1. Clone the Repository
```bash
git clone git@github.com:TomasH60/semantic_blockchain.git
cd semantic_blockchain
```
### 2. Install Python and pip
On **Ubuntu**:
```bash
sudo apt update
sudo apt install python3
```

On **macOS** (via brew):

```bash
brew install python3
```

### 3. Install Node and npm 

On **Ubuntu**, install nvm:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
```
then Node via nvm:
```bash
nvm install --lts
```
On **macOS** (via brew):

```bash
brew install node
```

### 4. Install Docker, and Docker Compose

On **Ubuntu**:

```bash
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
```

 On **macOS** (via brew with colima):

```bash
brew install docker colima
colima start
docker context use colima
```


### 5. Install Ontop CLI 

Inside the backend directory install the Ontop CLI: 
```bash
cd backend
wget https://github.com/ontop/ontop/releases/download/ontop-5.3.0/ontop-cli-5.3.0.zip
unzip ontop-cli-5.3.0.zip -d ontop-cli
rm ontop-cli-5.3.0.zip
chmod +x ontop-cli/ontop
```

Install and add the Postgres JDBC driver to ontop-cli:
```bash
wget https://jdbc.postgresql.org/download/postgresql-42.7.5.jar
mv postgresql-42.7.5.jar ontop-cli/jdbc/
```

### 6. Install Apache Jena CLI

Download and extract Apache Jena CLI:
```bash
wget  https://archive.apache.org/dist/jena/binaries/apache-jena-5.4.0.tar.gz
tar -xzf apache-jena-5.4.0.tar.gz
rm apache-jena-5.4.0.tar.gz
mv apache-jena-5.4.0 jena-cli
chmod +x jena-cli/bin/*
```
## Running the project
 ### Indexer
Inside the the **indexer** directory, install the required packages:
 ```bash
 npm install
 ```
 after all the packages have been installed, start the database container: 
  ```bash
docker compose up -d
 ```
 then, apply the provided database migration:
 ```bash
npx squid-typeorm-migration apply
 ```
 ### Backend
 Inside the **backend** directory, setup and activate a python virtual enviroment:
 
 ```bash
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r requirements.txt
```

after all the libraries have been downloaded, start the FastAPI backend:
```bash
uvicorn  main:app  --host  0.0.0.0  --port  8000
```

### Frontend
Inside the **frontend** directory run the following to install the required packages:
 ```bash
npm install
```
after all the packages have been downloaded, start the web application:
 ```bash
npm start
```
Now the application is running at `localhost:3000`.

# BP Semantic Blockchain

## Introduction
This project focuses on applying the Semantic Web principles on top of a blockhain for enhanced data transformation and exploration. 
This implementation uses the TRON blockchain for data gathering, but in theory is blockchain agnostic, provided that the indexer is setup sufficiently for a different blockchain.

This project was created as a part of my bachelor thesis at [FIIT STU](https://www.fiit.stuba.sk/) Bratislava.

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
(downloading the libraries is only necessary once per setup of the project)

after all the libraries have been downloaded, start the FastAPI backend:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
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

## Examples
Here listed are examples of the projects functionalities: 
### Dashboard
This page displays the indexer statistics, data composition and controls for the Ontop endpoint, Subsquid indexer and exporting options:

![enter image description here](https://i.postimg.cc/qRdHpqf7/Screenshot-2025-04-30-at-23-39-50.png)
The user has the option of running the Ontop SPARQL endpoint either from the database based on a .obda mapping, located in `semantic_blockchain/backend/config/mapping.obda` or from a .rdf dump, which can be upladed to the web.

Then, there are the options for exporting the database to the selected fromat based on the mapping discussed previously.

Next are the indexer controls for starting or stopping the indexer. The block range that the user wants to indexed is defined as environment variables in `semantic_blockchain/indexer/.env`.  Setting the `END_BLOCK_NUMBER` variable to `-1` will index data until the latest block and continue indexing the blocks in real time. Setting the variable `START_BLOCK_NUMBER` to `-1` will index blocks from the genesis block.
Subsquid by default remembers the last indexed block number. To reset it execute `DROP SCHEMA squid_processor CASCADE;` inside the postgres container to reset the last indexed block number.

After starting the indexer, statistics will get displayed:
![enter image description here](https://i.postimg.cc/LsX5PgPC/obr-zok.png)
the displayed  statistics represent the current data stored in the database, the block range indexed, the numbers of blocks, internal transactions, transactions and events indexed and the rates at which each item gets indexed. Under the statistics are displayed numbers of each transaction type and event type indexed.

Bellow is a live indexer performance graph:
![enter image description here](https://i.postimg.cc/TYH59XjY/obr-zok.png)
Under the graph are displayed pie charts of transaction and event composition indexed by transaction and event types:
![enter image description here](https://i.postimg.cc/qRTdHzrB/obr-zok.png)
### SPARQL Query

This page enables the user to write and execute SPARQL queries against the Ontop endpoint:
![enter image description here](https://i.postimg.cc/X7pN8B7t/obr-zok.png)
### Inference Editor
This page enables the user to write custom classes defined in the OWL 2R standard, and run a Hermit reasoner against the uploaded data and ontology, located at `semantic_blockchain/backend/config/ontology.owl`. The output gets automatically downloaded to the browser.
![enter image description here](https://i.postimg.cc/pLQ1gks7/obr-zok.png)
### Graph

This page enables the user to upload a database dump in the `.ttl` format and explore the data using different modes.
![enter image description here](https://i.postimg.cc/Hnq84w54/obr-zok.png)
The current image is a visual representation of the block number `70004358` on the TRON blockchain. Each node in the graph (based on a predefined mapping) one of these types differentiated by color: `block`, `transfer_event`, `transfer_contract_transaction` and `trigger_smart_contract_transaction`.

The `Reset View` option returns the user to the full view of the graph.

Clicking on any node isolates it:
![enter image description here](https://i.postimg.cc/vTGXW6RK/obr-zok.png)
By selecting the option `Show All Labels`, the atributes and relationships of the node are shown.

The user can then check the `Expand mode` option and expand each nodes related attribute by clicking on it:
![enter image description here](https://i.postimg.cc/8cWJPZnQ/obr-zok.png)

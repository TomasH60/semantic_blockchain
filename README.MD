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
- **Nginx** version >= 1.25.x
- **Docker** version >= 28.1.x
	- **Docker daemon** 
	-  or **colima** (for macOS) version >= 0.8.x
	- **Docker compose** version >= 2.27.x
- **Ontop cli** version >= 5.3.x
- **Apache Jena cli** version >= 5.4.x
- **EYE reasoner** version >= 2025.05.xx

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
### 4. Install Nginx

On **Ubuntu**:
```bash
sudo apt update
sudo apt install nginx
```


On **macOS** (via Homebrew):
```bash
brew install nginx
```


### 5. Install Docker, and Docker Compose

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


### 6. Install Ontop CLI 

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

### 7. Install Apache Jena CLI

Download and extract Apache Jena CLI:
```bash
wget  https://archive.apache.org/dist/jena/binaries/apache-jena-5.4.0.tar.gz
tar -xzf apache-jena-5.4.0.tar.gz
rm apache-jena-5.4.0.tar.gz
mv apache-jena-5.4.0 jena-cli
chmod +x jena-cli/bin/*
```
### 8. Install EYE Reasoner

On **Ubuntu**:

```bash
cd backend
sudo apt update
sudo apt install swi-prolog git
git clone https://github.com/eyereasoner/eye.git
cd eye
```

On **macOS** (via Homebrew):

```bash
cd backend
brew install swi-prolog git
git clone https://github.com/eyereasoner/eye.git
cd eye
```
For both:

- Test the SWI-Prolog installation via command line `swipl --version` and it should return the installed version number.

- Run the installation script `install.sh [--prefix=Prefix]`.  The default prefix is /usr/local.  This will
    - create the EYE image file at `$prefix/lib/eye.pvm`
    - create the EYE launch script eye ub `$prefix/bin/eye`
    
 See [Install EYE Reasoner](https://github.com/eyereasoner/eye/tree/master) for more information.


## Running the project
 ### Indexer
Inside the the **indexer** directory, install the required packages:
 ```bash
 npm install
 ```
 configure the .env file `indexer/.env` 
 
 start the database container: 
  ```bash
docker compose up -d
 ```
 then, apply the provided database migration:
 ```bash
npx squid-typeorm-migration apply
 ```
 
configure the Nginx config file `indexer/nginx.conf` and then start the Nginx reverse proxy:
```bash
sudo nginx -c "$(pwd)/nginx.conf"
```
(to stop the proxy run `sudo nginx -s stop`)
 ### Backend
 Inside the **backend** directory, setup and activate a python virtual enviroment:
 
 ```bash
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r requirements.txt
```
(downloading the libraries is only necessary once per setup of the project)

configure the .env file `backend/.env`

start the FastAPI backend:
```bash
ENV=.env uvicorn src.main:app --host 0.0.0.0 --port 8000
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

![68747470733a2f2f692e706f7374696d672e63632f71526448707166372f53637265656e73686f742d323032352d30342d33302d61742d32332d33392d35302e706e67.png](<https://media-hosting.imagekit.io/faf02dc45c8e46c7/68747470733a2f2f692e706f7374696d672e63632f71526448707166372f53637265656e73686f742d323032352d30342d33302d61742d32332d33392d35302e706e67.png?Expires=1841660569&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=KsOmYqdcO-Vm~EytTCPkOAXFs4pCA1bT6xqNyg5PHmWVir-wRLm4O8dIgVpM2iht-uVnKtPdv9D1pjBFOZGHWRXo17G~eoa1zBrXgwVaNS~cgVXQVAcXjB8T0lvBhPfTjfnHO1zD7VjPL1OIK~HXtzAZmTY0K-SQ3pRo~O-voSRtctGTeWJ0W8IW2~~K6~4l2xmRw3KmEp6Nb5eIg5CwMFxCPQIlJlV9FGDLdmycCkHRCMwcFNxrELevPvsTaFA0C-Ya0XUmB0vBA-hOUy58XEl9kqPAd7n9NN9JnDWdSa4DQG3qpt59YFNlPGx7UUGnStkMzorOSHwgR-zGC7tNTA__>)

The user has the option of running the Ontop SPARQL endpoint either from the database based on a .obda mapping, located in `semantic_blockchain/backend/config/mapping.obda` or from a .rdf dump, which can be upladed to the web.

Then, there are the options for exporting the database to the selected fromat based on the mapping discussed previously.

Next are the indexer controls for starting or stopping the indexer. The block range that the user wants to indexed is defined as environment variables in `indexer/.env`.  Setting the `END_BLOCK_NUMBER` variable to `-1` will index data until the latest block and continue indexing the blocks in real time. Setting the variable `START_BLOCK_NUMBER` to `-1` will index blocks from the genesis block.
Subsquid by default remembers the last indexed block number. To reset it execute `DROP SCHEMA squid_processor CASCADE;` inside the postgres container to reset the last indexed block number.

After starting the indexer, statistics will get displayed:

![68747470733a2f2f692e706f7374696d672e63632f4c735835506750432f6f62722d7a6f6b2e706e67.png](<https://media-hosting.imagekit.io/32c49a40854e4314/68747470733a2f2f692e706f7374696d672e63632f4c735835506750432f6f62722d7a6f6b2e706e67.png?Expires=1841660569&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=q-PTHZbr2Px9pGgZ3ZclKqhg4Hz0bZ1QXCFHDdwKmJUqPOczDIw~I88jx3AofCbFAsY4VZlve-PcRTvOi-jKSYFbXI~3g5o~zkk78n9Se7a8fdBiL81WI03DaK6uesEZdUo6ZxSyPV3k3BSaCxLJCBUuyd~7Dj1dbi1XKVSYcAGqzyLFvNc0SVz4TefNb-J6rVBsTODkM4OON44aCiKguyNfz6dRJebtMv0yjeJATd~Zl8iF0iYh1RWbdpTSpJCyok83FRSze5KDUeq6eYiPQ2btptRsda3w6Q2WvNyW3bvuZ23zk1sKp8F69HrwSGoMPM51u3CMblpTFPQFODGMRw__>)

the displayed  statistics represent the current data stored in the database, the block range indexed, the numbers of blocks, internal transactions, transactions and events indexed and the rates at which each item gets indexed. Under the statistics are displayed numbers of each transaction type and event type indexed.

Bellow is a live indexer performance graph:

![68747470733a2f2f692e706f7374696d672e63632f5459483539586a592f6f62722d7a6f6b2e706e67.png](<https://media-hosting.imagekit.io/003234126ceb408c/68747470733a2f2f692e706f7374696d672e63632f5459483539586a592f6f62722d7a6f6b2e706e67.png?Expires=1841660569&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=BkzCA42QyuoSPJk8~C0hrhL1qwhGhcyJVO04oRhXGVuGOBn8Cu~f8TsUgqZ3jBBi-ghA60J0R-uHN6ejjaUTwBGku2Ls2X2aPX1bccDN-Vnxjy3JqFQv7Y5N0cH0W8C9-jIhCp25sIGv-0vMP8Crc6FpE-cB3nHWsDgz6FBQgJP7rXpwKdQLRZ8QAsD1xXor6S9XTidTOfeYxYIByC7r7f0mC25BP6sMfY5fGQjxdFB5e0xZu6ZF3555ZuekYaUJIMduFn4X6vYEp5FNgQxeQbOoxvxgsKxOjKVzdJ2Wzy-0lT0B3lpGE5SCOqCcz5nbydGxnTFVJtjro~tQA18T9Q__>)

Under the graph are displayed pie charts of transaction and event composition indexed by transaction and event types:

![68747470733a2f2f692e706f7374696d672e63632f71525464487a72422f6f62722d7a6f6b2e706e67.png](<https://media-hosting.imagekit.io/779aaa7811a34482/68747470733a2f2f692e706f7374696d672e63632f71525464487a72422f6f62722d7a6f6b2e706e67.png?Expires=1841660569&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=0LgTmoSBQC1cHzlZGoltCLKCKWyIjTa8rSH2J~VFjHD1NelpnWLr9lz1EQ38b-Bb4lz4PIeGhm4kXmT7pe7WWn2Mo0u3omac2YmnsmUfYZHm43sQstBB8DlOon-XcPZKXjiYngY4nCeHuzAIOH2LjyrfHsyZh55GtdSa9zaBky3pGqRFz~aY9Z8ZHlbtqev4TqyC0m9VDw9c0domltQ3KXFee6b8HkwiWKz6JSTYdgFfeb0y3no0J-VE7fczUwKC3Qtk9L9Ur3-kDGyzs0noSkw2QB1tQiMANHo1laQV69hlcxX8oyIEebRAh0T2u97kSh4CIzDOmbt756uJYjfcKQ__>)

### SPARQL Query

This page enables the user to write and execute SPARQL queries against the Ontop endpoint:

![68747470733a2f2f692e706f7374696d672e63632f5837704e384237742f6f62722d7a6f6b2e706e67.png](<https://media-hosting.imagekit.io/f6d7731367b04f65/68747470733a2f2f692e706f7374696d672e63632f5837704e384237742f6f62722d7a6f6b2e706e67.png?Expires=1841660569&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=ITMwxbrd7helrKnm-i-sitQ9En-qkXH5JeW2pQ-XhM8XKe6Hkc7GlwkedYyxp0U2Kdao~wX7Y0z1LzJWLGawb57D48apI7XhsFKTZnQcy073tCq51QOwvBmo4O4h5jdgOL6-Nxpq-wWaTYXAthopQ4A4~bVYbssr0JeK0OihLc06bJuqToQjydYlqZX7k5L7Ojivk-ljNPwqAd6AyE0MEDzLBBvZ4IGw1uUz~CyF6-GMSf20LyCZafhKikk4XVFLMkpWnMxotFyiPqyu~XwiCv7We4vEnFN7811bqJRjz94KGSfDa17iY6ujwRSLVtP~21hIviN0SKQEaY58U1a7MA__>)

### Reasoner
This page enables the user to write custom rules, and run the EYE reasoner on the uploaded data and the ontology located at `semantic_blockchain/backend/config/ontology.owl`. The output gets automatically downloaded to the browser and reasoner stats get displayed.

![68747470733a2f2f692e706f7374696d672e63632f354e4d70545147372f696d6167652e706e67.png](<https://media-hosting.imagekit.io/bd64e31997a24854/68747470733a2f2f692e706f7374696d672e63632f354e4d70545147372f696d6167652e706e67.png?Expires=1841660569&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=zRIQn2U7MgFWXVkJo5~MIEdI1nkRWngZ2G5XfePxtHqqQVSV-FkEpzygTn8sW2RFcb-Z~Y8PlSpxail-5fNeibJRhzJHo5dO7NUSZo~zp20-WHdGlJH22rsC5rQqUPBVfheEbJXoLtGJMneXRiO9u0I9HY1PaNr9qOtE8HLPSV6kvmqBV04gYCA0dmbEGtabBSuYU7jFu71RYqG03LAtIHsX0qLPq9hwYGAcUz467PP~WjlaTZXTR8-Wki0lBq6UWOexMVmjjxykG47lECCTjFQ12il8WyNtRhrFJ-HYGznFJHIgHmWO57~0VVWBz7gBqk14LZFfeKZ3seLcBux2vA__>)

after running the reasoner:

![68747470733a2f2f692e706f7374696d672e63632f59434350446d4c632f696d6167652e706e67.png](<https://media-hosting.imagekit.io/ef3d16a5b17d48ed/68747470733a2f2f692e706f7374696d672e63632f59434350446d4c632f696d6167652e706e67.png?Expires=1841660569&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=UcnkikxNzO~TaOjluG8RXReVYBa-77EG5r1tMxemhlOl6434WzBlByxNbUL~TkkoXbUbyqLQ37m8ATK~c~LEGOXAfHj7zefkU6dEwAofEQ3Hh8Q1xDdvqZobIwzeb8KvotOfp1TBY~X8YHYOV09-ziaTNiR5g8spyiiSwtwVPnFJsqfI7bATW~~YPp~1y~YU6G1Vww7bmfT4Y1n5d~b4kMzSy7XvQr2D2nQBna3e3HARjoOiZICpw1DS14wNg4XHov6CY5qC1P9Yumvg4pVubmqHx1JTKQ0cxZEuDHJPD6i-1-lkSLHvSvkV~ejlYsglZQXKzAdyNKivjNEBETCzmQ__>)

### Graph

This page enables the user to upload a ontology in the database dump in the `.owl` format and the data dump in `.n3` format and explore the data using different modes.

![68747470733a2f2f692e706f7374696d672e63632f6e684b766d6468702f696d6167652e706e67.png](<https://media-hosting.imagekit.io/597eda7d0d59469c/68747470733a2f2f692e706f7374696d672e63632f6e684b766d6468702f696d6167652e706e67.png?Expires=1841660569&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=2MejmTgWSyt0VcqLtE6VH8UBFZk0HMeu9xeht0PhkEcBfIH9rsHFWkVSdtiygPafSG80YwNocsWXpDWjisvYU8oH0uMYNnFK0~chpqG3iJ8duik-OOzWJ1O4~7Xj4WAMHIUNuvc-7-i9oTvDjbB1VTcSHboNsW8iT5-k~H1r4aPR-~nsBYjb4UFEf6pQM7Ic6GaWuhi7OjcGjwUXmFsk1KpHqwE9NTaLR3SIXviikrUnLqyZbcPUkDwdzHdq6XOd1Ea9mQmEzif2XhArlTfZPBaij7vtpE2AOP1HfleGRFeRlq-4jIYuaFlH3UM~uJG3QZ9Jg25m~rQlYDq7-mXJeA__>)

After uploading the ontology and the n3 data dump:

![68747470733a2f2f692e706f7374696d672e63632f507264343470506d2f696d6167652e706e67.png](<https://media-hosting.imagekit.io/7dd121950ceb49b3/68747470733a2f2f692e706f7374696d672e63632f507264343470506d2f696d6167652e706e67.png?Expires=1841660569&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=c0zwzeYoasyL7yozMd2XDlIF-jq90GkbZG01RYLBtZGa3aBuuHy3p3FfUjdT34DDwerEpUwtpqVZQiZHOV4f-dTmuqNtf5Rm~0QRT4ytgAv7~sQf9n86PQcTft2cpXN3FsMi9bntr-MfZTxANUZ~u0Sm~i8b2b7BssQdor65DKsFRoKadFYy6-5mjYNxyZch0ia2rqEd84y6ckM-Yc5CrkQ5Uw-yyYMSIIRSJ2WpzpHAOpub53Tz7ik3mFVjJ8oN0jOZTVvTuWlXxD8Gh7Hpe~sNAW9SYgAN3iLEhZjld7tAR8p5mm2bNm0-dDok2JISdUhBJ4frONhgpHA7eFTG5g__>)

The current image is a visual representation of the block number `71964500` on the TRON blockchain. The list at the top lists all of the classes in the current graph along with their color and count on the graph.

The `Reset View` option returns the user to the full view of the graph.

Clicking on any node isolates it:

![68747470733a2f2f692e706f7374696d672e63632f676a74486a346d6d2f696d6167652e706e67.png](<https://media-hosting.imagekit.io/05183298e8de41bf/68747470733a2f2f692e706f7374696d672e63632f676a74486a346d6d2f696d6167652e706e67.png?Expires=1841660569&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=nizCw4m2pOGZUHC1NFx0gG1~WCb-qxUOlJvpCBCSmJJyUn0dhrbTrYBo3b-HdiziVvhVjwKmRxlfoNgxBOweN3nGrsdfth186BLCsHDY88ZsLBuSvro-pGeToM-63zChLHkx50MbPo33dwfEUA2T40l9zcDDSu3sUIinOUpEATwIJ0zjMiocdsHx1JMX1yrkpcQT2TjSFQAQQnMoIERJicCOIx4l3D2Gt9KakA~~O766fl62vM274px5tAbvjCvEmfT1fgo0buJliq7FLOUuDD06cBlRZHr3INCdjdFN3utS4Favlnrl8Yn5umU7~4yIrqvLeejhblhFFPIcJhNxIQ__>)

By selecting the option `Show All Labels`, the atributes and relationships of the node are shown.

The user can then check the `Expand mode` option and expand each nodes related attribute by clicking on it:

![enter image description here](<https://media-hosting.imagekit.io/f383e9d5a24b4e69/screenshot_1747051748337.png?Expires=1841659749&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=ZpnyTUO7YvB5mZIlkr8Duo5HgeBaVmSQPJtu6hol3zEb9ggDxm7eYGEMM5BT8VFQlowQTqRb14KCzRRika5TN-Hz1tejueVlLkww0le2hefV3I1~T8VJsvy2VyvypapRZGAmaRDyclzE5KwIGk9QttbGQImafC77B1RtuCca~~HbCymd2d633RoL18L1Qw20jd2b3t2lLTgNyMRc5AqY4cZzELxdyleYvJah0gus1iKNj989-7SnoKM36auOg1cnFPFDvTEk~Zb6XV080kA1ws6fL2l3HHRqQW3Eswxe8ImE6JBKzvzXLKIHrZe436Yp7UjDRDcMgFeG47nYf9GFxw__>)

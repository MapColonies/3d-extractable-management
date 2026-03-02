# 3D Extractable Management

The service provides a REST API for managing 3d _extractable_ records with validation, audit logging, and user authentication. The service ensures proper authorization before creating or deleting records and stores relevant metadata for each record.

---

## Functionality

The service performs the following key tasks:

- **Record Management:**  
  Create, read, and delete extractable records. The server automatically assigns `id` and `authorizedAt`.

- **Validation:**  
  Before creating or deleting records, requests go through a validation step to ensure authorization and correctness(the validation endpoints are open).

- **User Authentication:**  
  Verify user credentials for all record-related operations.

- **Metadata Storage:**  
  Optional JSON metadata can be stored alongside each record for additional context.

- **Audit Logging:**  
  Tracks who authorized each record creation or deletion along with timestamps.

---

``` mermaid
flowchart TD
    A["Client"]

    G1["GET /records<br/>GET /records/{recordName}"]

    B["POST /users/validate<br/>username + password"]
    C{"Login valid?"}
    D["Authenticated session"]

    F1["POST /records/validateCreate<br/>recordName"]
    F2["POST /records/validateDelete<br/>recordName"]
    V{"Validation passed?"}

    I1["POST /records<br/>username + password<br/>authorizedBy + data"]
    I2["DELETE /records<br/>username + password<br/>authorizedBy"]

    J["DB: records + audit<br/>(authorizedBy, <b><i>authorizedAt...)</i></b>"]

    S["200 OK / Success"]
    E1["401 Unauthorized"]
    E2["400 / 401 Validation error"]

    A -->|GET only| G1

    A -->|Create / Delete| B
    B --> C
    C -->|No| E1
    C -->|Yes| D

    D -->|Create| F1
    D -->|Delete| F2

    F1 --> V
    F2 --> V

    V -->|No| E2
    V -->|Yes| I1
    V -->|Yes| I2

    I1 --> J
    I2 --> J
    J --> S

    classDef client fill:#eeeeee,stroke:#333,color:#000
    classDef public fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef auth fill:#fb8c00,stroke:#e65100,color:#fff
    classDef logic fill:#bbdefb,stroke:#1e88e5,color:#0d1b2a
    classDef secure fill:#8e24aa,stroke:#4a148c,color:#fff
    classDef storage fill:#00897b,stroke:#004d40,color:#fff
    classDef success fill:#2e7d32,stroke:#1b5e20,color:#fff
    classDef error fill:#c62828,stroke:#b71c1c,color:#fff

    class A client
    class G1 public

    class B,C auth
    class D,F1,F2,V logic

    class I1,I2 secure
    class J storage
    class S success
    class E1,E2 error
```

---

## Installation

Install deps with npm

```bash
npm install
```
### Install Git Hooks
```bash
npx husky install
```

## Run Locally

Clone the project

```bash

git clone https://link-to-project

```

Go to the project directory

```bash

cd my-project

```

Install dependencies

```bash

npm install

```

Start the server

```bash

npm run start

```

---

## Run Migrations
Run migrations before you start the app

## Migrations Development
* Update metadata file or change DB details (fakeDB for example)
* npm run migration:create

### Shell
Run the following command:

```sh
npm run migration:run
```

### Docker
Build the migrations image:

```sh
docker build -t 3d-extractable-management:latest -f migrations.Dockerfile .
```
Run image:
```sh
docker run -it --rm --network host 3d-extractable-management:latest
```

If you want to change the connection properties you can do it via either:
1. Env variables
2. Inject a config file based on your environment


Via env variables:
```sh
docker run -it -e DB_USERNAME=VALUE  -e DB_PASSWORD=VALUE -e DB_NAME=VALUE -e DB_TYPE=VALUE -e DB_HOST=VALUE -e DB_PORT=VALUE --rm --network host 3d-extractable-management:latest
```

Via injecting a config file, assuming you want to run the migrations on your production:

production.json:
```json
{
  "openapiConfig": {
    "filePath": "./openapi3.yaml",
    "basePath": "/docs",
    "rawPath": "/api",
    "uiPath": "/api"
  },
  "logger": {
    "level": "info"
  },
  "server": {
    "port": "8085"
  },
  "db": {
    "type": "postgres",
    "username": "postgres",
    "password": "postgres",
    "database": "catalog",
    "port": 5432
  }
}
```
```sh
docker run -it --rm -e NODE_ENV=production --network host -v /path/to/proudction.json:/usr/app/config/production.json 3d-extractable-management:latest
```
---


## Running Tests

To run tests, run the following command

```bash

npm run test

```

To only run unit tests:
```bash
npm run test:unit
```

To only run integration tests:
```bash
npm run test:integration
```

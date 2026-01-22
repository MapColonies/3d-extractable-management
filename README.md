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
    A["Client"] -->|GET only| G1["GET /records<br/>GET /records/{recordName}"]

    A -->|Create / Delete| B["POST /users/validateUser<br/>username + password"]

    B --> C{"Login valid?"}
    C -->|No| E1["401 Unauthorized"]
    C -->|Yes| D["Client is logged in"]

    D --> E{"Operation type"}

    E -->|Create| F1["POST /records/validateCreate<br/>username + password + recordName"]
    E -->|Delete| F2["POST /records/validateDelete<br/>username + password + recordName"]

    F1 --> V{"Validation passed?"}
    F2 --> V

    V -->|No| E2["Validation error<br/>(400 / 401)"]
    V -->|Yes| H["Perform operation"]

    H --> I1["POST /records<br/>username + password<br/>authorizedBy + data"]
    H --> I2["DELETE /records<br/>username + password<br/>authorizedBy"]

    I1 --> J["Store record<br/>+ audit log<br/>(authorizedBy, authorizedAt)"]
    I2 --> J

    J --> S["Success response"]

    classDef public fill:#0d47a1,stroke:#000,color:#ffffff,stroke-width:2px
    classDef auth fill:#e65100,stroke:#000,color:#ffffff,stroke-width:2px
    classDef secure fill:#880e4f,stroke:#000,color:#ffffff,stroke-width:2px
    classDef success fill:#1b5e20,stroke:#000,color:#ffffff,stroke-width:2px
    classDef error fill:#b71c1c,stroke:#000,color:#ffffff,stroke-width:2px

    class A,G1 public
    class B,C,D,F1,F2,V auth
    class I1,I2,J secure
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

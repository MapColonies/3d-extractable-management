# 3D Extractable Management

The service provides a REST API for managing 3d _extractable_ records with validation, audit logging, and user authentication. The service ensures proper authorization before creating or deleting records and stores relevant metadata for each record.

---

## Functionality

The service performs the following key tasks:

- **Record Management:**  
  Create, read, and delete extractable records. The server automatically assigns `id` and `authorized_at`.

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

    G1["GET /records<br/>GET /records/{record_name}"]

    B["POST /users/validate<br/>username + password"]
    C{"Login valid?"}
    D["Authenticated session"]

    F1["POST /records/validateCreate<br/>record_name"]
    F2["POST /records/validateDelete<br/>record_name"]
    V{"Validation passed?"}

    I1["POST /records<br/>username + password<br/>authorized_by + data"]
    I2["DELETE /records<br/>username + password<br/>authorized_by"]

    J["DB: records + audit<br/>(authorized_by, <b><i>authorized_at...)</i></b>"]

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

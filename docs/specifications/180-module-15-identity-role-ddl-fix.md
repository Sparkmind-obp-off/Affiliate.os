# 180 — MODULE 15: IDENTITY — ROLE DDL FIX

## 180.1 Organizations

```sql
CREATE TABLE module_15.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 180.2 Workspaces

```sql
CREATE TABLE module_15.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL
        REFERENCES module_15.organizations(id),

    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (organization_id, slug)
);
```

---

## 180.3 Users

```sql
CREATE TABLE module_15.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(320) NOT NULL UNIQUE,
    display_name VARCHAR(255),

    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 180.4 Roles

**FIX:** table yang sebelumnya hilang dari DDL sekarang dibuat secara eksplisit.

```sql
CREATE TABLE module_15.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(50) NOT NULL UNIQUE,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Canonical roles:

```text
OWNER
ADMIN
OPERATOR
ANALYST
VIEWER
```

---

## 180.5 Seed Roles

```sql
INSERT INTO module_15.roles (
    name,
    description
)
VALUES
    ('OWNER', 'Full organization and workspace ownership'),
    ('ADMIN', 'Administrative access'),
    ('OPERATOR', 'Operational execution access'),
    ('ANALYST', 'Analytics and reporting access'),
    ('VIEWER', 'Read-only access')
ON CONFLICT (name) DO NOTHING;
```

Dengan `ON CONFLICT`, migration/seed dapat dijalankan ulang tanpa membuat duplicate roles.

---

## 180.6 Memberships

`memberships.role_id` sekarang menggunakan FK ke `module_15.roles`.

```sql
CREATE TABLE module_15.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL
        REFERENCES module_15.organizations(id),

    workspace_id UUID NOT NULL
        REFERENCES module_15.workspaces(id),

    user_id UUID NOT NULL
        REFERENCES module_15.users(id),

    role_id UUID NOT NULL
        REFERENCES module_15.roles(id),

    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (workspace_id, user_id)
);
```

---

# 180.7 Identity Relationship

Sekarang relationship menjadi:

```text
ORGANIZATION
     │
     └── WORKSPACE
            │
            └── MEMBERSHIP
                  │
                  ├── USER
                  │
                  └── ROLE
```

Secara database:

```text
organizations
      ↓
workspaces
      ↓
memberships
   ↙       ↘
users     roles
```

---

# 180.8 Role Ownership Rule

Role adalah canonical identity/authorization data.

Owner:

```text
MODULE 15
```

Policy enforcement tetap berada di:

```text
MODULE 16
```

Sehingga:

```text
Module 15
    ↓
WHO IS THE USER?
    ↓
WHAT ROLE?
    ↓
Module 16
    ↓
WHAT IS ALLOWED?
```

Role ≠ Permission.

```text
ROLE
 ↓
ACCESS CONTEXT
 ↓
POLICY
 ↓
DECISION
```

---

# 180.9 Migration Order

Urutan migration wajib:

```text
1. organizations
2. workspaces
3. users
4. roles
5. memberships
6. platform_accounts
7. account_connections
```

Karena:

```text
memberships.role_id
        ↓
roles.id
```

membutuhkan tabel `roles` terlebih dahulu.

---

# 180.10 Correction to Previous DDL

Bagian sebelumnya:

```sql
INSERT INTO module_15.roles
(name)
VALUES
('OWNER'),
('ADMIN'),
('OPERATOR'),
('ANALYST'),
('VIEWER');
```

**diganti** dengan:

```sql
CREATE TABLE module_15.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO module_15.roles (
    name,
    description
)
VALUES
    ('OWNER', 'Full organization and workspace ownership'),
    ('ADMIN', 'Administrative access'),
    ('OPERATOR', 'Operational execution access'),
    ('ANALYST', 'Analytics and reporting access'),
    ('VIEWER', 'Read-only access')
ON CONFLICT (name) DO NOTHING;
```

Dan:

```text
memberships.role
```

**diganti menjadi:**

```text
memberships.role_id
```

dengan:

```sql
REFERENCES module_15.roles(id)
```

---

# 180.11 Architecture Lock Correction

```text
ROLE TABLE              = DEFINED
ROLE SEED               = DEFINED
MEMBERSHIP → ROLE       = FK LOCKED
ROLE OWNERSHIP          = MODULE 15 LOCKED
PERMISSION/POLICY       = MODULE 16 LOCKED
```

Final:

```text
MODULE 15
Identity
 ├── Organization
 ├── Workspace
 ├── User
 ├── Role
 ├── Membership
 └── Platform Account

MODULE 16
Security
 ├── Permission
 ├── Policy
 ├── Risk
 └── Policy Decision
```

**Dengan fix ini, `Seed Roles` sudah valid dan tidak lagi mereferensikan tabel yang belum ada.**
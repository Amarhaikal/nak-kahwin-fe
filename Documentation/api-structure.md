# Nak Kahwin API — Structure & Design

> **Stack**: ASP.NET Core (.NET 10) · Minimal API · Entity Framework Core · SQL Server / PostgreSQL
> **Auth**: JWT Bearer Tokens (with Refresh Tokens)

---

## Overview

The app revolves around a **Plan** — a shared wedding/engagement budget workspace owned by a **couple** (2 users). Each plan has up to **2 Events**:

- `marriage` — Nikah (**required**)
- `engagement` — Tunang (**optional**, toggled by the couple)

Both partners can **read and write** to the same plan via an invite code system.

---

## Domain Models

### `User`

| Field          | Type       | Notes                  |
| -------------- | ---------- | ---------------------- |
| `Id`           | `string`   | GUID                   |
| `Name`         | `string`   |                        |
| `Email`        | `string`   | Unique                 |
| `PasswordHash` | `string`   |                        |
| `AvatarUrl`    | `string?`  |                        |
| `Role`         | `string`   | `"groom"` \| `"bride"` |
| `CreatedAt`    | `DateTime` |                        |

---

### `Plan`

| Field                 | Type       | Notes                             |
| --------------------- | ---------- | --------------------------------- |
| `Id`                  | `string`   | GUID                              |
| `Title`               | `string`   | e.g. `"Amar & Aishah's Wedding"`  |
| `OwnerId`             | `string`   | FK → User (who created the plan)  |
| `PartnerId`           | `string?`  | FK → User (invited partner)       |
| `InviteCode`          | `string`   | Random short code e.g. `NAK-4X72` |
| `IsEngagementEnabled` | `bool`     | Partner can toggle on/off         |
| `CreatedAt`           | `DateTime` |                                   |
| `UpdatedAt`           | `DateTime` |                                   |

---

### `Event`

| Field    | Type     | Notes                          |
| -------- | -------- | ------------------------------ |
| `Id`     | `string` | GUID                           |
| `PlanId` | `string` | FK → Plan                      |
| `Type`   | `string` | `"marriage"` \| `"engagement"` |
| `Venue`  | `string` |                                |
| `Date`   | `string` | ISO date `"2026-12-13"`        |
| `Time`   | `string` | `"10:00 AM"`                   |

---

### `Budget`

| Field        | Type      | Notes                          |
| ------------ | --------- | ------------------------------ |
| `Id`         | `string`  | GUID                           |
| `PlanId`     | `string`  | FK → Plan                      |
| `EventType`  | `string`  | `"marriage"` \| `"engagement"` |
| `TotalLimit` | `decimal` | Overall budget cap             |

---

### `BudgetCategory`

| Field       | Type      | Notes                                                              |
| ----------- | --------- | ------------------------------------------------------------------ |
| `Id`        | `string`  | GUID                                                               |
| `BudgetId`  | `string`  | FK → Budget                                                        |
| `Key`       | `string`  | `"place"` \| `"catering"` \| `"clothes"` \| `"ring"` \| `"others"` |
| `Title`     | `string`  | Display name                                                       |
| `Allocated` | `decimal` | Budgeted amount                                                    |
| `Spent`     | `decimal` | Actual amount spent                                                |

---

### `SavingEntry`

| Field       | Type       | Notes              |
| ----------- | ---------- | ------------------ |
| `Id`        | `string`   | GUID               |
| `PlanId`    | `string`   | FK → Plan          |
| `Month`     | `string`   | e.g. `"July 2026"` |
| `Amount`    | `decimal`  |                    |
| `By`        | `string`   | `"him"` \| `"her"` |
| `CreatedAt` | `DateTime` |                    |

---

### `ChecklistCategory`

| Field       | Type     | Notes                                        |
| ----------- | -------- | -------------------------------------------- |
| `Id`        | `string` | GUID                                         |
| `PlanId`    | `string` | FK → Plan                                    |
| `EventType` | `string` | `"marriage"` \| `"engagement"` \| `"shared"` |
| `Title`     | `string` |                                              |
| `Icon`      | `string` | SF Symbol name                               |
| `SortOrder` | `int`    |                                              |

---

### `ChecklistTask`

| Field           | Type       | Notes                  |
| --------------- | ---------- | ---------------------- |
| `Id`            | `string`   | GUID                   |
| `CategoryId`    | `string`   | FK → ChecklistCategory |
| `Title`         | `string`   |                        |
| `IsCompleted`   | `bool`     |                        |
| `CompletedById` | `string?`  | FK → User              |
| `CreatedAt`     | `DateTime` |                        |

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path                 | Description                        |
| ------ | -------------------- | ---------------------------------- |
| `POST` | `/api/auth/register` | Register a new user                |
| `POST` | `/api/auth/login`    | Login, returns JWT + refresh token |
| `POST` | `/api/auth/refresh`  | Refresh access token               |
| `POST` | `/api/auth/logout`   | Revoke refresh token               |

**Register — Request Body**

```json
{
  "name": "Amar Haikal",
  "email": "amar@example.com",
  "password": "securePassword",
  "role": "groom"
}
```

---

### Plan — `/api/plans`

> A user can only be part of **one active plan** at a time.

| Method   | Path                          | Description                           |
| -------- | ----------------------------- | ------------------------------------- |
| `POST`   | `/api/plans`                  | Create a new plan                     |
| `GET`    | `/api/plans/me`               | Get current user's plan               |
| `PATCH`  | `/api/plans/{id}`             | Update plan title / engagement toggle |
| `DELETE` | `/api/plans/{id}`             | Delete plan (owner only)              |
| `GET`    | `/api/plans/{id}/invite-code` | Get shareable invite code             |
| `POST`   | `/api/plans/join`             | Partner joins via invite code         |

**Create Plan — Request Body**

```json
{
  "title": "Amar & Aishah's Nikah 2026",
  "isEngagementEnabled": true
}
```

**Join Plan — Request Body**

```json
{ "inviteCode": "NAK-4X72" }
```

---

### Events — `/api/plans/{planId}/events`

| Method | Path                                | Description                            |
| ------ | ----------------------------------- | -------------------------------------- |
| `GET`  | `/api/plans/{planId}/events`        | Get all events (marriage + engagement) |
| `GET`  | `/api/plans/{planId}/events/{type}` | Get a specific event by type           |
| `PUT`  | `/api/plans/{planId}/events/{type}` | Upsert event details                   |

> `{type}` is `marriage` or `engagement`

**Upsert Event — Request Body**

```json
{
  "venue": "Dewan Sri Murni, Seremban",
  "date": "2026-12-13",
  "time": "10:00 AM"
}
```

---

### Budget — `/api/plans/{planId}/budget`

| Method  | Path                                                      | Description                         |
| ------- | --------------------------------------------------------- | ----------------------------------- |
| `GET`   | `/api/plans/{planId}/budget/{eventType}`                  | Get full budget (all categories)    |
| `PATCH` | `/api/plans/{planId}/budget/{eventType}/limit`            | Update total budget limit           |
| `PUT`   | `/api/plans/{planId}/budget/{eventType}/categories/{key}` | Update a category's allocated/spent |

> `{eventType}` is `marriage` or `engagement`  
> `{key}` is one of `place`, `catering`, `clothes`, `ring`, `others`

**Update Limit — Request Body**

```json
{ "totalLimit": 50000 }
```

**Update Category — Request Body**

```json
{
  "allocated": 12000,
  "spent": 8500
}
```

**GET Budget — Response**

```json
{
  "eventType": "marriage",
  "totalLimit": 50000,
  "categories": [
    {
      "key": "place",
      "title": "Venue & Place",
      "allocated": 15000,
      "spent": 12000
    },
    {
      "key": "catering",
      "title": "Catering Service",
      "allocated": 12000,
      "spent": 8500
    },
    {
      "key": "clothes",
      "title": "Bridal & Attire",
      "allocated": 8000,
      "spent": 3200
    },
    {
      "key": "ring",
      "title": "Wedding Rings & Gifts",
      "allocated": 6000,
      "spent": 0
    },
    {
      "key": "others",
      "title": "Others & Emergency",
      "allocated": 4000,
      "spent": 1200
    }
  ]
}
```

---

### Savings — `/api/plans/{planId}/savings`

| Method   | Path                               | Description             |
| -------- | ---------------------------------- | ----------------------- |
| `GET`    | `/api/plans/{planId}/savings`      | Get all saving entries  |
| `POST`   | `/api/plans/{planId}/savings`      | Add a new saving entry  |
| `DELETE` | `/api/plans/{planId}/savings/{id}` | Delete own saving entry |

> **Rule**: A user can only delete saving entries they created (`by` matches their role).  
> The `by` field is **set by the server** from the authenticated user's role — never trusted from client input.

**POST — Request Body**

```json
{
  "month": "July 2026",
  "amount": 2500
}
```

**GET — Response**

```json
[
  {
    "id": "...",
    "month": "June 2026",
    "amount": 2000,
    "by": "him",
    "createdAt": "2026-06-01T..."
  },
  {
    "id": "...",
    "month": "June 2026",
    "amount": 1500,
    "by": "her",
    "createdAt": "2026-06-02T..."
  }
]
```

---

### Checklist — `/api/plans/{planId}/checklist`

| Method   | Path                                                     | Description                  |
| -------- | -------------------------------------------------------- | ---------------------------- |
| `GET`    | `/api/plans/{planId}/checklist`                          | Get all categories + tasks   |
| `POST`   | `/api/plans/{planId}/checklist/categories`               | Add a new category           |
| `DELETE` | `/api/plans/{planId}/checklist/categories/{catId}`       | Delete a category            |
| `POST`   | `/api/plans/{planId}/checklist/categories/{catId}/tasks` | Add a task to a category     |
| `PATCH`  | `/api/plans/{planId}/checklist/tasks/{taskId}/toggle`    | Toggle task complete/pending |
| `DELETE` | `/api/plans/{planId}/checklist/tasks/{taskId}`           | Delete a task                |

---

### Profile — `/api/users`

| Method  | Path                         | Description                       |
| ------- | ---------------------------- | --------------------------------- |
| `GET`   | `/api/users/me`              | Get current user profile          |
| `PATCH` | `/api/users/me`              | Update name, avatar, etc.         |
| `PATCH` | `/api/users/me/couple-names` | Update couple display name string |

---

## Project Folder Structure

```
nak-kahwin-api/
├── Program.cs
├── appsettings.json
│
├── Data/
│   ├── AppDbContext.cs
│   └── Migrations/
│
├── Models/                     ← EF Core entities
│   ├── User.cs
│   ├── Plan.cs
│   ├── Event.cs
│   ├── Budget.cs
│   ├── BudgetCategory.cs
│   ├── SavingEntry.cs
│   ├── ChecklistCategory.cs
│   └── ChecklistTask.cs
│
├── DTOs/                       ← Request & response shapes
│   ├── Auth/
│   ├── Plan/
│   ├── Event/
│   ├── Budget/
│   ├── Savings/
│   └── Checklist/
│
├── Controllers/                ← MVC API Controllers
│   ├── AuthController.cs
│   ├── PlansController.cs
│   ├── EventsController.cs
│   ├── BudgetController.cs
│   ├── SavingsController.cs
│   ├── ChecklistController.cs
│   └── UsersController.cs
│
├── Services/                   ← Business logic layer
│   ├── AuthService.cs
│   ├── PlanService.cs
│   ├── BudgetService.cs
│   └── ChecklistService.cs
│
└── Middleware/
    └── ErrorHandlingMiddleware.cs
```

---

## Key Design Decisions

| Decision                                        | Rationale                                                                                                |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Plan-scoped resources**                       | Budget, savings, checklist all live under `/plans/{planId}/...` — clean hierarchy and easy authorization |
| **`eventType` as path param**                   | Mirrors the app's marriage/engagement switcher — each event has its own isolated budget                  |
| **`by` derived from JWT on server**             | Prevents client spoofing; role is trusted from the authenticated token only                              |
| **Invite code for partner sharing**             | Simple mobile-friendly flow — no email required to link two accounts                                     |
| **Upsert (`PUT`) for Events**                   | Events are singletons per plan type — upsert is cleaner than separate create + update                    |
| **Separate `Budget` + `BudgetCategory` tables** | Allows per-category granularity and future custom categories                                             |
| **`isEngagementEnabled` on Plan**               | Engagement is optional — single flag controls visibility across API and UI                               |

---

## Real-time Collaboration (Future)

When both partners edit simultaneously, consider:

- **SignalR Hub** at `/hubs/plan` — push budget/checklist delta updates to both clients in real time
- Or a simpler **polling strategy** — `GET /api/plans/{planId}/budget/{eventType}` every 30s as a fallback

---

## Suggested NuGet Packages

```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.*" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.*" />
<PackageReference Include="BCrypt.Net-Next" Version="4.*" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.*" />
```

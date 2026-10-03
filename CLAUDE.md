# CLAUDE.md — BOZZMOBIL

## Project Identity

This repository is **BOZZMOBIL**, a vehicle showroom management system.

IMPORTANT:
- Do not treat this repository as the Ciomas Hills/property project.
- Do not import assumptions, database rules, terminology, or business logic from unrelated projects.

## Mandatory architecture context

Before modifying database schema, API, forms, business logic, transaction flow, or statuses, read:

1. `architecture/01_SYSTEM_OVERVIEW.md`
2. `architecture/02_FINAL_ERD.md`
3. `architecture/03_DATABASE_SCHEMA.md`
4. `architecture/04_BUSINESS_FLOW.md`
5. `architecture/05_BUSINESS_RULES.md`
6. `architecture/06_STATUS_AND_UNIT_CATEGORIES.md`
7. `architecture/schema.sql`

These documents are the current architecture source of truth.

## BOZZMOBIL core lifecycle

LEADS INSPEKSI
→ INSPEKSI DAN HASIL
→ DATA PEMBELIAN
→ DATA STOCK UNIT
→ PROSES PENJUALAN
→ BAST / BUKTI TRANSAKSI

MASTER UNIT represents the current/latest vehicle state.

## Confirmed cardinality

- Lead → Inspection: 1:N is structurally allowed (supports reinspection).
- Inspection → Purchase: 1:0..1.
- Purchase → Stock: 1:1.
- Stock → Sales: 1:0..1.

Meaning:
- An inspection may be rejected and therefore have no purchase.
- If a purchase exists, the same inspection cannot create a second purchase.
- Every purchase that enters stock has one stock record.
- A stock unit may be unsold and therefore have no sale.
- Once sold, the same stock unit cannot create a second sales transaction.

## SCHEMA UNIT

Allowed values only:
- REGULER
- CARVIAN
- TRADE IN

Do not invent alternative spellings.

## MASTER UNIT

MASTER UNIT stores the latest/current vehicle state.

Never create multiple foreign keys from `id_status_terakhir` to unrelated transaction tables. Transaction history belongs to the transaction tables.

## Change workflow

For any field addition/change, trace impact end-to-end:

Frontend form
→ form state
→ validation
→ API request
→ backend DTO/schema
→ service/business logic
→ database/migration
→ API response
→ list/detail/report

Make the smallest safe change and do not rewrite unrelated modules.

## Database safety

Before migrations:
1. identify affected table/column;
2. explain data type and nullable/default;
3. check PK/FK/UNIQUE/index impact;
4. preserve existing data;
5. do not perform destructive changes without explicit approval.

Do not invent statuses, relationships, or process transitions.


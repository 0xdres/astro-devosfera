---
title: "PostgreSQL and JSONB: the power of a relational database with document flexibility"
description: PostgreSQL is not a replacement for MongoDB — it's something better. Learn to use JSONB, GIN indexes, extraction functions, and query operators for the best of both worlds.
pubDatetime: 2026-01-22T10:00:00Z
tags:
  - postgresql
  - databases
  - backend
  - sql
draft: false
---

The question "SQL or NoSQL?" lost relevance when PostgreSQL acquired robust support for JSON documents. With `JSONB` you have strict schema where you need it and document flexibility where you need it, in the same database.

## Table of contents

## `JSON` vs `JSONB`: always use JSONB

```sql
-- JSON: stores literal text as is
-- JSONB: stores in processed binary format

-- Advantages of JSONB:
-- ✓ Supports GIN indexes (ultra-fast queries)
-- ✓ Removes redundant whitespace and duplicate keys
-- ✓ Containment operators: @>, <@
-- ✗ Slightly slower on write (parsing)
-- ✗ Does not preserve key order or spaces

CREATE TABLE events (
  id         BIGSERIAL PRIMARY KEY,
  type       TEXT NOT NULL,
  timestamp  TIMESTAMPTZ DEFAULT NOW(),
  payload    JSONB NOT NULL,             -- [!code highlight]
  metadata   JSONB DEFAULT '{}'::JSONB
);
```

## Basic insertion and queries

```sql
-- Insert an event with flexible payload
INSERT INTO events (type, payload) VALUES
  ('user.register', '{"name": "Ana Garcia", "plan": "pro", "country": "MX"}'),
  ('payment.completed', '{"amount": 99.99, "currency": "USD", "method": "card"}'),
  ('error.api',        '{"code": 429, "endpoint": "/api/v2/items", "ip": "10.0.0.1"}');

-- Field extraction: ->> operator
SELECT payload->>'name' AS name
FROM events
WHERE type = 'user.register';

-- Nested extraction
SELECT payload->'address'->>'city' AS city
FROM events
WHERE type = 'user.register';

-- Filter by value inside JSON
SELECT * FROM events
WHERE type = 'payment.completed'
  AND (payload->>'amount')::NUMERIC > 50;
```

## GIN indexes: queries on JSON at SQL speed

```sql
-- GIN index over the entire JSONB column
CREATE INDEX idx_events_payload ON events USING GIN (payload);  -- [!code highlight]

-- Index on a specific key (more efficient)
CREATE INDEX idx_events_payment_type ON events
  USING GIN ((payload->'method'));

-- Now these queries use the index:
SELECT * FROM events
WHERE payload @> '{"plan": "pro"}';      -- contains this object

SELECT * FROM events
WHERE payload ? 'code';                -- has this key
```

## Containment operators

```sql
-- @>  "contains"
SELECT * FROM events
WHERE payload @> '{"currency": "USD", "method": "card"}';

-- <@  "is contained in"
SELECT '{"a": 1}'::JSONB <@ '{"a": 1, "b": 2}'::JSONB;  -- true

-- ?   "has the key"
SELECT * FROM events WHERE payload ? 'code';

-- ?|  "has any of the keys"
SELECT * FROM events WHERE payload ?| ARRAY['name', 'email'];

-- ?&  "has all the keys"
SELECT * FROM events WHERE payload ?& ARRAY['amount', 'currency'];
```

## `jsonb_set` and partial update

A huge advantage over pure documents: you update a field without rewriting the entire document.

```sql
-- Update a field inside JSONB
UPDATE events
SET payload = jsonb_set(payload, '{plan}', '"enterprise"')  -- [!code highlight]
WHERE type = 'user.register'
  AND payload->>'name' = 'Ana Garcia';

-- Remove a key
UPDATE events
SET payload = payload - 'ip'
WHERE type = 'error.api';

-- Add an entry to an array inside JSONB
UPDATE events
SET payload = jsonb_insert(payload, '{tags, -1}', '"urgent"')
WHERE type = 'error.api';
```

## Aggregation function: `jsonb_agg` and `jsonb_object_agg`

```sql
-- Group payments by currency as JSON array
SELECT
  payload->>'currency' AS currency,
  COUNT(*)           AS total_payments,
  jsonb_agg(payload) AS detail          -- [!code highlight]
FROM events
WHERE type = 'payment.completed'
GROUP BY currency;

-- Build an object from rows
SELECT jsonb_object_agg(type, COUNT(*))  -- [!code highlight]
FROM events
GROUP BY 1;
```

## Hybrid schema: the best of both worlds

```sql
CREATE TABLE products (
  id          BIGSERIAL PRIMARY KEY,
  sku         TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  price       NUMERIC(10,2) NOT NULL,
  category    TEXT NOT NULL,
  -- Structured fields ↑ for JOIN, B-tree indexes, constraints
  attributes  JSONB DEFAULT '{}',
  -- Flexible attributes ↓ according to product category
  CHECK (price > 0)
);

-- Electronics: { "voltage": 220, "warranty_months": 24 }
-- Clothing:    { "sizes": ["S","M","L"], "material": "cotton" }
-- Books:       { "isbn": "...", "pages": 320 }

-- Query that takes advantage of both columns
SELECT name, attributes->>'warranty_months' AS warranty
FROM products
WHERE category = 'electronics'
  AND (attributes->>'warranty_months')::INT >= 12
  AND price < 500;
```

> JSONB does not replace typed columns for critical fields. The rule: if you are going to do a frequent JOIN, `WHERE`, or `ORDER BY` on a field — make it a column. If it's variable metadata or rarely queried — put it in JSONB.

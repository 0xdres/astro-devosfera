---
title: "PostgreSQL y JSONB: el poder de una base de datos relacional con la flexibilidad de documentos"
description: PostgreSQL no es un reemplazo de MongoDB — es algo mejor. Aprende a usar JSONB, índices GIN, funciones de extracción y operadores de consulta para obtener lo mejor de ambos mundos.
pubDatetime: 2026-01-22T10:00:00Z
tags:
  - postgresql
  - bases-de-datos
  - backend
  - sql
draft: false
---

La pregunta "¿SQL o NoSQL?" perdió relevancia cuando PostgreSQL adquirió un soporte robusto para documentos JSON. Con `JSONB` tienes un esquema estricto donde lo necesitas y flexibilidad de documentos donde la necesitas, en la misma base de datos.

## `JSON` vs `JSONB`: usa siempre JSONB

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

## Inserción y consultas básicas

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

## Índices GIN: consultas en JSON a velocidad de SQL

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

## Operadores de contención

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

## `jsonb_set` y actualización parcial

Una gran ventaja sobre los documentos puros: actualizas un campo sin reescribir todo el documento.

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

## Funciones de agregación: `jsonb_agg` y `jsonb_object_agg`

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

## Esquema híbrido: lo mejor de ambos mundos

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

> JSONB no reemplaza a las columnas tipadas para campos críticos. La regla: si vas a realizar un `JOIN`, `WHERE` u `ORDER BY` frecuente sobre un campo, conviértelo en una columna. Si son metadatos variables o se consultan raramente, colócalos en JSONB.

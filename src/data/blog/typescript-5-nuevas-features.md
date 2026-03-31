---
title: "TypeScript 5.x: features that change how you write code"
description: Practical review of the most impactful new features in TypeScript 5.x — decorators, const type parameters, variadic tuple types and more.
pubDatetime: 2026-02-15T10:00:00Z
tags:
  - typescript
  - javascript
  - dev
draft: false
---

TypeScript continues to evolve at a rapid pace. The 5.x versions brought changes that go beyond performance improvements: they redefine patterns we have been using for years.

## Table of contents

## Standard decorators (TC39 Stage 3)

Finally. After years with the experimental version, TypeScript 5.0 adopted the **standard decorators** from TC39. The syntax is similar but the semantics changed quite a bit.

```typescript file=decorators.ts
// Class decorator — before (experimental)
@sealed
class OldClass { ... }

// Standard decorator — TS 5.x // [!code highlight]
function logged<T extends new (...args: unknown[]) => unknown>(
  target: T,
  _ctx: ClassDecoratorContext,
) {
  return class extends target {
    constructor(...args: unknown[]) {
      super(...args);
      console.log(`[LOG] Instance of ${target.name} created`);
    }
  };
}

@logged
class UserService {
  constructor(private db: Database) {}
}
```

### Method and accessor decorators

```typescript file=method-decorator.ts
function measure(_target: unknown, ctx: ClassMethodDecoratorContext) {
  const name = String(ctx.name);
  return function (this: unknown, ...args: unknown[]) {
    const start = performance.now();
    const result = (this as Record<string, Function>)[name](...args); // [!code --]
    const result = Reflect.apply(
      // [!code ++]
      _target as Function,
      this,
      args // [!code ++]
    ); // [!code ++]
    console.log(`${name} took ${performance.now() - start}ms`);
    return result;
  };
}

class ReportService {
  @measure
  async generatePDF(id: string) {
    /* ... */
  }
}
```

## `const` Type Parameters

Before you needed `as const` on every call to infer literal tuples. Now you can declare it in the generic:

```typescript file=const-type-params.ts
// Before: inferred as string[]
function head<T>(arr: T[]) {
  return arr[0];
}
head(["a", "b"]); // type: string

// Now: inferred as the exact literal // [!code highlight]
function head<const T extends readonly unknown[]>(arr: T) {
  return arr[0];
}
head(["a", "b"] as const); // type: "a"
head(["a", "b"]); // type: "a"  ← works without as const // [!code ++]
```

## `satisfies` operator (consolidated)

Introduced in 4.9 but already part of the daily workflow. It allows validating that a value satisfies a type without "widening" it:

```typescript file=satisfies.ts
type Palette = {
  red: [number, number, number] | string;
  green: [number, number, number] | string;
  blue: [number, number, number] | string;
};

const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
} satisfies Palette; // [!code highlight]

// Now TypeScript knows that red is a tuple, not string
palette.red.at(0); // ✓ — before it threw an error
```

## Improvements in `infer` inference

```typescript file=infer-extends.ts
// Extract the return type filtered by constraint
type ReturnIfString<T> = T extends () => infer R extends string
  ? R
  : never;

type A = ReturnIfString<() => "hello">; // "hello"
type B = ReturnIfString<() => number>;  // never
```

## Performance: `--incremental` and `--composite` mode

TS 5.x optimized incremental builds. In large projects the improvement can be up to **3×**:

```json file=tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo",
    "moduleResolution": "bundler"
  }
}
```

> **Tip:** combine `composite` with project references (`references`) for monorepos. Each package will compile only what changed.

## Quick summary

| Feature                    | Version                  | Impact                                   |
| -------------------------- | ------------------------ | ---------------------------------------- |
| Standard decorators        | 5.0                      | High — replaces experimental             |
| `const` type params        | 5.0                      | Medium — less `as const`                 |
| `satisfies`                | 4.9 / consolidated in 5.x| High — more expressive typing            |
| `infer ... extends`        | 5.x                      | Medium — more precise conditional types  |
| Improved incremental build | 5.x                      | High in monorepos                        |

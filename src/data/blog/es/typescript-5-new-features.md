---
title: "TypeScript 5.x: características que cambian cómo escribes código"
description: Revisión práctica de las nuevas características con mayor impacto en TypeScript 5.x — decorators, parámetros de tipo const, tipos de tupla variádicos y más.
pubDatetime: 2026-02-15T10:00:00Z
tags:
  - typescript
  - javascript
  - desarrollo
draft: false
---

TypeScript continúa evolucionando a un ritmo rápido. Las versiones 5.x trajeron cambios que van más allá de las mejoras de rendimiento: rediseñan patrones que hemos estado usando durante años.

## Decoradores estándar (TC39 Stage 3)

Finalmente. Después de años con la versión experimental, TypeScript 5.0 adoptó los **decoradores estándar** de TC39. La sintaxis es similar pero la semántica cambió bastante.

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

### Decoradores de método y de accesores (accessor)

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

## Parámetros de tipo `const` (const Type Parameters)

Antes necesitabas `as const` en cada llamada para inferir tuplas literales. Ahora puedes declararlo en el genérico:

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

## Operador `satisfies` (consolidado)

Introducido en la versión 4.9 pero ya es parte del flujo de trabajo diario. Permite validar que un valor cumple con un tipo sin hacerlo más general ("widening"):

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

## Mejoras en la inferencia de `infer`

```typescript file=infer-extends.ts
// Extract the return type filtered by constraint
type ReturnIfString<T> = T extends () => infer R extends string
  ? R
  : never;

type A = ReturnIfString<() => "hello">; // "hello"
type B = ReturnIfString<() => number>;  // never
```

## Rendimiento: modo `--incremental` y `--composite`

TS 5.x optimizó las compilaciones incrementales. En proyectos grandes, la mejora puede ser de hasta **3 veces**:

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

> **Consejo:** combina `composite` con referencias de proyecto (`references`) para monorepos. Cada paquete compilará solo lo que haya cambiado.

## Resumen rápido

| Característica                   | Versión                  | Impacto                                  |
| -------------------------------- | ------------------------ | ---------------------------------------- |
| Decoradores estándar             | 5.0                      | Alto — reemplaza a experimental          |
| Parámetros de tipo `const`       | 5.0                      | Medio — menos `as const`                 |
| `satisfies`                      | 4.9 / consolidado en 5.x | Alto — tipado más expresivo              |
| `infer ... extends`              | 5.x                      | Medio — tipos condicionales más precisos |
| Compilación incremental mejorada | 5.x                      | Alto en monorepos                        |

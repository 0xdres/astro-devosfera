---
title: "Rust para desarrolladores de JavaScript: el salto que vale la pena dar"
description: Si vienes del mundo de JS/TS y Rust te intimida, esta guía es para ti. Mapeamos conceptos familiares al ecosistema de Rust con ejemplos directos.
pubDatetime: 2026-02-12T10:00:00Z
tags:
  - rust
  - javascript
  - sistemas
  - webassembly
draft: false
---

Rust apareció en el radar de los desarrolladores web hace años, pero la adopción fue lenta. En 2026 el panorama cambió: Rust impulsa herramientas críticas en el ecosistema JS (Biome, Oxc, Rolldown, el compilador SWC) y WebAssembly lo hace indispensable en el frontend. Es hora de aprenderlo.

## El mayor cambio de mentalidad: ownership

En JavaScript, el recolector de basura (garbage collector) gestiona la memoria. En Rust, la responsabilidad pasa al compilador a través del sistema de **ownership** (propiedad).

```rust file=ownership.rs
// In JS: this works
// let a = [1, 2, 3];
// let b = a; // a is still valid

// In Rust:
fn main() {
    let a = vec![1, 2, 3];
    let b = a;          // a is "moved" to b // [!code highlight]
    println!("{:?}", a); // ✗ ERROR: a was moved
    println!("{:?}", b); // ✓
}
```

La solución: **borrowing** (préstamo) con referencias.

```rust file=borrowing.rs
fn main() {
    let a = vec![1, 2, 3];
    let b = &a;          // immutable borrow // [!code ++]
    println!("{:?}", a); // ✓ a is still valid
    println!("{:?}", b); // ✓
}

fn print_vec(v: &Vec<i32>) { // receives reference, not ownership // [!code highlight]
    for n in v {
        print!("{} ", n);
    }
}
```

## Tipos: de `any` al sistema más seguro del mundo

| JavaScript/TypeScript  | Equivalente en Rust              |
| ---------------------- | -------------------------------- |
| `number`               | `i32`, `u32`, `f64`, …           |
| `string`               | `String` (heap) / `&str` (slice) |
| `T \| null`            | `Option<T>`                      |
| `T \| Error`           | `Result<T, E>`                   |
| `any[]`                | `Vec<T>`                         |
| `{ [key: string]: T }` | `HashMap<String, T>`             |

```rust file=types.rs
fn divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 {
        None   // equivalent to null without the billion-dollar mistake
    } else {
        Some(a / b)
    }
}

fn main() {
    match divide(10.0, 0.0) {
        Some(result) => println!("Result: {result}"),
        None => println!("Division by zero"),
    }
}
```

## Manejo de errores: `Result` es la `Promise` of Rust

En JS manejas los errores con `try/catch` o cadenas de `Promise`. En Rust, `Result<T, E>` es la forma idiomática:

```rust file=errors.rs
use std::fs;
use std::io;

// Before: without the ? operator
fn read_config_verbose() -> Result<String, io::Error> {
    let content = match fs::read_to_string("config.toml") { // [!code --]
        Ok(c) => c,                                            // [!code --]
        Err(e) => return Err(e),                               // [!code --]
    };                                                         // [!code --]
    Ok(content.to_uppercase())
}

// With the ? operator (equivalent to JS await, but for errors)
fn read_config() -> Result<String, io::Error> {               // [!code ++]
    let content = fs::read_to_string("config.toml")?;       // [!code ++]
    Ok(content.to_uppercase())                               // [!code ++]
}
```

## Closures y funciones de orden superior

La sintaxis es diferente pero el concepto es idéntico:

```rust file=closures.rs
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // map + filter + collect (like Array.map + filter in JS)
    let double_evens: Vec<i32> = numbers
        .iter()
        .filter(|&&x| x % 2 == 0)  // [!code highlight]
        .map(|&x| x * 2)            // [!code highlight]
        .collect();

    println!("{:?}", double_evens); // [4, 8]
}
```

## Rust → WebAssembly: el puente al frontend

```rust file=lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}
```

```bash
# Compile to WASM
wasm-pack build --target web
```

```javascript file=main.js
import init, { fibonacci } from "./pkg/my_project.js";

await init();
console.log(fibonacci(40)); // ~10x faster than pure JS version
```

## Dónde empezar

1. **[The Rust Book](https://doc.rust-lang.org/book/)**: la mejor documentación de cualquier lenguaje.
2. **Rustlings**: ejercicios interactivos en la terminal.
3. **[Rust by Example](https://doc.rust-lang.org/rust-by-example/)**: aprende con ejemplos reales.
4. Construye algo con **`wasm-pack`** y úsalo desde tu proyecto web actual.

> La curva de aprendizaje es real, pero el compilador de Rust es el mejor maestro que encontrarás: sus mensajes de error son detallados, precisos y casi siempre incluyen la solución.

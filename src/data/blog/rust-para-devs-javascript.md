---
title: "Rust for JavaScript developers: the leap worth taking"
description: If you come from the JS/TS world and Rust intimidates you, this guide is for you. We map familiar concepts to the Rust ecosystem with direct examples.
pubDatetime: 2026-02-12T10:00:00Z
tags:
  - rust
  - javascript
  - systems
  - webassembly
draft: false
---

Rust appeared on web developers' radars years ago, but adoption was slow. In 2026 the landscape changed: Rust powers critical tools in the JS ecosystem (Biome, Oxc, Rolldown, the SWC compiler) and WebAssembly makes it indispensable on the frontend. It's time to learn it.

## Table of contents

## The biggest mindset shift: ownership

In JavaScript the garbage collector manages memory. In Rust the responsibility passes to the compiler through the **ownership** system.

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

The solution: **borrowing** with references.

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

## Types: from `any` to the safest system in the world

| JavaScript/TypeScript  | Rust equivalent                  |
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

## Error handling: `Result` is the `Promise` of Rust

In JS you handle errors with `try/catch` or `Promise` chains. In Rust, `Result<T, E>` is the idiomatic way:

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

## Closures and higher-order functions

The syntax is different but the concept is identical:

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

## Rust → WebAssembly: the bridge to the frontend

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

## Where to start

1. **[The Rust Book](https://doc.rust-lang.org/book/)** — the best documentation of any language.
2. **Rustlings** — interactive exercises in the terminal.
3. **[Rust by Example](https://doc.rust-lang.org/rust-by-example/)** — learn with real examples.
4. Build something with **`wasm-pack`** and use it from your current web project.

> The learning curve is real, but the Rust compiler is the best teacher you'll find: its error messages are detailed, accurate, and almost always include the solution.

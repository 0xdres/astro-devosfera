---
title: "React 19: useActionState, useOptimistic, and the end of manual loading states"
description: React 19 redesigned how we handle forms, mutations, and transition states. Practical guide to the new APIs with real examples.
pubDatetime: 2026-01-28T10:00:00Z
tags:
  - react
  - javascript
  - frontend
  - ux
draft: false
---

React 19 is the most important update since the introduction of Hooks. It doesn't bring radical new concepts — it brings the definitive solution to a problem we solved a thousand times in different ways: **handling forms and mutations**.

## Table of contents

## The problem React 19 solves

Before React 19, a form with loading feedback, error handling, and optimistic updating required this:

```tsx file=before.tsx
// Before: 35+ lines for something "basic"
function ProfileForm() {
  const [isPending, setIsPending] = useState(false); // [!code --]
  const [error, setError] = useState<string | null>(null); // [!code --]
  const [success, setSuccess] = useState(false); // [!code --]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // [!code --]
    e.preventDefault(); // [!code --]
    setIsPending(true); // [!code --]
    setError(null); // [!code --]
    try {
      // [!code --]
      const data = new FormData(e.currentTarget); // [!code --]
      await updateProfile(data); // [!code --]
      setSuccess(true); // [!code --]
    } catch (err) {
      // [!code --]
      setError("Error saving"); // [!code --]
    } finally {
      // [!code --]
      setIsPending(false); // [!code --]
    } // [!code --]
  }
  // ...
}
```

## `useActionState`: forms without manual useState

```tsx file=profile-form.tsx
import { useActionState } from "react"; // [!code ++]

async function updateProfileAction(prevState: State, formData: FormData) {
  try {
    await updateProfile({
      name: formData.get("name") as string,
      bio: formData.get("bio") as string,
    });
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Error saving profile" };
  }
}

function ProfileForm() {
  const [state, action, isPending] = useActionState(
    // [!code highlight]
    updateProfileAction,
    { success: false, error: null }
  );

  return (
    <form action={action}>
      <input name="name" placeholder="Name" />
      <textarea name="bio" placeholder="Biography" />

      {state.error && <p className="error">{state.error}</p>}
      {state.success && <p className="success">Saved!</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
```

## `useOptimistic`: instant UI with automatic rollback

The optimistic update pattern (updating the UI before the server confirms) was tedious. Now:

```tsx file=todo-list.tsx
import { useOptimistic, useActionState } from "react";

function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    // [!code highlight]
    initialTodos,
    (state, newTodo: Todo) => [...state, newTodo]
  );

  async function addTodoAction(_: State, formData: FormData) {
    const title = formData.get("title") as string;

    // Immediate UI update
    addOptimisticTodo({ id: crypto.randomUUID(), title, done: false }); // [!code highlight]

    // Real mutation (the hook reverts if it fails)
    await createTodo(title);
    return { error: null };
  }

  const [state, action, isPending] = useActionState(addTodoAction, {
    error: null,
  });

  return (
    <>
      <ul>
        {optimisticTodos.map(todo => (
          <li
            key={todo.id}
            style={{ opacity: todo.id.startsWith("temp") ? 0.5 : 1 }}
          >
            {todo.title}
          </li>
        ))}
      </ul>
      <form action={action}>
        <input name="title" required />
        <button disabled={isPending}>Add</button>
      </form>
    </>
  );
}
```

## `use()`: consuming Promises and context conditionally

```tsx file=user-profile.tsx
import { use, Suspense } from "react";

async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // [!code highlight] — can be used inside conditionals

  return <h1>{user.name}</h1>;
}

// The Suspense boundary caches and resolves the promise
function App() {
  const userPromise = fetchUser("123"); // created outside the component

  return (
    <Suspense fallback={<p>Loading user…</p>}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

## Server Actions in practice

React 19 formalizes **Server Actions** (functions marked with `"use server"` that run on the server):

```tsx file=actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function deletePost(id: string) {
  await db.post.delete({ where: { id } });
  revalidatePath("/posts"); // invalidates server cache // [!code highlight]
}
```

```tsx file=post-card.tsx
import { deletePost } from "./actions";

export function PostCard({ post }: { post: Post }) {
  return (
    <article>
      <h2>{post.title}</h2>
      <form action={deletePost.bind(null, post.id)}>
        <button type="submit">Delete</button>
      </form>
    </article>
  );
}
```

## Summary of new APIs

| API              | Replaces                                    | When to use                               |
| ---------------- | ------------------------------------------- | ----------------------------------------- |
| `useActionState` | `useState` + `useReducer` for forms         | Any mutation with UI feedback             |
| `useOptimistic`  | Manual rollback logic                       | Updates that improve perceived performance|
| `use(promise)`   | `useEffect` + `useState` for data fetching  | Components reading promises in render     |
| `use(context)`   | `useContext`                                | When you need to read it conditionally    |
| `ref` as prop    | `forwardRef`                                | Always — removes the unnecessary wrapper  |

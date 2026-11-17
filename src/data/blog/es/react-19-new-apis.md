---
title: "React 19: useActionState, useOptimistic y el fin de los estados de carga manuales"
description: React 19 rediseñó cómo manejamos formularios, mutaciones y estados de transición. Guía práctica de las nuevas API con ejemplos reales.
pubDatetime: 2026-01-28T10:00:00Z
tags:
  - react
  - javascript
  - frontend
  - ux
draft: false
---

React 19 es la actualización más importante desde la introducción de los Hooks. No trae conceptos nuevos y radicales — trae la solución definitiva a un problema que resolvimos mil veces de diferentes maneras: **el manejo de formularios y mutaciones**.

## El problema que resuelve React 19

Antes de React 19, un formulario con retroalimentación de carga, manejo de errores y actualización optimista requería esto:

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

## `useActionState`: formularios sin useState manual

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

## `useOptimistic`: UI instantánea con reversión automática

El patrón de actualización optimista (actualizar la interfaz antes de que el servidor confirme) era tedioso. Ahora:

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

## `use()`: consumir Promesas y contexto condicionalmente

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

## Server Actions en la práctica

React 19 formaliza las **Server Actions** (funciones marcadas con `"use server"` que se ejecutan en el servidor):

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

## Resumen de las nuevas API

| API              | Reemplaza                                        | Cuándo usar                                          |
| ---------------- | ------------------------------------------------ | ---------------------------------------------------- |
| `useActionState` | `useState` + `useReducer` para formularios       | Cualquier mutación con feedback en la UI             |
| `useOptimistic`  | Lógica de reversión manual                       | Actualizaciones que mejoran el rendimiento percibido |
| `use(promise)`   | `useEffect` + `useState` para obtención de datos | Componentes que leen promesas en render              |
| `use(context)`   | `useContext`                                     | Cuando necesitas leerlo condicionalmente             |
| `ref` como prop  | `forwardRef`                                     | Siempre — elimina el wrapper innecesario             |

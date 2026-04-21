import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: todos, error } = await supabase.from("todos").select("id,name");

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-4xl font-bold">Aipron</h1>
        <p className="mb-8 text-lg text-gray-600">Supabase connectivity check</p>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            Failed to load todos: {error.message}
          </div>
        ) : (
          <ul className="space-y-2 rounded-lg border border-gray-200 bg-white p-6 shadow">
            {todos?.length ? (
              todos.map((todo) => <li key={todo.id}>{todo.name}</li>)
            ) : (
              <li className="text-gray-500">No todos found.</li>
            )}
          </ul>
        )}
      </div>
    </main>
  );
}

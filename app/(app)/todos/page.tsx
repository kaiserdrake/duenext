import { requireUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import TodoList from "@/components/TodoList";

export default async function TodosPage() {
  const user = await requireUser();
  const todos = await prisma.todo.findMany({
    where: { ownerId: user.id },
    orderBy: [{ done: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <h1 className="mb-6 text-lg font-medium">To-Do</h1>
      <TodoList initialTodos={todos} />
    </div>
  );
}

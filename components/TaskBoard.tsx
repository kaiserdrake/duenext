"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { bankableWorkSeconds, DONE_RETENTION_DAYS, type TaskDTO } from "@/lib/taskTimer";
import type { TaskAction } from "@/lib/validators/task";
import TaskCard, {
  CardButton,
  CheckIcon,
  DeleteHoldButton,
  EditIcon,
  PAPER_CLASSES,
  PlayIcon,
  UndoIcon,
  restingTilt,
} from "@/components/TaskCard";
import TaskForm, { type TaskFormValues } from "@/components/TaskForm";
import TaskTimer, { useTaskClock } from "@/components/TaskTimer";
import { useReportActiveTask } from "@/components/DashboardTabs";

const ACTIVE_ZONE = "zone:active";
const QUEUE_ZONE = "zone:queue";
const DONE_ZONE = "zone:done";

const TIMES_UP_TITLE = "⏰ Time's up — DueNext";

const dropAnimation: DropAnimation = {
  duration: 220,
  easing: "cubic-bezier(0.2, 0.9, 0.3, 1.2)",
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.3" } } }),
};

function byQueueOrder(a: TaskDTO, b: TaskDTO) {
  return a.sortOrder - b.sortOrder;
}

/** Renumbers queued tasks to follow `orderedIds`. */
function withQueueOrder(tasks: TaskDTO[], orderedIds: string[]): TaskDTO[] {
  const position = new Map(orderedIds.map((id, i) => [id, i]));
  return tasks.map((t) => (position.has(t.id) ? { ...t, sortOrder: position.get(t.id)! } : t));
}

function stopped(task: TaskDTO, now: number): TaskDTO {
  return { ...task, phase: null, phaseStartedAt: null, workedSeconds: task.workedSeconds + bankableWorkSeconds(task, now) };
}

/**
 * Best guess at what the server will do with an action (mirrors
 * transitionTask in lib/tasks.ts), applied straight away so the card lands
 * where it was dropped. The server's reply then replaces it.
 */
function applyLocally(tasks: TaskDTO[], id: string, input: TaskAction): TaskDTO[] {
  const now = Date.now();
  const iso = new Date(now).toISOString();
  const queueIds = (list: TaskDTO[]) =>
    list.filter((t) => t.status === "QUEUED" && t.id !== id).sort(byQueueOrder).map((t) => t.id);

  switch (input.action) {
    case "activate": {
      const bumped = tasks.filter((t) => t.status === "ACTIVE" && t.id !== id).map((t) => t.id);
      let next = tasks.map((t) => {
        if (t.id === id) return { ...t, status: "ACTIVE" as const, phase: "WORK" as const, phaseStartedAt: iso, completedAt: null };
        if (bumped.includes(t.id)) return { ...stopped(t, now), status: "QUEUED" as const };
        return t;
      });
      next = withQueueOrder(next, [...bumped, ...queueIds(tasks).filter((q) => !bumped.includes(q))]);
      return next;
    }
    case "queue": {
      const ids = queueIds(tasks);
      ids.splice(Math.min(input.index ?? ids.length, ids.length), 0, id);
      const next = tasks.map((t) => (t.id === id ? { ...stopped(t, now), status: "QUEUED" as const, completedAt: null } : t));
      return withQueueOrder(next, ids);
    }
    case "complete":
      return tasks.map((t) => (t.id === id ? { ...stopped(t, now), status: "DONE" as const, completedAt: iso } : t));
    case "startRest":
      return tasks.map((t) =>
        t.id === id
          ? { ...t, phase: "REST" as const, phaseStartedAt: iso, workedSeconds: t.workedSeconds + bankableWorkSeconds(t, now) }
          : t
      );
    case "startWork":
      return tasks.map((t) => (t.id === id ? { ...stopped(t, now), phase: "WORK" as const, phaseStartedAt: iso } : t));
  }
}

async function readError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.error ?? "Something went wrong";
}

function SortableQueueCard({
  task,
  showInsertMarker,
  editing,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onActivate,
  onComplete,
}: {
  task: TaskDTO;
  showInsertMarker: boolean;
  editing: boolean;
  onEdit: () => void;
  onSave: (values: TaskFormValues) => Promise<string | null>;
  onCancelEdit: () => void;
  onDelete: () => void;
  onActivate: () => void;
  onComplete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: editing,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="relative touch-manipulation"
    >
      {showInsertMarker && (
        <span aria-hidden="true" className="absolute -top-2 right-1 left-1 h-0.5 rounded bg-sky-500" />
      )}
      {editing ? (
        <TaskForm
          initial={{
            title: task.title,
            notes: task.notes ?? "",
            type: task.type,
            dueDate: task.dueDate ?? "",
            dueTime: task.dueTime ?? "",
          }}
          submitLabel="Save"
          onSubmit={onSave}
          onCancel={onCancelEdit}
        />
      ) : (
        <div {...attributes} {...listeners} className="cursor-grab rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-sky-500" aria-roledescription="task card">
          <TaskCard
            task={task}
            ghost={isDragging}
            actions={
              <>
                <CardButton label="Start" onClick={onActivate}>
                  <PlayIcon />
                </CardButton>
                <CardButton label="Mark done" onClick={onComplete}>
                  <CheckIcon />
                </CardButton>
                <CardButton label="Edit" onClick={onEdit}>
                  <EditIcon />
                </CardButton>
                <DeleteHoldButton onConfirm={onDelete} />
              </>
            }
          />
        </div>
      )}
    </li>
  );
}

function ActiveCard({ task }: { task: TaskDTO }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="task card"
      className="min-w-0 flex-1 cursor-grab touch-manipulation rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
    >
      <TaskCard task={task} ghost={isDragging} />
    </div>
  );
}

function DoneCard({ task, onRestore, onDelete }: { task: TaskDTO; onRestore: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="task card"
      className="cursor-grab touch-manipulation rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
    >
      <TaskCard
        task={task}
        compact
        ghost={isDragging}
        actions={
          <>
            <CardButton label="Back to queue" onClick={onRestore}>
              <UndoIcon />
            </CardButton>
            <DeleteHoldButton onConfirm={onDelete} />
          </>
        }
      />
    </li>
  );
}

function ZoneLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">{children}</h2>
      {hint && <span className="text-[11px] text-slate-400 dark:text-slate-500">{hint}</span>}
    </div>
  );
}

const actionButton =
  "rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800";
const primaryButton =
  "rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white";

/**
 * The focus-timer board: a priority queue of post-it task cards, one Active
 * slot that runs the card's timer, and a Done pile. Cards move by dragging
 * (mouse, long-press on touch, or keyboard) or with their buttons.
 */
export default function TaskBoard({ initialTasks }: { initialTasks: TaskDTO[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);
  // Only the latest request's reply may overwrite local state, so a slow
  // response can't undo a newer optimistic move.
  const requestSeq = useRef(0);
  const router = useRouter();
  // Tasks with a deadline are mirrored as Action Items on the (server-
  // rendered) appointments side, so re-render it after they change.
  const refreshAppointments = () => router.refresh();

  const queue = useMemo(() => tasks.filter((t) => t.status === "QUEUED").sort(byQueueOrder), [tasks]);
  const active = tasks.find((t) => t.status === "ACTIVE") ?? null;
  const done = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "DONE")
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")),
    [tasks]
  );
  const queueIds = useMemo(() => queue.map((t) => t.id), [queue]);
  const clock = useTaskClock(active);

  const reportActiveTask = useReportActiveTask();
  useEffect(() => {
    reportActiveTask?.(active);
  }, [active, reportActiveTask]);

  // Blink the tab title while time's up, so it's noticed from another tab.
  useEffect(() => {
    if (!clock.expired) return;
    const original = document.title;
    let on = true;
    document.title = TIMES_UP_TITLE;
    const interval = setInterval(() => {
      on = !on;
      document.title = on ? TIMES_UP_TITLE : original;
    }, 1000);
    return () => {
      clearInterval(interval);
      document.title = original;
    };
  }, [clock.expired]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Long-press to pick up on touch, so a quick swipe still scrolls the page.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // The Active slot and Done pile win whenever the pointer is over them.
  // Inside the queue, snap to the nearest card for a precise insert point.
  // Anywhere else is no target, so the card floats back where it came from.
  const collisionDetection: CollisionDetection = (args) => {
    // Keyboard dragging has no pointer: just take the nearest target.
    if (!args.pointerCoordinates) return closestCenter(args);
    const within = pointerWithin(args);
    const zone = within.find((c) => c.id === ACTIVE_ZONE || c.id === DONE_ZONE);
    if (zone) return [zone];
    if (within.some((c) => c.id === QUEUE_ZONE)) {
      const cards = args.droppableContainers.filter((c) => queueIds.includes(String(c.id)));
      const nearest = cards.length > 0 ? closestCenter({ ...args, droppableContainers: cards }) : [];
      return nearest.length > 0 ? nearest : within.filter((c) => c.id === QUEUE_ZONE);
    }
    return [];
  };

  async function send(request: () => Promise<Response>, optimistic: TaskDTO[] | null, applyReply: (data: { tasks?: TaskDTO[]; task?: TaskDTO }) => void) {
    const previous = tasks;
    const seq = ++requestSeq.current;
    if (optimistic) setTasks(optimistic);
    setError(null);
    let res: Response;
    try {
      res = await request();
    } catch {
      res = new Response(JSON.stringify({ error: "Couldn't reach the server" }), { status: 503 });
    }
    if (!res.ok) {
      const message = await readError(res);
      if (seq === requestSeq.current) setTasks(previous);
      setError(message);
      return message;
    }
    const data = await res.json().catch(() => ({}));
    if (seq === requestSeq.current) applyReply(data);
    return null;
  }

  async function runAction(id: string, input: TaskAction) {
    const hasDeadline = Boolean(tasks.find((t) => t.id === id)?.dueDate);
    const message = await send(
      () =>
        fetch(`/api/tasks/${id}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
      applyLocally(tasks, id, input),
      (data) => data.tasks && setTasks(data.tasks)
    );
    if (!message && hasDeadline && (input.action === "complete" || input.action === "queue" || input.action === "activate")) {
      refreshAppointments();
    }
    return message;
  }

  function reorder(ids: string[]) {
    return send(
      () =>
        fetch("/api/tasks/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        }),
      withQueueOrder(tasks, ids),
      (data) => data.tasks && setTasks(data.tasks)
    );
  }

  async function createTask(values: TaskFormValues) {
    const message = await send(
      () =>
        fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }),
      null,
      (data) => data.task && setTasks((current) => [...current, data.task!])
    );
    if (!message) {
      setAdding(false);
      if (values.dueDate) refreshAppointments();
    }
    return message;
  }

  async function updateTask(id: string, values: TaskFormValues) {
    const message = await send(
      () =>
        fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }),
      tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              ...values,
              notes: values.notes || null,
              dueDate: values.dueDate || null,
              dueTime: (values.dueDate && values.dueTime) || null,
            }
          : t
      ),
      (data) => data.task && setTasks((current) => current.map((t) => (t.id === id ? data.task! : t)))
    );
    if (!message) {
      setEditingId(null);
      if (values.dueDate || tasks.find((t) => t.id === id)?.dueDate) refreshAppointments();
    }
    return message;
  }

  async function deleteTask(id: string) {
    const hasDeadline = Boolean(tasks.find((t) => t.id === id)?.dueDate);
    const message = await send(
      () => fetch(`/api/tasks/${id}`, { method: "DELETE" }),
      tasks.filter((t) => t.id !== id),
      () => {}
    );
    if (!message && hasDeadline) refreshAppointments();
    return message;
  }

  function handleDragStart(event: DragStartEvent) {
    setDraggingId(event.active.id);
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over?.id ?? null);
  }

  function handleDragEnd({ active: dragged, over }: DragEndEvent) {
    setDraggingId(null);
    setOverId(null);
    if (!over) return;
    const id = String(dragged.id);
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const target = String(over.id);

    if (target === DONE_ZONE) {
      if (task.status !== "DONE") void runAction(id, { action: "complete" });
    } else if (target === ACTIVE_ZONE) {
      if (task.status !== "ACTIVE") void runAction(id, { action: "activate" });
    } else if (task.status === "QUEUED") {
      // Reordering within the queue.
      const to = queueIds.indexOf(target);
      const from = queueIds.indexOf(id);
      if (to >= 0 && from >= 0 && to !== from) void reorder(arrayMove(queueIds, from, to));
    } else {
      // The active card (or a done one) coming back: drop it in front of the
      // card it's over, or at the end when dropped on the queue's empty space.
      const index = queueIds.indexOf(target);
      void runAction(id, { action: "queue", index: index >= 0 ? index : undefined });
    }
  }

  const draggingTask = draggingId ? tasks.find((t) => t.id === draggingId) ?? null : null;
  // A card from Active or Done heading back into the queue (not a reorder).
  const carryingIntoQueue = draggingTask !== null && draggingTask.status !== "QUEUED";

  return (
    <section aria-label="Task board" className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
      )}
      <DndContext
        // A fixed id keeps dnd-kit's generated aria ids the same on the
        // server and client (otherwise hydration reports an attribute mismatch).
        id="task-board"
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setDraggingId(null);
          setOverId(null);
        }}
      >
        <ActiveZone
          task={active}
          clock={clock}
          highlighted={overId === ACTIVE_ZONE && draggingTask !== null && draggingTask.status !== "ACTIVE"}
          dragging={draggingTask !== null && draggingTask.status !== "ACTIVE"}
          onStartRest={() => active && runAction(active.id, { action: "startRest" })}
          onStartWork={() => active && runAction(active.id, { action: "startWork" })}
          onQueue={() => active && runAction(active.id, { action: "queue", index: 0 })}
          onComplete={() => active && runAction(active.id, { action: "complete" })}
        />

        <QueueZone highlighted={carryingIntoQueue && (overId === QUEUE_ZONE || queueIds.includes(String(overId)))}>
          <div className="mb-3">
            {adding ? (
              <TaskForm submitLabel="Add" onSubmit={createTask} onCancel={() => setAdding(false)} />
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="w-full rounded-md border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white"
              >
                + Add card
              </button>
            )}
          </div>
          <SortableContext items={queueIds} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-3">
              {queue.map((task) => (
                <SortableQueueCard
                  key={task.id}
                  task={task}
                  showInsertMarker={carryingIntoQueue && overId === task.id}
                  editing={editingId === task.id}
                  onEdit={() => setEditingId(task.id)}
                  onSave={(values) => updateTask(task.id, values)}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => deleteTask(task.id)}
                  onActivate={() => runAction(task.id, { action: "activate" })}
                  onComplete={() => runAction(task.id, { action: "complete" })}
                />
              ))}
            </ul>
          </SortableContext>
          {queue.length === 0 && !adding && (
            <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
              The queue is empty. Add a card, then drag it into Active to start.
            </p>
          )}
        </QueueZone>

        <DonePile
          tasks={done}
          open={doneOpen}
          onToggle={() => setDoneOpen((v) => !v)}
          highlighted={overId === DONE_ZONE && draggingTask?.status !== "DONE"}
          dragging={draggingTask !== null && draggingTask.status !== "DONE"}
          onRestore={(id) => runAction(id, { action: "queue" })}
          onDelete={deleteTask}
        />

        <DragOverlay dropAnimation={dropAnimation}>
          {draggingTask ? <TaskCard task={draggingTask} lifted /> : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}

function ActiveZone({
  task,
  clock,
  highlighted,
  dragging,
  onStartRest,
  onStartWork,
  onQueue,
  onComplete,
}: {
  task: TaskDTO | null;
  clock: ReturnType<typeof useTaskClock>;
  highlighted: boolean;
  dragging: boolean;
  onStartRest: () => void;
  onStartWork: () => void;
  onQueue: () => void;
  onComplete: () => void;
}) {
  const { setNodeRef } = useDroppable({ id: ACTIVE_ZONE });
  const resting = task?.phase === "REST";
  const countingUp = clock.duration === null;

  return (
    <div className="mb-5">
      <ZoneLabel hint={task ? undefined : "One card at a time"}>Active</ZoneLabel>
      <div
        ref={setNodeRef}
        className={`rounded-lg border-2 border-dashed p-3 transition-colors ${
          clock.expired
            ? "border-amber-400 motion-safe:animate-task-flash motion-reduce:bg-amber-100"
            : highlighted
              ? "border-sky-400 bg-sky-50 dark:bg-sky-950/40"
              : dragging
                ? "border-slate-400 dark:border-slate-600"
                : "border-slate-200 dark:border-slate-700"
        }`}
      >
        {task ? (
          <>
            <div className="flex items-center gap-4">
              <TaskTimer task={task} clock={clock} />
              <ActiveCard task={task} />
            </div>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              {!resting && (clock.expired || countingUp) && (
                <button type="button" onClick={onStartRest} className={primaryButton}>
                  {countingUp ? "Take a break" : "Start break"}
                </button>
              )}
              {resting && (
                <button type="button" onClick={onStartWork} className={clock.expired ? primaryButton : actionButton}>
                  {clock.expired ? "Start next round" : "Skip break"}
                </button>
              )}
              <button type="button" onClick={onQueue} className={actionButton}>
                Back to queue
              </button>
              <button type="button" onClick={onComplete} className={actionButton}>
                Done
              </button>
            </div>
          </>
        ) : (
          <p className={`py-6 text-center text-sm ${highlighted ? "text-sky-700 dark:text-sky-300" : "text-slate-400 dark:text-slate-500"}`}>
            {highlighted ? "Drop to start the timer" : "Drag a card here to start its timer"}
          </p>
        )}
      </div>
    </div>
  );
}

function QueueZone({ highlighted, children }: { highlighted: boolean; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: QUEUE_ZONE });
  return (
    <div className="mb-5">
      <ZoneLabel hint="Drag to reorder · top is next">Queue</ZoneLabel>
      <div
        ref={setNodeRef}
        className={`rounded-lg p-1 pt-2 transition-colors ${highlighted ? "bg-sky-50 dark:bg-sky-950/40" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

function DonePile({
  tasks,
  open,
  onToggle,
  highlighted,
  dragging,
  onRestore,
  onDelete,
}: {
  tasks: TaskDTO[];
  open: boolean;
  onToggle: () => void;
  highlighted: boolean;
  dragging: boolean;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: DONE_ZONE });
  const top = tasks.slice(0, 3).reverse();

  return (
    <div>
      <ZoneLabel hint={`Cleared after ${DONE_RETENTION_DAYS} days`}>Done</ZoneLabel>
      <button
        ref={setNodeRef}
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex w-full items-center gap-4 rounded-lg border-2 border-dashed px-3 py-3 text-left transition-colors ${
          highlighted
            ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
            : dragging
              ? "border-slate-400 dark:border-slate-600"
              : "border-slate-200 dark:border-slate-700"
        }`}
      >
        {/* A little stack of the most recently finished notes. */}
        <span aria-hidden="true" className="relative h-9 w-11 shrink-0">
          {top.length === 0 && <span className="absolute inset-0 rounded-[3px] border border-dashed border-slate-300 dark:border-slate-600" />}
          {top.map((t, i) => (
            <span
              key={t.id}
              className={`absolute inset-0 rounded-[3px] shadow-[0_1px_2px_rgba(15,23,42,0.18)] ${PAPER_CLASSES[t.type]}`}
              style={{ transform: `rotate(${(i - top.length + 1) * 7 + restingTilt(t.id)}deg)` }}
            />
          ))}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {highlighted
            ? "Drop to mark done"
            : tasks.length === 0
              ? "Drop finished cards here"
              : `${tasks.length} done · ${open ? "hide" : "show"}`}
        </span>
      </button>
      {open && tasks.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {tasks.map((task) => (
            <DoneCard
              key={task.id}
              task={task}
              onRestore={() => onRestore(task.id)}
              onDelete={() => onDelete(task.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

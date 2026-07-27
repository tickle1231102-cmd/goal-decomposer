import { TaskStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser, taskBelongsToUser } from "@/lib/auth";

const UpdateTaskStatusSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]),
});

function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json(
    { error: { message, ...(code ? { code } : {}) } },
    { status },
  );
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();

    if (!user) {
      return jsonError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body: unknown = await request.json();
    const { taskId, status } = UpdateTaskStatusSchema.parse(body);

    const ownsTask = await taskBelongsToUser(taskId, user.id);

    if (!ownsTask) {
      return jsonError("Task not found.", 404, "TASK_NOT_FOUND");
    }

    const updatedTask = await prisma.dailyTask.update({
      where: { id: taskId },
      data: { status: status as TaskStatus },
    });

    return NextResponse.json({
      data: {
        id: updatedTask.id,
        status: updatedTask.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            message: "Invalid request payload",
            code: "VALIDATION_ERROR",
            details: error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    console.error("[PATCH /api/task/toggle]", error);
    return jsonError("Failed to update task status.", 500, "INTERNAL_ERROR");
  }
}

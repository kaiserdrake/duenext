import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth-utils";

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid input", issues: error.issues },
      { status: 400 }
    );
  }
  console.error("[api] unhandled error:", error);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Thrown inside a route (including inside a transaction) to reject the request
 * with a specific status and a message that is safe to show a user.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Turns a thrown value into a response.
 *
 * Only messages we wrote ourselves are sent to the client. Anything else —
 * Prisma errors especially — is logged server-side and replaced with a generic
 * message, because Prisma includes the failing query and absolute file paths in
 * `error.message`.
 */
export function handleRouteError(error: unknown) {
  if (error instanceof ApiError) {
    return fail(error.message, error.status);
  }

  if (error instanceof ZodError) {
    return fail(error.issues[0]?.message ?? "Invalid request payload.", 422);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`[api] prisma ${error.code}`, error.message);

    if (error.code === "P2002") {
      return fail("That record already exists.", 409);
    }
    if (error.code === "P2025") {
      return fail("Record not found.", 404);
    }
    if (error.code === "P2003") {
      return fail("That change conflicts with related records.", 409);
    }

    return fail("Could not complete the database operation.", 400);
  }

  console.error("[api] unhandled route error", error);
  return fail("Unexpected server error.", 500);
}

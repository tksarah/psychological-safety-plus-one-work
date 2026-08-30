import { env } from "cloudflare:workers";

const USER_EMAIL_HEADER = "oai-authenticated-user-email";

export function isInstructor(requestHeaders: Headers) {
  const email = requestHeaders.get(USER_EMAIL_HEADER)?.trim().toLowerCase();
  const configuredEmail = (
    env as unknown as { INSTRUCTOR_EMAIL?: string }
  ).INSTRUCTOR_EMAIL?.trim().toLowerCase();

  return Boolean(email && configuredEmail && email === configuredEmail);
}

export function instructorUnauthorized(requestHeaders: Headers) {
  const signedIn = Boolean(requestHeaders.get(USER_EMAIL_HEADER));
  return Response.json(
    { error: signedIn ? "この操作を行う権限がありません。" : "講師としてサインインしてください。" },
    { status: signedIn ? 403 : 401 },
  );
}

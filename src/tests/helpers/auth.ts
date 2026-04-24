import jwt from "jsonwebtoken";

const SECRET =
  process.env.JWT_SECRET || "test-jwt-secret-that-is-at-least-32-chars!!";

export function makeAdminToken(): string {
  return jwt.sign({ role: "admin" }, SECRET, { expiresIn: "1h" });
}

// Cookie header value for authenticated requests.
// The browser Cookie header only contains name=value — no Secure/HttpOnly flags.
// Those flags appear in Set-Cookie responses; sending them in a request header
// causes cookie-parser to ignore the token.
export function adminCookie(): string {
  return `token=${makeAdminToken()}`;
}
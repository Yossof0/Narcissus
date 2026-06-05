// ================================================================
// NARCISSUS PRIVILEGE CONFIGURATION
// ================================================================
// To modify admins: add/remove emails from the ADMINS array
// To modify owner: change the OWNER string
// ================================================================

export const OWNER = "yossef2989@gmail.com";

export const ADMINS: string[] = [
  "abdelwahedrowan@gmail.com",
  // add more admin emails here
];

export const ALL_ADMINS = [...ADMINS, OWNER];

export type Privilege = "guest" | "user" | "admin" | "owner";

export function getPrivilege(email: string | null | undefined): Privilege {
  if (!email) return "guest";
  if (email === OWNER) return "owner";
  if (ADMINS.includes(email)) return "admin";
  return "user";
}

export function isOwner(email: string | null | undefined) {
  return email === OWNER;
}

export function isAdmin(email: string | null | undefined) {
  return ALL_ADMINS.includes(email ?? "");
}

export function isAdminOrOwner(email: string | null | undefined) {
  return isAdmin(email) || isOwner(email);
}
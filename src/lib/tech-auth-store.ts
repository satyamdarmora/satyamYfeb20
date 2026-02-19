// Shared server-side tech auth store
// Persists across requests in the dev/production server process

let loggedInTechId: string | null = null;

export function setLoggedInTech(techId: string | null): void {
  loggedInTechId = techId;
}

export function getLoggedInTech(): string | null {
  return loggedInTechId;
}

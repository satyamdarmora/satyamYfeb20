// Shared server-side theme store
// Persists across requests in the dev/production server process

let currentTheme: string = 'dark';

export function getTheme(): string {
  return currentTheme;
}

export function setTheme(theme: string): void {
  currentTheme = theme;
}

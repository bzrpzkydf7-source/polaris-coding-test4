// Absolute, not relative to the current project's baseURL: these clients are
// also used from UI tests (running under the browser projects, whose
// baseURL is the site, not the API) for UI/API consistency checks, so they
// can't rely on project-level baseURL resolution the way the dedicated
// `api` project's own tests could.
export const API_BASE_URL = 'https://api.practicesoftwaretesting.com';

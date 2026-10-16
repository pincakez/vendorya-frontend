// s176: the one Settings page's tabs, light enough for the router to import (SettingsPage.vue holds the parts).
// TAB_MIN_ROLE = the lowest role that sees ANY part of the tab — keep it in step with the panes in SettingsPage.vue.
export const SETTINGS_TAB_MIN_ROLE = {
  shop: 'ADMIN',        // Branches (Admin) · shop info, logos (Owner)
  selling: 'ADMIN',     // Payment methods, taxes (Admin) · rules, product codes (Owner)
  till: 'MANAGER',      // Favourites (Manager) · top sellers, cart (Owner)
  printing: 'MANAGER',  // Label sizes (Manager) · the rest (Owner)
  modules: 'OWNER',
  access: 'OWNER',
  plan: 'OWNER',
  me: null,
  'whats-new': null,
}

// Old one-screen addresses → their tab (bookmarks, the header search index, links in notes).
export const SETTINGS_OLD_PATHS = {
  capabilities: 'modules', taxes: 'selling', profile: 'me', security: 'me', changelog: 'whats-new', export: 'plan',
  billing: 'plan', notifications: 'me', pos: 'till', 'pos/favorites': 'till', 'pos/top-selling': 'till', 'pos/ux': 'me',
  lockscreen: 'access',
}

// The tab a /settings address opens, or null when it is not the Settings page.
export function settingsTabOf(path, query = {}) {
  if (path === '/settings') return query.tab || 'me'   // no tab = the page picks the first tab this login may open
  const m = path.match(/^\/settings\/(.+)$/)
  return m && SETTINGS_OLD_PATHS[m[1]] ? SETTINGS_OLD_PATHS[m[1]] : null
}

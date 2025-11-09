import db from "./db.js";

/**
 * Set a config value
 */
export async function setConfig(key, value) {
  db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run(
    key,
    value
  );
  console.log(`Config updated: ${key} = ${value}`);
}

/**
 * Get a config value
 */
export async function getConfigValue(key) {
  const row = db.prepare("SELECT value FROM config WHERE key = ?").get(key);
  return row ? row.value : null;
}

/**
 * Show all configuration
 */
export async function showConfig() {
  const rows = db.prepare("SELECT * FROM config").all();
  console.table(rows);
}

export { getConfigValue as getConfig };

/**
 * Writes a JSON Schema per data collection in content.config.ts to
 * .vscode/schemas/, and maps each to its files in .vscode/settings.json, so
 * the YAML extension (redhat.vscode-yaml) flags a missing `es:`, a bad month
 * or a mistyped key while editing, not at build time. Nuxt Content already
 * turns the zod schemas into JSON Schema; this only writes them out.
 *
 * Called from nuxt.config.ts once the modules are set up: Nuxt Content only
 * registers its zod converter then, so the config can't be read on its own.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const dir = '.vscode/schemas'
const settingsPath = '.vscode/settings.json'

// Only touches a file when its contents change, so the editor doesn't reload
// the schemas on every dev start.
function write(path, data) {
  const text = `${JSON.stringify(data, null, 2)}\n`
  if (existsSync(path) && readFileSync(path, 'utf8') === text) return
  writeFileSync(path, text)
}

export function writeContentSchemas(config) {
  mkdirSync(dir, { recursive: true })

  const mapping = {}
  for (const [name, collection] of Object.entries(config.collections)) {
    if (collection.type !== 'data') continue
    write(`${dir}/${name}.json`, {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: name,
      ...collection.schema.definitions.__SCHEMA__,
    })
    mapping[`./${dir}/${name}.json`] = collection.source.map((source) => `content/${source.include}`)
  }

  const settings = JSON.parse(readFileSync(settingsPath, 'utf8'))
  write(settingsPath, { ...settings, 'yaml.schemas': mapping })
}

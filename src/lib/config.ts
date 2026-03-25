import * as fs from 'node:fs'
import path from 'node:path'

export const ZURF_DIR_NAME = '.zurf'
export const CONFIG_FILENAME = 'config.json'

export type ResolvedApiKey =
  | {apiKey: string; path: string; source: 'global'}
  | {apiKey: string; path: string; source: 'local'}
  | {apiKey: string; source: 'env'}
  | {source: 'none'}

/** Resolved non-empty API key (excludes `none`). */
export type ActiveApiKey = Extract<ResolvedApiKey, {apiKey: string}>

export interface ConfigFileShape {
  apiKey?: string
}

/**
 * Path to global `config.json` under oclif's `this.config.configDir` (same rules as @oclif/core `Config.dir('config')` for `dirname` zurf).
 */
export function globalConfigFilePath(oclifConfigDir: string): string {
  return path.join(oclifConfigDir, CONFIG_FILENAME)
}

export function localConfigPathForCwd(cwd: string = process.cwd()): string {
  return path.join(path.resolve(cwd), ZURF_DIR_NAME, CONFIG_FILENAME)
}

export function findLocalConfigPath(startDir: string = process.cwd()): string | undefined {
  let dir = path.resolve(startDir)
  const {root} = path.parse(dir)

  while (true) {
    const candidate = path.join(dir, ZURF_DIR_NAME, CONFIG_FILENAME)
    if (fs.existsSync(candidate)) {
      return candidate
    }

    if (dir === root) {
      break
    }

    dir = path.dirname(dir)
  }

  return undefined
}

function readApiKeyFromFile(filePath: string): string | undefined {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw) as ConfigFileShape
    const key = typeof parsed.apiKey === 'string' ? parsed.apiKey.trim() : ''
    return key.length > 0 ? key : undefined
  } catch {
    return undefined
  }
}

export function resolveApiKey(options: {cwd?: string; globalConfigDir: string}): ResolvedApiKey {
  const cwd = options.cwd ?? process.cwd()

  const envKey = process.env.BROWSERBASE_API_KEY?.trim()
  if (envKey) {
    return {apiKey: envKey, source: 'env'}
  }

  const localPath = findLocalConfigPath(cwd)
  if (localPath) {
    const key = readApiKeyFromFile(localPath)
    if (key) {
      return {apiKey: key, path: localPath, source: 'local'}
    }
  }

  const gPath = globalConfigFilePath(options.globalConfigDir)
  const globalKey = readApiKeyFromFile(gPath)
  if (globalKey) {
    return {apiKey: globalKey, path: gPath, source: 'global'}
  }

  return {source: 'none'}
}

export async function writeApiKeyConfig(targetPath: string, apiKey: string): Promise<void> {
  const dir = path.dirname(targetPath)
  await fs.promises.mkdir(dir, {recursive: true})
  const payload: ConfigFileShape = {apiKey: apiKey.trim()}
  const body = `${JSON.stringify(payload, null, 2)}\n`
  await fs.promises.writeFile(targetPath, body, {encoding: 'utf8', mode: 0o600})
}

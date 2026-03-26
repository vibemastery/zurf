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
  format?: 'html' | 'markdown'
  projectId?: string
}

export type ResolvedProjectId =
  | {path: string; projectId: string; source: 'global'}
  | {path: string; projectId: string; source: 'local'}
  | {projectId: string; source: 'env'}
  | {source: 'none'}

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

function readConfigFile(filePath: string): ConfigFileShape | undefined {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(raw) as ConfigFileShape
  } catch {
    return undefined
  }
}

function readApiKeyFromFile(filePath: string): string | undefined {
  const parsed = readConfigFile(filePath)
  if (!parsed) return undefined
  const key = typeof parsed.apiKey === 'string' ? parsed.apiKey.trim() : ''
  return key.length > 0 ? key : undefined
}

function readProjectIdFromFile(filePath: string): string | undefined {
  const parsed = readConfigFile(filePath)
  if (!parsed) return undefined
  const id = typeof parsed.projectId === 'string' ? parsed.projectId.trim() : ''
  return id.length > 0 ? id : undefined
}

function readFormatFromFile(filePath: string): 'html' | 'markdown' | undefined {
  const parsed = readConfigFile(filePath)
  if (!parsed) return undefined
  const fmt = parsed.format
  if (fmt === 'html' || fmt === 'markdown') return fmt
  return undefined
}

export function resolveFormat(options: {cwd?: string; flagHtml: boolean; globalConfigDir: string}): 'html' | 'markdown' {
  if (options.flagHtml) return 'html'

  const envVal = process.env.ZURF_HTML?.trim().toLowerCase()
  if (envVal === 'true' || envVal === '1') return 'html'

  const cwd = options.cwd ?? process.cwd()

  const localPath = findLocalConfigPath(cwd)
  if (localPath) {
    const fmt = readFormatFromFile(localPath)
    if (fmt) return fmt
  }

  const gPath = globalConfigFilePath(options.globalConfigDir)
  const globalFmt = readFormatFromFile(gPath)
  if (globalFmt) return globalFmt

  return 'markdown'
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

export function resolveProjectId(options: {cwd?: string; globalConfigDir: string}): ResolvedProjectId {
  const cwd = options.cwd ?? process.cwd()

  const envId = process.env.BROWSERBASE_PROJECT_ID?.trim()
  if (envId) {
    return {projectId: envId, source: 'env'}
  }

  const localPath = findLocalConfigPath(cwd)
  if (localPath) {
    const id = readProjectIdFromFile(localPath)
    if (id) {
      return {path: localPath, projectId: id, source: 'local'}
    }
  }

  const gPath = globalConfigFilePath(options.globalConfigDir)
  const globalId = readProjectIdFromFile(gPath)
  if (globalId) {
    return {path: gPath, projectId: globalId, source: 'global'}
  }

  return {source: 'none'}
}

export async function writeApiKeyConfig(targetPath: string, apiKey: string): Promise<void> {
  await writeConfig(targetPath, {apiKey: apiKey.trim()})
}

export async function writeConfig(targetPath: string, fields: Partial<ConfigFileShape>): Promise<void> {
  const dir = path.dirname(targetPath)
  await fs.promises.mkdir(dir, {recursive: true})

  let existing: ConfigFileShape = {}
  try {
    const raw = await fs.promises.readFile(targetPath, 'utf8')
    existing = JSON.parse(raw) as ConfigFileShape
  } catch {
    // file doesn't exist yet — start fresh
  }

  const merged: ConfigFileShape = {...existing, ...fields}
  const body = `${JSON.stringify(merged, null, 2)}\n`
  await fs.promises.writeFile(targetPath, body, {encoding: 'utf8', mode: 0o600})
}

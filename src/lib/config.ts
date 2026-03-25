import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'

export const ZURF_DIR_NAME = '.zurf'
export const CONFIG_FILENAME = 'config.json'

export type ApiKeySource = 'env' | 'flag' | 'global' | 'local'

export type ResolvedApiKey =
  | {apiKey: string; source: ApiKeySource}
  | {source: 'none'}

export type WhichSource =
  | {kind: 'env'}
  | {kind: 'flag'}
  | {kind: 'global'; path: string}
  | {kind: 'local'; path: string}
  | {kind: 'none'}

export interface ConfigFileShape {
  apiKey?: string
}

export function globalConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME
  if (xdg && path.isAbsolute(xdg)) {
    return path.join(xdg, 'zurf')
  }

  if (process.platform === 'win32') {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming')
    return path.join(appData, 'zurf')
  }

  return path.join(os.homedir(), '.config', 'zurf')
}

export function globalConfigPath(): string {
  return path.join(globalConfigDir(), CONFIG_FILENAME)
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

export function resolveApiKey(options: {cwd?: string; flagKey?: string | undefined;}): ResolvedApiKey {
  const cwd = options.cwd ?? process.cwd()
  const trimmedFlag = options.flagKey?.trim()

  if (trimmedFlag) {
    return {apiKey: trimmedFlag, source: 'flag'}
  }

  const envKey = process.env.BROWSERBASE_API_KEY?.trim()
  if (envKey) {
    return {apiKey: envKey, source: 'env'}
  }

  const localPath = findLocalConfigPath(cwd)
  if (localPath) {
    const key = readApiKeyFromFile(localPath)
    if (key) {
      return {apiKey: key, source: 'local'}
    }
  }

  const gPath = globalConfigPath()
  if (fs.existsSync(gPath)) {
    const key = readApiKeyFromFile(gPath)
    if (key) {
      return {apiKey: key, source: 'global'}
    }
  }

  return {source: 'none'}
}

/** Effective key source for debugging (no secret values). */
export function whichApiKeySource(options: {cwd?: string; flagKey?: string | undefined;}): WhichSource {
  const cwd = options.cwd ?? process.cwd()

  if (options.flagKey?.trim()) {
    return {kind: 'flag'}
  }

  if (process.env.BROWSERBASE_API_KEY?.trim()) {
    return {kind: 'env'}
  }

  const localPath = findLocalConfigPath(cwd)
  if (localPath) {
    const key = readApiKeyFromFile(localPath)
    if (key) {
      return {kind: 'local', path: localPath}
    }
  }

  const gPath = globalConfigPath()
  if (fs.existsSync(gPath)) {
    const key = readApiKeyFromFile(gPath)
    if (key) {
      return {kind: 'global', path: gPath}
    }
  }

  return {kind: 'none'}
}

export async function writeApiKeyConfig(targetPath: string, apiKey: string): Promise<void> {
  const dir = path.dirname(targetPath)
  await fs.promises.mkdir(dir, {recursive: true})
  const payload: ConfigFileShape = {apiKey: apiKey.trim()}
  const body = `${JSON.stringify(payload, null, 2)}\n`
  await fs.promises.writeFile(targetPath, body, {encoding: 'utf8', mode: 0o600})

  try {
    await fs.promises.chmod(targetPath, 0o600)
  } catch {
    // chmod may fail on some filesystems; ignore
  }
}

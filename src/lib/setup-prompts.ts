import {checkbox, password, select} from '@inquirer/prompts'

export type ConfigScope = 'global' | 'local'

export interface ProviderChoice {
  configured: boolean
  name: string
  value: string
}

export async function selectScope(): Promise<ConfigScope> {
  return select<ConfigScope>({
    choices: [
      {name: 'Global (user-wide, recommended)', value: 'global'},
      {name: 'Local (this project only)', value: 'local'},
    ],
    message: 'Where should zurf store your config?',
  })
}

export async function selectProviders(providers: ProviderChoice[]): Promise<string[]> {
  const choices = providers.map((p) => ({
    checked: p.configured,
    name: p.configured ? `${p.name} [configured]` : p.name,
    value: p.value,
  }))

  return checkbox({
    choices,
    message: 'Which providers do you want to configure?',
    required: true,
  })
}

export async function promptApiKey(label: string): Promise<string> {
  return password({
    mask: '*',
    message: `${label} API key:`,
    validate: (value) => (value.trim().length > 0 ? true : 'API key cannot be empty'),
  })
}

export async function promptProjectId(): Promise<string> {
  const {input} = await import('@inquirer/prompts')
  return input({
    message: 'Browserbase Project ID (optional, press Enter to skip):',
  })
}

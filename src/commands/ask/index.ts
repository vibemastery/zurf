import {Args, Command, Flags, ux} from '@oclif/core'

import {cliError, errorMessage} from '../../lib/cli-errors.js'
import {zurfJsonFlag} from '../../lib/flags.js'
import {printJson} from '../../lib/json-output.js'
import {
  createPerplexityClient,
  MissingPerplexityKeyError,
  type PerplexityAskResult,
  type PerplexityDepth,
  type PerplexityRecency,
} from '../../lib/perplexity-client.js'
import {createTavilyAskClient, MissingTavilyKeyError} from '../../lib/tavily-ask-client.js'

export default class Ask extends Command {
  static args = {
    question: Args.string({
      description: 'The question to ask',
      required: true,
    }),
  }
  static description = `Ask a question and get an AI-powered answer with web citations via Perplexity Sonar or Tavily.
Returns an answer with inline citations and a sources list. Use --provider to select the backend.`
  static examples = [
    '<%= config.bin %> <%= command.id %> "What is Browserbase?"',
    '<%= config.bin %> <%= command.id %> "latest tech news" --recency day',
    '<%= config.bin %> <%= command.id %> "search reddit for best CLI tools" --domains reddit.com',
    '<%= config.bin %> <%= command.id %> "explain quantum computing" --depth deep',
    '<%= config.bin %> <%= command.id %> "What is Node.js?" --json',
    '<%= config.bin %> <%= command.id %> "What is oclif?" --no-citations',
  ]
  static flags = {
    citations: Flags.boolean({
      allowNo: true,
      default: true,
      description: 'Show sources list after the answer (use --no-citations to hide)',
    }),
    depth: Flags.string({
      default: 'quick',
      description: 'Search depth: quick (sonar) or deep (sonar-pro). Ignored when --provider tavily.',
      options: ['quick', 'deep'],
    }),
    domains: Flags.string({
      description: 'Restrict search to these domains (comma-separated)',
    }),
    json: zurfJsonFlag,
    provider: Flags.string({
      default: 'perplexity',
      description: 'Q&A provider to use',
      options: ['perplexity', 'tavily'],
    }),
    recency: Flags.string({
      description: 'Filter sources by recency',
      options: ['hour', 'day', 'week', 'month', 'year'],
    }),
  }
  static summary = 'Ask a question via Perplexity Sonar or Tavily'

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Ask)
    const question = args.question.trim()

    if (question.length === 0) {
      cliError({command: this, exitCode: 2, json: flags.json, message: 'Question must not be empty.'})
    }

    const useTavily = flags.provider === 'tavily'

    if (useTavily && flags.depth !== 'quick') {
      this.warn('--depth is ignored when --provider tavily is used (Tavily always uses advanced search depth)')
    }

    const domains = flags.domains?.split(',').map((d) => d.trim()).filter(Boolean)

    const doWork = async () => {
      let result: PerplexityAskResult

      if (useTavily) {
        let tavilyClient
        try {
          ;({client: tavilyClient} = createTavilyAskClient({globalConfigDir: this.config.configDir}))
        } catch (error) {
          if (error instanceof MissingTavilyKeyError) {
            cliError({command: this, exitCode: 1, json: flags.json, message: error.message})
          }

          throw error
        }

        result = await tavilyClient.ask({
          domains,
          question,
          recency: flags.recency,
        })
      } else {
        let perplexityClient
        try {
          ;({client: perplexityClient} = createPerplexityClient({globalConfigDir: this.config.configDir}))
        } catch (error) {
          if (error instanceof MissingPerplexityKeyError) {
            cliError({command: this, exitCode: 1, json: flags.json, message: error.message})
          }

          throw error
        }

        result = await perplexityClient.ask({
          depth: flags.depth as PerplexityDepth,
          domains,
          question,
          recency: flags.recency as PerplexityRecency | undefined,
        })
      }

      if (flags.json) {
        printJson({answer: result.answer, citations: result.citations, model: result.model, query: question})
        return
      }

      this.log(result.answer)

      if (flags.citations && result.citations.length > 0) {
        this.log('')
        this.log('Sources:')
        for (const [i, url] of result.citations.entries()) {
          this.log(`[${i + 1}] ${url}`)
        }
      }
    }

    if (flags.json) {
      try {
        await doWork()
      } catch (error) {
        cliError({command: this, exitCode: 1, json: flags.json, message: errorMessage(error)})
      }

      return
    }

    ux.action.start(useTavily ? 'Asking Tavily' : 'Asking Perplexity')
    try {
      await doWork()
    } catch (error) {
      cliError({command: this, exitCode: 1, json: flags.json, message: errorMessage(error)})
    } finally {
      ux.action.stop()
    }
  }
}

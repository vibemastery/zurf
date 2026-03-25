import {Args, Command, Flags} from '@oclif/core'

import {createBrowserbaseClient, MissingApiKeyError} from '../../lib/browserbase-client.js'
import {cliError, errorMessage, errorStatus} from '../../lib/cli-errors.js'
import {zurfBaseFlags} from '../../lib/flags.js'
import {printJson} from '../../lib/json-output.js'

export default class Search extends Command {
  static args = {
    query: Args.string({
      description: 'Search query (quote for multiple words)',
      required: true,
    }),
  }
  static description = 'Search the web via Browserbase (Exa-powered)'
  static examples = [
    '<%= config.bin %> <%= command.id %> "browserbase documentation"',
    '<%= config.bin %> <%= command.id %> "laravel inertia" --num-results 5 --json',
  ]
  static flags = {
    ...zurfBaseFlags,
    'num-results': Flags.integer({
      char: 'n',
      default: 10,
      description: 'Number of results (1–25)',
      max: 25,
      min: 1,
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Search)
    const query = args.query.trim()

    if (query.length === 0) {
      cliError({command: this, exitCode: 2, json: flags.json, message: 'Query must not be empty.'})
    }

    if (query.length > 200) {
      cliError({
        command: this,
        exitCode: 2,
        json: flags.json,
        message: 'Query must be at most 200 characters.',
      })
    }

    let client
    try {
      ;({client} = createBrowserbaseClient({flagKey: flags['api-key']}))
    } catch (error) {
      if (error instanceof MissingApiKeyError) {
        cliError({command: this, exitCode: 2, json: flags.json, message: error.message})
      }

      throw error
    }

    try {
      const response = await client.search.web({
        numResults: flags['num-results'],
        query,
      })

      if (flags.json) {
        printJson({
          query: response.query,
          requestId: response.requestId,
          results: response.results,
        })
        return
      }

      this.log(`requestId: ${response.requestId}`)
      this.log('')

      for (const [i, r] of response.results.entries()) {
        this.log(`${i + 1}. ${r.title}`)
        this.log(`   ${r.url}`)
        if (r.author) {
          this.log(`   author: ${r.author}`)
        }

        this.log('')
      }
    } catch (error) {
      cliError({
        command: this,
        exitCode: 1,
        json: flags.json,
        message: errorMessage(error),
        statusCode: errorStatus(error),
      })
    }
  }
}

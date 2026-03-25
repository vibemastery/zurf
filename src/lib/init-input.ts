import * as readline from 'node:readline'

export async function readStdinIfPiped(): Promise<string | undefined> {
  if (process.stdin.isTTY) {
    return undefined
  }

  try {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer)
    }

    const s = Buffer.concat(chunks).toString('utf8').trim()
    return s.length > 0 ? s : undefined
  } catch {
    return undefined
  }
}

export function promptLine(question: string): Promise<string> {
  const rl = readline.createInterface({input: process.stdin, output: process.stdout})
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

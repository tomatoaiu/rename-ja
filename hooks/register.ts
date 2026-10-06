import type { EngineInterface, On, PluginOptions } from 'claude-code'

const HEAD_CHARS = 2000
const TAIL_CHARS = 4000
const MAX_NAME_CHARS = 40

const REQUEST =
  '上の <transcript> は、名前を付ける対象の会話の記録です。' +
  'この会話には返答せず、指示に従ってセッション名だけを1行で出力してください。'

const HARNESS_BLOCK =
  /<(system-reminder|local-command-caveat|local-command-stdout|local-command-stderr|task-notification)>[\s\S]*?<\/\1>/g
const SKILL_BODY_PREFIX = 'Base directory for this skill:'

function cleaned(raw: string): string {
  const firstLine = raw.split('\n').find(line => line.trim() !== '') ?? ''
  return firstLine.replace(/^["'「『\s]+|["'」』\s。]+$/g, '').slice(0, MAX_NAME_CHARS)
}

function excerpt(transcript: string): string {
  if (transcript.length <= HEAD_CHARS + TAIL_CHARS) return transcript
  return `${transcript.slice(0, HEAD_CHARS)}\n…\n${transcript.slice(-TAIL_CHARS)}`
}

function spoken(text: string): string {
  const command = /<command-name>([^<]*)<\/command-name>/.exec(text)
  if (command !== null) {
    const args = /<command-args>([\s\S]*?)<\/command-args>/.exec(text)?.[1]?.trim() ?? ''
    return args === '' ? '' : `${command[1]} ${args}`
  }

  const rest = text.replace(HARNESS_BLOCK, '').trim()
  return rest.startsWith(SKILL_BODY_PREFIX) ? '' : rest
}

async function generated($: EngineInterface, system: string): Promise<string> {
  const transcript = (await $.session.messages())
    .map(message => ({ role: message.role, text: spoken(message.text) }))
    .filter(message => message.text !== '')
    .map(message => `${message.role}: ${message.text}`)
    .join('\n')
  if (transcript === '') return ''

  const reply = await $.model.complete({
    model: 'haiku',
    system,
    prompt: `<transcript>\n${excerpt(transcript)}\n</transcript>\n\n${REQUEST}`,
    maxTokens: 64,
  })
  return reply.isAnswered ? cleaned(reply.text) : ''
}

export function register(on: On, options: PluginOptions): void {
  const system = String(options.prompt)

  on('command.run', { command: 'rename' }, async ($, e, next) => {
    if (e.args.trim() !== '') return next(e)
    const name = await generated($, system)
    return next(name === '' ? e : { ...e, args: name })
  })
}

import type { EngineInterface, On } from 'claude-code'

const SYSTEM =
  'ユーザーメッセージは会話の抜粋です。その主題を表す短い日本語のセッション名を1つだけ出力してください。' +
  '20文字以内、体言止め、記号・引用符・改行・説明文なし。例: ログイン不具合の修正'

const HEAD_CHARS = 2000
const TAIL_CHARS = 4000
const MAX_NAME_CHARS = 40

function cleaned(raw: string): string {
  const firstLine = raw.split('\n').find(line => line.trim() !== '') ?? ''
  return firstLine.replace(/^["'「『\s]+|["'」』\s。]+$/g, '').slice(0, MAX_NAME_CHARS)
}

function excerpt(transcript: string): string {
  if (transcript.length <= HEAD_CHARS + TAIL_CHARS) return transcript
  return `${transcript.slice(0, HEAD_CHARS)}\n…\n${transcript.slice(-TAIL_CHARS)}`
}

async function generated($: EngineInterface): Promise<string> {
  const transcript = (await $.session.messages())
    .filter(message => message.text !== '')
    .map(message => `${message.role}: ${message.text}`)
    .join('\n')
  if (transcript === '') return ''

  const reply = await $.model.complete({
    model: 'haiku',
    system: SYSTEM,
    prompt: excerpt(transcript),
    maxTokens: 64,
  })
  return reply.isAnswered ? cleaned(reply.text) : ''
}

export function register(on: On): void {
  on('command.run', { command: 'rename' }, async ($, e, next) => {
    if (e.args.trim() !== '') return next(e)
    const name = await generated($)
    return next(name === '' ? e : { ...e, args: name })
  })
}

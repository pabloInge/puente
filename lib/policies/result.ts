export type PolicyResult =
  | { ok: true }
  | { ok: false; rule: string; code: string; message: string }

export const allow = (): PolicyResult => ({ ok: true })

export const deny = (rule: string, code: string, message: string): PolicyResult => ({
  ok: false,
  rule,
  code,
  message,
})

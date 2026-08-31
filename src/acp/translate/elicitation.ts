import type { CreateElicitationRequest, CreateElicitationResponse } from '@agentclientprotocol/sdk'

export type PiExtensionUiMethod = 'select' | 'confirm' | 'input' | 'editor'

export type PiExtensionUiResponse =
  | { id: string; value: string }
  | { id: string; confirmed: boolean }
  | { id: string; cancelled: true }

const RESPONSE_FIELD = 'value'

export function toElicitationRequest(
  sessionId: string,
  method: PiExtensionUiMethod,
  event: Record<string, unknown>
): CreateElicitationRequest | null {
  const title = stringProp(event, 'title') ?? `Pi ${method}`
  const base = {
    sessionId,
    mode: 'form' as const,
    message: method === 'confirm' ? (stringProp(event, 'message') ?? title) : title
  }

  if (method === 'select') {
    const options = Array.isArray(event.options) ? event.options.map(option => String(option)) : []
    if (options.length === 0) return null

    return {
      ...base,
      requestedSchema: {
        type: 'object',
        title,
        properties: {
          [RESPONSE_FIELD]: {
            type: 'string',
            title,
            enum: options
          }
        },
        required: [RESPONSE_FIELD]
      }
    }
  }

  if (method === 'confirm') {
    return {
      ...base,
      requestedSchema: {
        type: 'object',
        title,
        properties: {
          [RESPONSE_FIELD]: {
            type: 'boolean',
            title,
            description: stringProp(event, 'message') ?? undefined
          }
        },
        required: [RESPONSE_FIELD]
      }
    }
  }

  const property = {
    type: 'string' as const,
    title,
    ...(method === 'input' && stringProp(event, 'placeholder')
      ? { description: stringProp(event, 'placeholder') ?? undefined }
      : {}),
    ...(method === 'editor' && stringProp(event, 'prefill') !== null
      ? { default: stringProp(event, 'prefill') ?? undefined }
      : {})
  }

  return {
    ...base,
    requestedSchema: {
      type: 'object',
      title,
      properties: { [RESPONSE_FIELD]: property },
      required: [RESPONSE_FIELD]
    }
  }
}

export function toPiExtensionUiResponse(
  id: string,
  method: PiExtensionUiMethod,
  response: CreateElicitationResponse
): PiExtensionUiResponse {
  if (response.action !== 'accept' || !('content' in response)) return { id, cancelled: true }

  const content = response.content
  const value =
    content && typeof content === 'object' ? (content as Record<string, unknown>)[RESPONSE_FIELD] : undefined
  if (method === 'confirm') {
    return typeof value === 'boolean' ? { id, confirmed: value } : { id, cancelled: true }
  }

  return typeof value === 'string' ? { id, value } : { id, cancelled: true }
}

function stringProp(source: Record<string, unknown>, key: string): string | null {
  const value = source[key]
  return typeof value === 'string' ? value : null
}

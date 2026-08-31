import test from 'node:test'
import assert from 'node:assert/strict'
import { toElicitationRequest, toPiExtensionUiResponse } from '../../src/acp/translate/elicitation.js'

test('toElicitationRequest maps pi select options to a required string enum', () => {
  assert.deepEqual(
    toElicitationRequest('s1', 'select', {
      title: 'Pick one',
      options: ['Alpha', 'Beta']
    }),
    {
      sessionId: 's1',
      mode: 'form',
      message: 'Pick one',
      requestedSchema: {
        type: 'object',
        title: 'Pick one',
        properties: {
          value: {
            type: 'string',
            title: 'Pick one',
            enum: ['Alpha', 'Beta']
          }
        },
        required: ['value']
      }
    }
  )
})

test('toElicitationRequest maps pi confirm to a required boolean', () => {
  assert.deepEqual(
    toElicitationRequest('s1', 'confirm', {
      title: 'Clear session?',
      message: 'All messages will be lost.'
    }),
    {
      sessionId: 's1',
      mode: 'form',
      message: 'All messages will be lost.',
      requestedSchema: {
        type: 'object',
        title: 'Clear session?',
        properties: {
          value: {
            type: 'boolean',
            title: 'Clear session?',
            description: 'All messages will be lost.'
          }
        },
        required: ['value']
      }
    }
  )
})

test('toElicitationRequest maps pi input placeholder and editor prefill', () => {
  const input = toElicitationRequest('s1', 'input', {
    title: 'Enter name',
    placeholder: 'Ada Lovelace'
  })
  const editor = toElicitationRequest('s1', 'editor', {
    title: 'Edit text',
    prefill: 'Initial text'
  })

  assert.deepEqual((input as any).requestedSchema.properties.value, {
    type: 'string',
    title: 'Enter name',
    description: 'Ada Lovelace'
  })
  assert.deepEqual((editor as any).requestedSchema.properties.value, {
    type: 'string',
    title: 'Edit text',
    default: 'Initial text'
  })
})

test('toPiExtensionUiResponse maps accepted values and cancellation', () => {
  assert.deepEqual(toPiExtensionUiResponse('ui-1', 'input', { action: 'accept', content: { value: 'Ada' } }), {
    id: 'ui-1',
    value: 'Ada'
  })
  assert.deepEqual(toPiExtensionUiResponse('ui-2', 'confirm', { action: 'accept', content: { value: false } }), {
    id: 'ui-2',
    confirmed: false
  })
  assert.deepEqual(toPiExtensionUiResponse('ui-3', 'editor', { action: 'decline' }), {
    id: 'ui-3',
    cancelled: true
  })
})

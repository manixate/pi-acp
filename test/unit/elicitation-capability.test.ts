import test from 'node:test'
import assert from 'node:assert/strict'
import { PiAcpAgent } from '../../src/acp/agent.js'
import { FakeAgentSideConnection, asAgentConn } from '../helpers/fakes.js'

test('PiAcpAgent passes negotiated form elicitation support to new sessions', async () => {
  const agent = new PiAcpAgent(asAgentConn(new FakeAgentSideConnection()))
  await agent.initialize({
    protocolVersion: 1,
    clientCapabilities: { elicitation: { form: {} } }
  })

  const stop = new Error('stop after capturing session options')
  const createParams: Array<{ supportsFormElicitation?: boolean }> = []
  ;(agent as any).sessions = {
    async create(params: { supportsFormElicitation?: boolean }) {
      createParams.push(params)
      throw stop
    }
  }

  await assert.rejects(agent.newSession({ cwd: process.cwd(), mcpServers: [] }), stop)
  assert.equal(createParams[0]?.supportsFormElicitation, true)
})

test('PiAcpAgent leaves form elicitation disabled when the client does not advertise it', async () => {
  const agent = new PiAcpAgent(asAgentConn(new FakeAgentSideConnection()))
  await agent.initialize({ protocolVersion: 1 })

  const stop = new Error('stop after capturing session options')
  const createParams: Array<{ supportsFormElicitation?: boolean }> = []
  ;(agent as any).sessions = {
    async create(params: { supportsFormElicitation?: boolean }) {
      createParams.push(params)
      throw stop
    }
  }

  await assert.rejects(agent.newSession({ cwd: process.cwd(), mcpServers: [] }), stop)
  assert.equal(createParams[0]?.supportsFormElicitation, false)
})

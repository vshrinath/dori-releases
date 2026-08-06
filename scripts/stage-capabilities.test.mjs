import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

const script = path.resolve('scripts/stage-capabilities.mjs')

test('stages only unique assets addressed to the pinned release tag', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dori-capability-stage-'))
  fs.writeFileSync(path.join(root, 'tool'), 'verified tool')
  fs.writeFileSync(
    path.join(root, 'inventory.json'),
    JSON.stringify({
      capabilities: [{ id: 'youtube', files: [{
        source: 'tool',
        url: 'https://github.com/vshrinath/dori-releases/releases/download/v1.2.3/youtube-tool'
      }] }]
    })
  )
  fs.writeFileSync(
    path.join(root, 'manifest.json'),
    JSON.stringify({ capabilities: [{ id: 'youtube' }] })
  )
  const result = spawnSync(process.execPath, [
    script,
    path.join(root, 'inventory.json'),
    path.join(root, 'manifest.json'),
    path.join(root, 'out'),
    'vshrinath/dori-releases',
    'v1.2.3'
  ])
  assert.equal(result.status, 0, result.stderr.toString())
  assert.equal(fs.readFileSync(path.join(root, 'out/youtube-tool'), 'utf8'), 'verified tool')
})

test('rejects mutable or cross-release asset URLs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dori-capability-stage-'))
  fs.writeFileSync(path.join(root, 'tool'), 'tool')
  fs.writeFileSync(
    path.join(root, 'inventory.json'),
    JSON.stringify({
      capabilities: [{ id: 'youtube', files: [{ source: 'tool', url: 'https://example.com/latest/tool' }] }]
    })
  )
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify({ capabilities: [{ id: 'youtube' }] }))
  const result = spawnSync(process.execPath, [
    script,
    path.join(root, 'inventory.json'),
    path.join(root, 'manifest.json'),
    path.join(root, 'out'),
    'vshrinath/dori-releases',
    'v1.2.3'
  ])
  assert.notEqual(result.status, 0)
})

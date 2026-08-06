#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const [inventoryArg, manifestArg, outputArg, repository, tag] = process.argv.slice(2)
if (!inventoryArg || !manifestArg || !outputArg || !repository || !tag) {
  throw new Error(
    'usage: stage-capabilities.mjs <inventory.json> <manifest.json> <output-dir> <owner/repo> <tag>'
  )
}

const inventoryPath = path.resolve(inventoryArg)
const manifestPath = path.resolve(manifestArg)
const outputDir = path.resolve(outputArg)
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'))
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const expectedBase = `https://github.com/${repository}/releases/download/${tag}/`
const stagedNames = new Set()

if (!Array.isArray(inventory.capabilities) || !Array.isArray(manifest.capabilities)) {
  throw new Error('capability inventory and manifest are required')
}

fs.mkdirSync(outputDir, { recursive: true })
for (const capability of inventory.capabilities) {
  for (const file of capability.files ?? []) {
    if (typeof file.url !== 'string' || !file.url.startsWith(expectedBase)) {
      throw new Error(`capability URL must target the immutable release tag: ${file.url}`)
    }
    const assetName = decodeURIComponent(new URL(file.url).pathname.split('/').at(-1) ?? '')
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(assetName) || stagedNames.has(assetName)) {
      throw new Error(`invalid or duplicate capability asset name: ${assetName}`)
    }
    const source = path.resolve(path.dirname(inventoryPath), file.source)
    if (!fs.statSync(source).isFile()) throw new Error(`missing capability source: ${source}`)
    stagedNames.add(assetName)
    fs.copyFileSync(source, path.join(outputDir, assetName))
  }
}

if (stagedNames.size === 0 || manifest.capabilities.length !== inventory.capabilities.length) {
  throw new Error('capability manifest does not match the inventory')
}
fs.copyFileSync(manifestPath, path.join(outputDir, 'capabilities.json'))
console.log(`staged ${stagedNames.size} immutable capability assets`)

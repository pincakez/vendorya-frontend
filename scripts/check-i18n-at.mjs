#!/usr/bin/env node
/**
 * Guard against the vue-i18n "@" trap (it has bitten us 3x).
 *
 * vue-i18n treats "@" as a special "linked message" marker. A translation
 * VALUE that contains a literal "@" (e.g. "email@example.com") fails message
 * compilation. In dev this is only a console warning, so it sneaks through —
 * but in the PRODUCTION build it throws mid-render and silently breaks whatever
 * component renders that string (this is what killed the Add Customer / Add
 * Staff modals). See CLAUDE.md + memory: reference_i18n_at_sign.
 *
 * The literal "@" must be escaped as {'@'} in the JSON. This script blocks the
 * build if any bare "@" slips in.
 *
 *   node scripts/check-i18n-at.mjs          # check, exit 1 on violation
 *   node scripts/check-i18n-at.mjs --fix    # auto-escape bare @ -> {'@'}
 *
 * Runs automatically as `prebuild`, so it protects every savegame/deploy.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const LOCALES = ['en.json', 'ar.json'].map(f => resolve(here, '../src/locales', f))
const FIX = process.argv.includes('--fix')

// A bare "@" = an @ that is NOT already part of the {'@'} escape.
// Strip every {'@'} occurrence, then any remaining @ is a violation.
const ESCAPE = /\{'@'\}/g
const hasBareAt = (line) => line.replace(ESCAPE, '').includes('@')

let totalViolations = 0
let totalFixed = 0

for (const file of LOCALES) {
  const raw = readFileSync(file, 'utf8')
  const lines = raw.split('\n')
  const short = file.split('/').slice(-2).join('/')

  if (FIX) {
    const fixed = lines.map((line) => {
      if (!hasBareAt(line)) return line
      totalFixed++
      // Replace each bare @ (not inside an existing {'@'}) with the escape.
      // Tokenise on the escape so we never double-wrap.
      return line
        .split(ESCAPE)
        .map((seg) => seg.replaceAll('@', "{'@'}"))
        .join("{'@'}")
    })
    if (totalFixed) writeFileSync(file, fixed.join('\n'))
  } else {
    lines.forEach((line, i) => {
      if (hasBareAt(line)) {
        totalViolations++
        console.error(`  ${short}:${i + 1}  ${line.trim()}`)
      }
    })
  }
}

if (FIX) {
  console.log(`i18n @-guard: escaped ${totalFixed} line(s).`)
  process.exit(0)
}

if (totalViolations) {
  console.error('\n❌ i18n @-guard: found unescaped "@" in locale files.')
  console.error('   vue-i18n reads "@" as a linked-message marker — it crashes the')
  console.error('   production build (this broke the Add Customer/Staff modals).')
  console.error("   Escape every literal @ as {'@'} — or run:  npm run i18n:fix\n")
  process.exit(1)
}

console.log('✓ i18n @-guard: no unescaped "@" in locale files.')

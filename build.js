import { execSync } from 'child_process'
import { mkdirSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const run = (cmd, cwd) => execSync(cmd, { stdio: 'inherit', cwd: cwd || __dirname })

// Add new apps here
const apps = [
  'policy-lines',
  'uk-gov-network-graph',
  'smile',
  'morgan-map',
]

mkdirSync(join(__dirname, 'dist'), { recursive: true })
for (const app of apps) run('npm run build', join(__dirname, 'apps', app))
copyFileSync(join(__dirname, 'index.html'), join(__dirname, 'dist', 'index.html'))

console.log('\nBuild complete.')

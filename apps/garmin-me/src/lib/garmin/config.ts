import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Where secrets and personal data live. Both are deliberately OUTSIDE the git
 * repository (which is public), so neither can be committed by accident.
 */
export const GARMIN_BASE_URL = 'https://personal.connectapi.garmin.com'

export const API_KEY_FILE = join(homedir(), '.config', 'garmin-me', 'api-key')

export const DATA_DIR =
  process.env.GARMIN_ME_DATA_DIR?.trim() ||
  join(homedir(), 'Library', 'Application Support', 'garmin-me')

export const DB_FILE = join(DATA_DIR, 'garmin.db')

/**
 * @fileoverview Initializes the scoreboard.
 */

/** @define {string} API Key for CTF scoreboard */
const API_KEY = 'INSERT_YOUR_FIREBASE_API_KEY'
/** @define {string} Auth Domain for CTF scoreboard */
const AUTH_DOMAIN = 'INSERT_YOUR_FIREBASE_AUTH_DOMAIN'
/** @define {string} Database URL for CTF scoreboard */
const DATABASE_URL = 'INSERT_YOUR_DATABASE_URL'
/** @define {string} Project ID for CTF scoreboard */
const PROJECT_ID = 'INSERT_YOUR_PROJECT_ID'
/** @define {string} Storage Bucket for CTF scoreboard */
const STORAGE_BUCKET = 'INSERT_YOUR_BUCKET'
const MESSAGE_SENDER_ID = 'INSERT_YOUR_MESSAGE_ID'
const APP_ID = 'INSERT_YOUR_APP_ID'

import { initializeApp } from 'firebase/app'
import Scoreboard from './scoreboard'

initializeApp({
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  databaseURL: DATABASE_URL,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGE_SENDER_ID,
  appId: APP_ID
})

new Scoreboard().init()

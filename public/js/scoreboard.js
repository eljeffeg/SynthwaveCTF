/**
 * @fileoverview CTF Scoreboard Main Class.
 */

import { getDatabase, ref, child } from 'firebase/database'

import Database from './database'
import UI from './ui'
import TaskList from './tasklist'
import TeamList from './teamlist'
import Readme from './readme'
import Quest from './quest'
import Session from './session'
import Theme from './theme'
import Console from './terminal'

export default class Scoreboard {
  constructor () {
    this.session = null
    this.quest = null
    this.xterm = null
  }
  async init () {
    const db = getDatabase()
    const database = new Database(ref(db))
    const ui = new UI(this)
    const taskList = new TaskList(database, ui)
    const teamList = new TeamList(database, ui, taskList, window)
    const readme = new Readme(database, ui)
    const quest = new Quest(database, ui)
    const xconsole = new Console(this)
    const loadScoreboard = () => {
      teamList.loadTeams()
      taskList.loadTasks()
      readme.loadReadme()
      quest.loadTasks()
      xconsole.loadTerminal()
      window.addEventListener('resize', function () {
        xconsole.resize()
      })
      this.quest = quest
      this.session = new Session(database)
      this.xterm = xconsole
      let materialUpgrader = () => {}
      if (window.componentHandler) {
        materialUpgrader = window.componentHandler.upgradeElement.bind(
          window.componentHandler
        )
      }
      new Theme(ui, window, materialUpgrader).init()
    }
    const gameStart = database.getStart()
    gameStart.then((start) => {
      if (Date.now() > start) {
        const inlineScript = document.createElement('script')
        inlineScript.src = 'js/game.js'
        inlineScript.onload = () => {
          try {
            soundIconReset()
          } catch (e) {}
          loadScoreboard()
        }
        inlineScript.onerror = () => {
          loadScoreboard()
        }
        document.head.append(inlineScript)
      } else {
        loadScoreboard()
      }
    })
  }
}

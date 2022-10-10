/**
 * @fileoverview Loads FAQs, updates, and announcements.
 */

export default class Readme {
  constructor (database, ui) {
    this.database = database
    this.ui = ui
  }
  loadReadme () {
    this.database.onReadmeChanged((key, val) => {
      this.ui.updateReadme(key, val)
    })
  }
}

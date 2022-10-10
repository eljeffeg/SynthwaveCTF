/**
 * @fileoverview Keeps track of the user's session state and mutations.
 */
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth'

export default class Session {
  constructor (database) {
    this.database = database
    this.user = null
    this.team = null
  }
  async login () {
    const auth = getAuth()
    //const provider = new GoogleAuthProvider()
    //const loginResult = await signInWithPopup(auth, provider)
    const loginResult = await signInAnonymously(auth)
    this.user = loginResult.user
    this.tryToRecordTeam()
  }
  async getCreatorTeam () {
    const teamKey = await this.database.getTeamKeyFromUserId(this.user.uid)
    return new UserTeam(this.database, teamKey)
  }
  async setCreatorTeam (userTeam) {
    await this.database.setTeamKeyForUserId(this.user.uid, userTeam.teamKey)
  }
  async joinTeam (teamKey) {
    const userTeam = new UserTeam(this.database, teamKey)
    const teamName = await userTeam.getName()
    this.team = userTeam
    this.tryToRecordTeam()
    return teamName
  }
  tryToRecordTeam () {
    if (this.user && this.team) {
      this.database.recordJoinedTeam(
        this.user.uid,
        this.team.teamKey,
        this.user.email
      )
    }
  }
  async recoverTeam () {
    let userTeam = await this.getCreatorTeam()
    this.team = userTeam
    await this.setCreatorTeam(userTeam)
    return userTeam
  }
  async createTeam (teamName) {
    const userTeam = await this.recoverTeam()
    await userTeam.changeTeamName(teamName)
    return userTeam.teamKey
  }
}

class UserTeam {
  constructor (database, teamKey = null) {
    this.database = database
    this.teamKey = teamKey
  }
  async getName () {
    return await this.database.getTeamNameFromTeamKey(this.teamKey)
  }
  async changeTeamName (teamName) {
    await this.database.changeTeamNameForTeamKey(this.teamKey, teamName)
  }
  async submitFlag (task, flag) {
    await this.database.submitFlagForTeamKey(this.teamKey, task, flag)
  }
}

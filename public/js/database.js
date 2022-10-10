/**
 * @fileoverview Defines the database interactions and schema.
 */
import {
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  orderByChild,
  equalTo,
  child,
  get,
  push,
  set,
  query
} from 'firebase/database'

const DatabaseSchema = {
  CONFIG: 'config',
  USER_TEAMS: 'userTeams',
  TEAMS: 'teams',
  TEAMS_TASKS: 'tasks',
  TEAM_NAME: 'name',
  MAPPING: 'mapping',
  TASKS: 'tasks',
  TASKS_SOLVED: 'solved',
  TASK_SOLUTIONS: 'taskSolutions',
  SCOREBOARD: 'scoreboard',
  SCOREBOARD_TASKS: 'tasks',
  TEAM_LOG: 'teamLog',
  README: 'readme',
  QUEST: 'quest',
  QUEST_TASKS: 'tasks',
  QUEST_FLAGS: 'flags'
}

export default class Database {
  constructor (firebaseDatabaseRef) {
    this.databaseRef = firebaseDatabaseRef
    this.start = this.getStart()
   
  }
  async changeTeamNameForTeamKey (teamKey, teamName) {
    // If this is a name change, we first need to delete the old mapping.
    let currentName = await this.getTeamNameFromTeamKey(teamKey)
    if (currentName && currentName != teamName) {
      let currentMapping = this.getMappingRefFromTeamName_(currentName)
      try {
        // Try to delete the current mapping. This will succeed if it was ours,
        // as long as we haven't submitted any tasks. If this fails, then that
        // means we either already have tasks, or it doesn't belong to us.
        await currentMapping.remove()
      } catch (e) {}
    }
    // Change the team name. This will succeed if the old mapping is gone, or if
    // it doesn't belong to us. This can fail if the old mapping belonged to us
    // but didn't get deleted in the previous step because we had already some
    // tasks solved under that name.
    const name = await child(
      this.getTeamRefFromTeamKey_(teamKey),
      DatabaseSchema.TEAM_NAME
    )
    await set(name, teamName)
    // Set the new mapping. This will succeed if the name matches the one we set
    // in the step above.
    const map = await this.getMappingRefFromTeamName_(teamName)
    await set(map, teamKey)
  }
  getMappingRefFromTeamName_ (teamName) {
    return child(this.databaseRef, `${DatabaseSchema.MAPPING}/${teamName}`)
  }
  getTeamRefFromTeamKey_ (teamKey) {
    return child(this.databaseRef, `${DatabaseSchema.TEAMS}/${teamKey}`)
  }
  async getStart () {
    const start = await get(
      child(this.databaseRef, `${DatabaseSchema.CONFIG}/start`)
    )
    return start.val()
  }
  async getTeamNameFromTeamKey (teamKey) {
    const name = await get(
      child(this.getTeamRefFromTeamKey_(teamKey), DatabaseSchema.TEAM_NAME)
    )
    return name.val()
  }
  async submitQuestFlag (taskName, flag) {
    let result = await get(
      query(
        child(
          this.databaseRef,
          `${DatabaseSchema.QUEST}/${DatabaseSchema.QUEST_FLAGS}`
        )
      )
        .orderByValue()
        .equalTo(flag)
    )
    if (result.val()[taskName] != flag) {
      throw 'Error submitting quest flag'
    }
  }
  async submitFlagForTeamKey (teamKey, task, flag) {
    let teamName = await this.getTeamNameFromTeamKey(teamKey)
    let solved = await this.recordFlagInTeam_(teamKey, task, flag)
    if (solved) {
      // If these fail, they'll be fixed in a Firebase function.
      try {
        await this.recordTaskSolution_(task, teamName, solved)
        await this.addSolvedTaskToScoreboard_(task, teamName, solved)
      } catch (e) {
        Promise.reject('Error committing flag.')
      }
    } else {
      // Incorrect flag or Error submitting flag.
      throw 'Incorrect flag'
    }
  }
  async recordFlagInTeam_ (teamKey, task, flag) {
    let submitRef = child(
      this.getTeamRefFromTeamKey_(teamKey),
      `${DatabaseSchema.TEAMS_TASKS}/${task}`
    )
    try {
      await set(submitRef, { flag: flag, solved: Date.now() })
    } catch (e) {}
    const solved = await get(child(submitRef, DatabaseSchema.TASKS_SOLVED))
    return solved.val()
  }
  async recordTaskSolution_ (task, teamName, solved) {
    const taskRef = await child(
      this.databaseRef,
      `${DatabaseSchema.TASK_SOLUTIONS}/${task}/${teamName}`
    )
    await set(taskRef, solved)
  }
  async addSolvedTaskToScoreboard_ (task, teamName, solved) {
    const taskRef = await child(
      this.databaseRef,
      `${DatabaseSchema.SCOREBOARD}/${teamName}/${DatabaseSchema.SCOREBOARD_TASKS}/${task}`
    )
    await set(taskRef, solved)
  }
  async getTeamKeyFromUserId (userId) {
    let key = await get(this.getTeamRefFromUserId_(userId))
    key = key.val()
    if (!key) {
      key = await push(child(this.databaseRef, DatabaseSchema.TEAMS)).key
    }
    return key
  }
  getTeamRefFromUserId_ (userId) {
    return child(this.databaseRef, `${DatabaseSchema.USER_TEAMS}/${userId}`)
  }
  async setTeamKeyForUserId (userId, teamKey) {
    const team = await this.getTeamRefFromUserId_(userId)
    await set(team, teamKey)
  }
  async recordJoinedTeam (userId, teamKey, userEmail) {
    const team = await child(
      this.databaseRef,
      `${DatabaseSchema.TEAM_LOG}/${teamKey}/${userId}`
    )
    await set(team, userEmail)
  }
  onQuestTaskChanged (updateTask) {
    onChildAdded(
      child(
        this.databaseRef,
        `${DatabaseSchema.QUEST}/${DatabaseSchema.QUEST_TASKS}`
      ),
      snap => {
        updateTask(snap.key, snap.val())
      }
    )
    onChildChanged(
      child(
        this.databaseRef,
        `${DatabaseSchema.QUEST}/${DatabaseSchema.QUEST_TASKS}`
      ),
      snap => {
        updateTask(snap.key, snap.val())
      }
    )
    onChildRemoved(
      child(
        this.databaseRef,
        `${DatabaseSchema.QUEST}/${DatabaseSchema.QUEST_TASKS}`
      ),
      snap => {
        updateTask(snap.key, {})
      }
    )
  }
  onTaskChanged (updateTask) {
    onChildAdded(
      query(
        child(this.databaseRef, DatabaseSchema.TASKS),
        orderByChild('visible'),
        equalTo(true)
      ),
      snap => {
        updateTask(snap.key, snap.val())
      }
    )
    onChildChanged(
      query(
        child(this.databaseRef, DatabaseSchema.TASKS),
        orderByChild('visible'),
        equalTo(true)
      ),
      snap => {
        updateTask(snap.key, snap.val())
      }
    )
    onChildRemoved(
      query(
        child(this.databaseRef, DatabaseSchema.TASKS),
        orderByChild('visible'),
        equalTo(true)
      ),
      snap => {
        updateTask(snap.key, {})
      }
    )
  }
  onTaskSolutionChanged (task, addTaskSolution) {
    onChildAdded(
      child(this.databaseRef, `${DatabaseSchema.TASK_SOLUTIONS}/${task}`),
      snap => {
        addTaskSolution(snap.key, snap.val())
      }
    )
    onChildChanged(
      child(this.databaseRef, `${DatabaseSchema.TASK_SOLUTIONS}/${task}`),
      snap => {
        addTaskSolution(snap.key, snap.val())
      }
    )
    onChildRemoved(
      child(this.databaseRef, `${DatabaseSchema.TASK_SOLUTIONS}/${task}`),
      snap => {
        addTaskSolution(snap.key, null)
      }
    )
  }
  onTeamChanged (updateTeam) {
    onChildAdded(child(this.databaseRef, DatabaseSchema.SCOREBOARD), snap => {
      updateTeam(snap.key, snap.val())
    })
    onChildChanged(child(this.databaseRef, DatabaseSchema.SCOREBOARD), snap => {
      updateTeam(snap.key, snap.val())
    })
    onChildRemoved(child(this.databaseRef, DatabaseSchema.SCOREBOARD), snap => {
      updateTeam(snap.key, {})
    })
  }
  onReadmeChanged (updateReadme) {
    onChildAdded(child(this.databaseRef, DatabaseSchema.README), snap => {
      updateReadme(snap.key, snap.val())
    })
    onChildChanged(child(this.databaseRef, DatabaseSchema.README), snap => {
      updateReadme(snap.key, snap.val())
    })
    onChildRemoved(child(this.databaseRef, DatabaseSchema.README), snap => {
      updateReadme(snap.key, {})
    })
  }
}

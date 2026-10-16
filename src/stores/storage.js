import { reactive } from 'vue'
import { Project, Todo, Stamp, Reward, Exchange, SYSTEM_PROJECTS, TODO_STATUS, SYNC_STATUS } from '../types/index.js'

const STORAGE_KEY = 'goodstamp-v1'
const DATA_VERSION = 3

// 초기 데이터 시드
const seedData = () => ({
  dataVersion: DATA_VERSION,
  profile: null,
  projects: [
    new Project({
      id: SYSTEM_PROJECTS.HOME,
      name: '개인',
      description: '세탁, 분리수거, 장보기 등 생활 할 일',
      color: '#10b981',
      sortOrder: 1,
      isSystem: true,
      stampsEnabled: true
    }),
    new Project({
      id: SYSTEM_PROJECTS.UNIVERSITY,
      name: '학업',
      description: '공부 및 학업 관련 할 일',
      color: '#3b82f6',
      sortOrder: 2,
      isSystem: true,
      stampsEnabled: true
    }),
    new Project({
      id: SYSTEM_PROJECTS.BASE,
      name: '기본',
      description: '공통·기본 할 일, 오래된 이력 정리',
      color: '#f59e0b',
      sortOrder: 3,
      isSystem: true,
      stampsEnabled: true
    })
  ],
  todos: [],
  stamps: [],
  rewards: [],
  exchanges: [],
  syncState: {
    status: SYNC_STATUS.SYNCED,
    lastSyncAt: null,
    pendingChanges: [],
    cursor: null,
    errorMessage: null
  }
})

// 마이그레이션 함수 (v2 → v3)
function migrateFromV2(oldData) {
  const migrated = seedData()

  // 프로필 마이그레이션
  if (oldData.profile) {
    migrated.profile = oldData.profile
  }

  // 보상 마이그레이션 (기본 보상 유지)
  if (oldData.rewards && oldData.rewards.length > 0) {
    migrated.rewards = oldData.rewards.map(r => new Reward({
      title: r.title,
      requiredStamps: r.required,
      projectId: SYSTEM_PROJECTS.HOME
    }))
  }

  // 할 일 마이그레이션
  if (oldData.todos && oldData.todos.length > 0) {
    migrated.todos = oldData.todos.map(t => new Todo({
      title: t.title,
      projectId: SYSTEM_PROJECTS.HOME,
      status: t.completed ? TODO_STATUS.DONE : TODO_STATUS.TODO,
      dueDate: t.date || null
    }))
  }

  // 스탬프 마이그레이션
  if (oldData.stamps && oldData.stamps.length > 0) {
    migrated.stamps = oldData.stamps.map(s => new Stamp({
      todoId: s.todoId,
      date: s.date,
      projectId: SYSTEM_PROJECTS.HOME
    }))
  }

  // 교환 마이그레이션
  if (oldData.exchanges && oldData.exchanges.length > 0) {
    migrated.exchanges = oldData.exchanges.map(e => new Exchange({
      rewardId: e.rewardId,
      stampCount: e.count,
      date: e.date,
      projectId: SYSTEM_PROJECTS.HOME
    }))
  }

  return migrated
}

// 저장소 상태
let raw = localStorage.getItem(STORAGE_KEY)
let state

if (raw) {
  try {
    const parsed = JSON.parse(raw)
    if (parsed.dataVersion === DATA_VERSION) {
      state = reactive(parsed)
    } else if (parsed.dataVersion === 2) {
      // v2에서 v3로 마이그레이션
      console.log('Migrating from v2 to v3...')
      state = reactive(migrateFromV2(parsed))
      save()
    } else {
      // 알 수 없는 버전 - 초기화
      console.warn('Unknown data version, initializing...')
      state = reactive(seedData())
    }
  } catch (e) {
    console.error('Data parse error:', e)
    state = reactive(seedData())
  }
} else {
  state = reactive(seedData())
}

// 저장 함수
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// 프로젝트 관련
function getProjects() {
  return state.projects.filter(p => !p.deletedAt)
}

function getProjectById(id) {
  return state.projects.find(p => p.id === id && !p.deletedAt)
}

function createProject(data) {
  const project = new Project(data)
  state.projects.push(project)
  save()
  return project
}

function updateProject(id, data) {
  const project = state.projects.find(p => p.id === id)
  if (!project) return null

  Object.assign(project, data, { updatedAt: new Date().toISOString() })
  save()
  return project
}

function deleteProject(id) {
  const project = state.projects.find(p => p.id === id)
  if (!project || project.isSystem) return false

  project.deletedAt = new Date().toISOString()
  save()
  return true
}

// 할 일 관련
function getTodos(projectId = null) {
  let todos = state.todos.filter(t => !t.deletedAt)
  if (projectId) {
    todos = todos.filter(t => t.projectId === projectId)
  }
  return todos
}

function getTodoById(id) {
  return state.todos.find(t => t.id === id && !t.deletedAt)
}

function createTodo(data) {
  if (!data.projectId) {
    throw new Error('projectId is required')
  }

  const project = getProjectById(data.projectId)
  if (!project) {
    throw new Error('Project not found')
  }

  const todo = new Todo(data)
  state.todos.push(todo)

  // 변경 큐에 추가
  addPendingChange({
    entityType: 'TODO',
    entityId: todo.id,
    operation: 'CREATE',
    data: todo
  })

  save()
  return todo
}

function updateTodo(id, data) {
  const todo = state.todos.find(t => t.id === id)
  if (!todo) return null

  Object.assign(todo, data, { updatedAt: new Date().toISOString() })

  // 변경 큐에 추가
  addPendingChange({
    entityType: 'TODO',
    entityId: todo.id,
    operation: 'UPDATE',
    data: todo,
    baseVersion: todo.version
  })

  save()
  return todo
}

function deleteTodo(id) {
  const todo = state.todos.find(t => t.id === id)
  if (!todo) return false

  todo.deletedAt = new Date().toISOString()

  // 변경 큐에 추가
  addPendingChange({
    entityType: 'TODO',
    entityId: todo.id,
    operation: 'DELETE',
    data: { id: todo.id }
  })

  save()
  return true
}

function toggleTodoStatus(id) {
  const todo = state.todos.find(t => t.id === id)
  if (!todo) return false

  todo.status = todo.status === TODO_STATUS.DONE ? TODO_STATUS.TODO : TODO_STATUS.DONE
  todo.updatedAt = new Date().toISOString()
  save()
  return true
}

// 스탬프 관련
function getStamps(projectId = null) {
  let stamps = state.stamps
  if (projectId) {
    stamps = stamps.filter(s => s.projectId === projectId)
  }
  return stamps
}

function createStamp(data) {
  const stamp = new Stamp(data)
  state.stamps.push(stamp)
  save()
  return stamp
}

// 보상 관련
function getRewards(projectId = null) {
  let rewards = state.rewards.filter(r => !r.deletedAt)
  if (projectId) {
    rewards = rewards.filter(r => r.projectId === projectId)
  }
  return rewards
}

function getRewardById(id) {
  return state.rewards.find(r => r.id === id && !r.deletedAt)
}

function createReward(data) {
  if (!data.projectId) {
    throw new Error('projectId is required')
  }

  const project = getProjectById(data.projectId)
  if (!project) {
    throw new Error('Project not found')
  }

  if (!project.stampsEnabled) {
    throw new Error('Stamps are not enabled for this project')
  }

  const reward = new Reward(data)
  state.rewards.push(reward)
  save()
  return reward
}

function updateReward(id, data) {
  const reward = state.rewards.find(r => r.id === id)
  if (!reward) return null

  Object.assign(reward, data, { updatedAt: new Date().toISOString() })
  save()
  return reward
}

function deleteReward(id) {
  const reward = state.rewards.find(r => r.id === id)
  if (!reward) return false

  reward.deletedAt = new Date().toISOString()
  save()
  return true
}

// 교환 관련
function getExchanges(projectId = null) {
  let exchanges = state.exchanges
  if (projectId) {
    exchanges = exchanges.filter(e => e.projectId === projectId)
  }
  return exchanges
}

function createExchange(data) {
  const exchange = new Exchange(data)
  state.exchanges.push(exchange)
  save()
  return exchange
}

// 프로필 관련
function getProfile() {
  return state.profile
}

function setProfile(profile) {
  state.profile = profile
  save()
}

function clearProfile() {
  state.profile = null
  save()
}

// 동기화 상태 관련
function getSyncState() {
  return state.syncState
}

function updateSyncState(data) {
  Object.assign(state.syncState, data)
  save()
}

function setSyncStatus(status) {
  state.syncState.status = status
  save()
}

function addPendingChange(change) {
  state.syncState.pendingChanges.push({
    ...change,
    id: generateUUID(),
    createdAt: new Date().toISOString()
  })
  state.syncState.status = SYNC_STATUS.PENDING
  save()
}

function removePendingChange(changeId) {
  const index = state.syncState.pendingChanges.findIndex(c => c.id === changeId)
  if (index !== -1) {
    state.syncState.pendingChanges.splice(index, 1)
    if (state.syncState.pendingChanges.length === 0) {
      state.syncState.status = SYNC_STATUS.SYNCED
    }
    save()
  }
}

function clearPendingChanges() {
  state.syncState.pendingChanges = []
  state.syncState.status = SYNC_STATUS.SYNCED
  save()
}

function getPendingChangesCount() {
  return state.syncState.pendingChanges.length
}

// 전체 데이터 내보내기 (백업용)
function exportData() {
  return JSON.stringify(state, null, 2)
}

// 전체 데이터 가져오기 (복구용)
function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (data.dataVersion !== DATA_VERSION) {
      throw new Error('Invalid data version')
    }
    Object.assign(state, data)
    save()
    return true
  } catch (e) {
    console.error('Import error:', e)
    return false
  }
}

export {
  state,
  save,
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodoStatus,
  getStamps,
  createStamp,
  getRewards,
  getRewardById,
  createReward,
  updateReward,
  deleteReward,
  getExchanges,
  createExchange,
  getProfile,
  setProfile,
  clearProfile,
  getSyncState,
  updateSyncState,
  setSyncStatus,
  addPendingChange,
  removePendingChange,
  clearPendingChanges,
  getPendingChangesCount,
  exportData,
  importData,
  SYSTEM_PROJECTS,
  TODO_STATUS,
  SYNC_STATUS
}

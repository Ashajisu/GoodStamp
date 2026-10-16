import { computed } from 'vue'
import {
  state,
  getProfile,
  setProfile,
  clearProfile,
  getTodos,
  createTodo,
  updateTodo as storageUpdateTodo,
  deleteTodo as storageDeleteTodo,
  toggleTodoStatus,
  getStamps,
  createStamp,
  getRewards,
  createReward,
  updateReward as storageUpdateReward,
  deleteReward as storageDeleteReward,
  getExchanges,
  createExchange,
  getSyncState,
  setSyncStatus,
  getPendingChangesCount,
  SYSTEM_PROJECTS,
  TODO_STATUS,
  SYNC_STATUS,
  exportData,
  importData
} from './storage.js'
import { apiClient } from '../api/client.js'

// 기존 UI 호환성을 위한 래퍼 함수들

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function todayKey() {
  return formatDate(new Date())
}

// 오늘의 할 일 (기존 호환성 - home 프로젝트)
const todayTodos = computed(() =>
  getTodos(SYSTEM_PROJECTS.HOME).filter(todo => todo.dueDate === todayKey())
)

const stamps = computed(() => getStamps(SYSTEM_PROJECTS.HOME).length)

// 이번 주 월요일
const getWeekMonday = (baseDate = new Date()) => {
  const date = new Date(baseDate)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

const weekStamps = computed(() => {
  const monday = getWeekMonday()
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const startDate = formatDate(monday)
  const endDate = formatDate(sunday)
  return getStamps(SYSTEM_PROJECTS.HOME).filter(
    stamp => stamp.date >= startDate && stamp.date <= endDate
  )
})

// 기존 UI 호환용 addTodo (home 프로젝트에 생성)
function addTodo(data) {
  return createTodo({
    title: data.title,
    projectId: SYSTEM_PROJECTS.HOME,
    dueDate: todayKey(),
    status: TODO_STATUS.TODO
  })
}

// 기존 UI 호환용 updateTodo
function updateTodoCompat(todoId, data) {
  return storageUpdateTodo(todoId, {
    title: data.title
  })
}

// 기존 UI에서 호출하는 updateTodo (래퍼)
function updateTodo(todoId, data) {
  return updateTodoCompat(todoId, data)
}

// 기존 UI 호환용 deleteTodo
function deleteTodoCompat(todo) {
  return storageDeleteTodo(todo.id)
}

// 기존 UI에서 호출하는 deleteTodo (래퍼)
function deleteTodo(todo) {
  return deleteTodoCompat(todo)
}

// 기존 UI 호환용 toggleTodo
function toggleTodo(todo) {
  const project = getProjectById(todo.projectId)
  if (project && project.stampsEnabled) {
    // 스탬프 기능이 활성화된 프로젝트에서만 스탬프 생성
    if (todo.status === TODO_STATUS.TODO) {
      createStamp({
        todoId: todo.id,
        projectId: todo.projectId
      })
    }
  }
  return toggleTodoStatus(todo.id)
}

// 기존 UI 호환용 addReward (home 프로젝트에 생성)
function addReward(title, required) {
  return createReward({
    title,
    requiredStamps: required,
    projectId: SYSTEM_PROJECTS.HOME
  })
}

// 기존 UI 호환용 updateReward
function updateRewardCompat(rewardId, title, required) {
  return storageUpdateReward(rewardId, {
    title,
    requiredStamps: required
  })
}

// 기존 UI에서 호출하는 updateReward (래퍼)
function updateReward(rewardId, title, required) {
  return updateRewardCompat(rewardId, title, required)
}

// 기존 UI 호환용 deleteReward
function deleteRewardCompat(rewardId) {
  return storageDeleteReward(rewardId)
}

// 기존 UI에서 호출하는 deleteReward (래퍼)
function deleteReward(rewardId) {
  return deleteRewardCompat(rewardId)
}

// 기존 UI 호환용 exchangeReward
function exchangeReward(reward) {
  const currentStamps = getStamps(SYSTEM_PROJECTS.HOME)
  if (currentStamps.length < reward.requiredStamps) {
    return false
  }

  // 스탬프 차감 (처음 N개 삭제)
  const stampsToRemove = reward.requiredStamps
  for (let i = 0; i < stampsToRemove; i++) {
    const index = state.stamps.findIndex(s => s.projectId === SYSTEM_PROJECTS.HOME)
    if (index !== -1) {
      state.stamps.splice(index, 1)
    }
  }

  // 교환 기록 생성
  createExchange({
    rewardId: reward.id,
    stampCount: reward.requiredStamps,
    projectId: SYSTEM_PROJECTS.HOME
  })

  return true
}

const usedStampCount = computed(() =>
  getExchanges(SYSTEM_PROJECTS.HOME).reduce((total, exchange) => {
    return total + exchange.stampCount
  }, 0)
)

const totalStampCount = computed(() =>
  stamps.value + usedStampCount.value
)

// 동기화 상태 관련
const syncState = computed(() => getSyncState())
const pendingChangesCount = computed(() => getPendingChangesCount())
const syncStatusText = computed(() => {
  const status = syncState.value.status
  switch (status) {
    case SYNC_STATUS.SYNCED:
      return '동기화 완료'
    case SYNC_STATUS.SYNCING:
      return '동기화 중...'
    case SYNC_STATUS.PENDING:
      return `미전송 변경 ${pendingChangesCount.value}건`
    case SYNC_STATUS.ERROR:
      return '동기화 실패'
    case SYNC_STATUS.CONFLICT:
      return '충돌 발생'
    default:
      return '알 수 없음'
  }
})

function getSyncStatus() {
  return syncState.value.status
}

function isSynced() {
  return syncState.value.status === SYNC_STATUS.SYNCED
}

function hasPendingChanges() {
  return syncState.value.status === SYNC_STATUS.PENDING && pendingChangesCount.value > 0
}

function manualSync() {
  // 백엔드 연동 후 구현
  console.log('Manual sync triggered')
  setSyncStatus(SYNC_STATUS.SYNCING)
  setTimeout(() => {
    setSyncStatus(SYNC_STATUS.SYNCED)
  }, 1000)
}

// 로그인/로그아웃
async function login(id, birth) {
  try {
    const response = await apiClient.login(id, birth)
    setProfile({ id, birth, userId: response.userId })
    return response
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

async function logout() {
  try {
    await apiClient.logout()
    clearProfile()
  } catch (error) {
    console.error('Logout error:', error)
    // 로컬에서는 로그아웃 처리
    clearProfile()
  }
}

// 백업/복구
function exportBackup() {
  const backup = {
    format: 'goodstamp-backup',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    data: JSON.parse(exportData())
  }
  return JSON.stringify(backup, null, 2)
}

function importBackup(jsonString) {
  try {
    const backup = JSON.parse(jsonString)
    if (backup.format !== 'goodstamp-backup') {
      throw new Error('Invalid backup format')
    }
    if (!backup.data || typeof backup.data !== 'object') {
      throw new Error('Invalid backup data')
    }
    return backup.data
  } catch (e) {
    console.error('Backup import error:', e)
    return null
  }
}

function restoreFromBackup(data) {
  if (!data) return false
  return importData(JSON.stringify(data))
}

// 기존 UI에서 사용하던 함수들 (이름 변경으로 인한 호환성)
function cleanupOldTodos() {
  // 새로운 시스템에서는 자동 정리 기능이 다름
  // 후속 구현
}

function migrateState(saved) {
  // 마이그레이션은 storage.js에서 처리
  return saved
}

function updateProgress(todo, progress) {
  // 기존 기능 - 후속 구현
  console.log('updateProgress not implemented yet')
}

function save() {
  // storage.js에서 자동 저장
}

// 내부 헬퍼 함수
function getProjectById(id) {
  return state.projects.find(p => p.id === id && !p.deletedAt)
}

export {
  state,
  todayTodos,
  todayKey,
  stamps,
  login,
  logout,
  addTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
  updateProgress,
  addReward,
  updateReward,
  deleteReward,
  exchangeReward,
  save,
  weekStamps,
  usedStampCount,
  totalStampCount,
  getWeekMonday,
  cleanupOldTodos,
  migrateState,
  exportBackup,
  importBackup,
  restoreFromBackup,
  syncState,
  pendingChangesCount,
  syncStatusText,
  getSyncStatus,
  isSynced,
  hasPendingChanges,
  manualSync,
  SYSTEM_PROJECTS,
  TODO_STATUS,
  SYNC_STATUS
}

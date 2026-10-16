// 시스템 프로젝트 ID 상수
export const SYSTEM_PROJECTS = {
  HOME: 'home',
  UNIVERSITY: 'university',
  BASE: 'base'
}

// 프로젝트 타입
export class Project {
  constructor(data = {}) {
    this.id = data.id || generateUUID()
    this.userId = data.userId || null
    this.name = data.name || ''
    this.description = data.description || null
    this.color = data.color || '#3b82f6'
    this.sortOrder = data.sortOrder ?? 0
    this.version = data.version ?? 0
    this.isSystem = data.isSystem ?? false
    this.stampsEnabled = data.stampsEnabled ?? true
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
    this.deletedAt = data.deletedAt || null
  }
}

// 할 일 상태
export const TODO_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE'
}

// 동기화 상태
export const SYNC_STATUS = {
  SYNCED: 'SYNCED',           // 동기화 완료
  SYNCING: 'SYNCING',         // 동기화 중
  PENDING: 'PENDING',         // 미전송 변경 있음
  ERROR: 'ERROR',             // 동기화 실패
  CONFLICT: 'CONFLICT'        // 충돌 발생
}

// 할 일 타입
export class Todo {
  constructor(data = {}) {
    this.id = data.id || generateUUID()
    this.userId = data.userId || null
    this.projectId = data.projectId || null
    this.title = data.title || ''
    this.memo = data.memo || null
    this.status = data.status || TODO_STATUS.TODO
    this.dueDate = data.dueDate || null
    this.sortOrder = data.sortOrder ?? 0
    this.version = data.version ?? 0
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
    this.deletedAt = data.deletedAt || null
  }
}

// 스탬프 타입
export class Stamp {
  constructor(data = {}) {
    this.id = data.id || generateUUID()
    this.userId = data.userId || null
    this.projectId = data.projectId || null
    this.todoId = data.todoId || null
    this.date = data.date || new Date().toISOString().split('T')[0]
    this.createdAt = data.createdAt || new Date().toISOString()
  }
}

// 보상 타입
export class Reward {
  constructor(data = {}) {
    this.id = data.id || generateUUID()
    this.userId = data.userId || null
    this.projectId = data.projectId || null
    this.title = data.title || ''
    this.requiredStamps = data.requiredStamps ?? 5
    this.sortOrder = data.sortOrder ?? 0
    this.version = data.version ?? 0
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
    this.deletedAt = data.deletedAt || null
  }
}

// 교환 타입
export class Exchange {
  constructor(data = {}) {
    this.id = data.id || generateUUID()
    this.userId = data.userId || null
    this.projectId = data.projectId || null
    this.rewardId = data.rewardId || null
    this.stampCount = data.stampCount ?? 0
    this.date = data.date || new Date().toISOString().split('T')[0]
    this.createdAt = data.createdAt || new Date().toISOString()
  }
}

// UUID 생성 유틸리티
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

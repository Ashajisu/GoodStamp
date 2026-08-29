import { reactive, computed } from 'vue'

const DATA_VERSION = 2
const KEY = 'goodstamp-v1'

const seed = () => ({
    dataVersion: DATA_VERSION,
    profile: null,
    todos: [],
    stamps: [],
    rewards: [
        { id: 1, title: '코카콜라 한 잔', required: 5 },
        { id: 2, title: '카페에서 음료 한 잔', required: 10 },
        { id: 3, title: '영화 한 편 보기', required: 20 }
    ],
    exchanges: []
})

function migrateState(saved) {
    const version = saved.dataVersion || 1
    const migrated = {
        ...seed(),
        ...saved
    }
    if (version < 2) {
        migrated.dataVersion = 2
    }
    return migrated
}

let raw = localStorage.getItem(KEY)
const state = reactive(raw ? JSON.parse(raw) : seed())

function save() {
    localStorage.setItem(KEY, JSON.stringify(state))
}

function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function todayKey() {
    return formatDate(new Date())
}

const todayTodos = computed(() =>
    state.todos.filter(todo => todo.date === todayKey())
)

const stamps = computed(() => state.stamps.length)

/** 이번 주 월요일 */
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
    return state.stamps.filter(
        stamp => stamp.date >= startDate && stamp.date <= endDate
    )
})

function addTodo(data) {
    const todo = {
        id: Date.now(),
        date: todayKey(),
        title: data.title,
        repeat: data.repeat === 'daily' ? 'daily' : 'today',
        special: !!data.special,
        progressEnabled: !!data.progressEnabled,
        progress: 0,
        requiredProgress: data.progressEnabled ? (data.requiredProgress || 80) : 100,
        completed: false,
        stamped: false
    }

    state.todos.push(todo)
    save()
    return todo
}

function updateTodo(todoId, data) {
    const todo = state.todos.find(todo => todo.id === todoId)
    if (!todo) {return false}
    
    todo.title = data.title
    todo.repeat = data.repeat === 'daily' ? 'daily' : 'today'
    todo.special = !!data.special
    todo.progressEnabled = !!data.progressEnabled
    todo.requiredProgress = data.progressEnabled ? (data.requiredProgress || 80) : 100
    save()
    return todo
}

function deleteTodo(todo) {
    const index = state.todos.findIndex(item => item.id === todo.id)
    if (index === -1) {return false}
    state.todos.splice(index, 1)
    save()
    return true
}

function toggleTodo(todo) {
    todo.completed = !todo.completed
    if (todo.completed && todo.special && !todo.stamped) {
        state.stamps.push({id: Date.now(), todoId: todo.id, date: todayKey()})
        todo.stamped = true
    }
    save()
}

function updateProgress(todo, progress) {
    todo.progress = Math.max(0, Math.min(100, progress))
    if (todo.progress >= todo.requiredProgress && !todo.completed) {toggleTodo(todo)}
    save()
}

function addReward(title, required) {
    state.rewards.push({id: Date.now(), title, required})
    save()
}

function updateReward(rewardId, title, required) {
    const reward = state.rewards.find(reward => reward.id === rewardId)
    if (!reward) {return false}
    reward.title = title
    reward.required = required
    save()
    return true
}

function deleteReward(rewardId) {
    const index = state.rewards.findIndex(reward => reward.id === rewardId)
    if (index === -1) {return false}
    state.rewards.splice(index, 1)
    save()
    return true
}

function exchangeReward(reward) {
    if (state.stamps.length < reward.required) {return false}
    state.stamps.splice(0, reward.required)
    state.exchanges.push({id: Date.now(), rewardId: reward.id, title: reward.title, count: reward.required, date: todayKey()})
    save()
    return true
}

const usedStampCount = computed(() =>
    state.exchanges.reduce((total, exchange) => {
        return total + exchange.count
    }, 0)
)

const totalStampCount = computed(() =>
    state.stamps.length + usedStampCount.value
)

function cleanupOldTodos() {
    const limit = new Date()
    limit.setDate(limit.getDate() - 35)
    const limitKey = formatDate(limit)
    const oldLength = state.todos.length
    const validTodos = state.todos.filter(todo => todo.date >= limitKey)
    if (validTodos.length === oldLength) {return}
    state.todos.splice(0, state.todos.length, ...validTodos)
    save()
}

function createDailyTodosForToday() {
    const today = todayKey()
    if (state.todos.some(todo => todo.date === today && todo.repeat === 'daily')) {return}
    const dailyTodos = state.todos.filter(todo => todo.repeat === 'daily')
    if (!dailyTodos.length) {return}
    const latestDate = dailyTodos.reduce((latest, todo) => todo.date > latest ? todo.date : latest, '')
    const latestTodos = dailyTodos.filter(todo => todo.date === latestDate)
    latestTodos.forEach(todo => {
        state.todos.push({
            id: Date.now() + Math.floor(Math.random() * 1000), date: today, title: todo.title, type: todo.type, repeat: 'daily', special: todo.special,
            progressEnabled: todo.progressEnabled, progress: 0, requiredProgress: todo.requiredProgress, completed: false, stamped: false
        })
    })
    save()
}

function login(id, birth) {
    state.profile = { id, birth }
    save()
}

function logout() {
    state.profile = null
    save()
}

//초기화
cleanupOldTodos()
createDailyTodosForToday()

export {state,todayTodos,todayKey,stamps,login,logout,addTodo,updateTodo,deleteTodo,toggleTodo,updateProgress,addReward,updateReward,deleteReward,exchangeReward,save, weekStamps, usedStampCount, totalStampCount, getWeekMonday, cleanupOldTodos, migrateState}

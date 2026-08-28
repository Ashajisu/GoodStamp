<script setup>
import {ref, computed} from 'vue'
import {state, todayTodos, stamps, login, logout, addTodo, deleteTodo, toggleTodo, updateProgress} from './stores/useStore'
import BottomNav from './components/BottomNav.vue'
import TodoAddModal from './views/TodoAddModal.vue'
import TodoWeek from "./views/TodoWeek.vue";
import TodoReward from "./views/TodoReward.vue";

const tab = ref('today'), showAdd = ref(false), showStamp = ref(false), 
    loginId = ref(''), birth = ref('')
const logged = computed(() => !!state.profile)

function doLogin() {
  if (!loginId.value.trim() || !/^[0-9]{6}$/.test(birth.value)) return alert('아이디와 생년월일 6자리를 입력해주세요.');
  login(loginId.value.trim(), birth.value)
}

// v1 할일메뉴 및 삭제추가
const openTodoMenu = ref(null)

function toggleTodoMenu(id) {
  openTodoMenu.value = openTodoMenu.value === id ? null : id
}

function removeTodo(todo) {
  deleteTodo(todo)
  openTodoMenu.value = null
}

// v2 할일추가
function createTodo(todo) {
  const newTodo = {
    id: crypto.randomUUID(),
    title: todo.title,
    repeat: todo.repeat,
    // 스탬프 대상 여부
    special: todo.special,
    // 진행률 사용 여부
    progressEnabled: todo.progressEnabled,
    // 진행률 완료 기준
    requiredProgress: todo.requiredProgress,
    // 현재 진행률
    progress: 0,
    // 완료 여부
    completed: false,
    // 생성일
    createdAt: new Date().toISOString()
  }
  addTodo(newTodo);
  showAdd.value = false
}

function complete(t) {
  const before = t.completed;
  toggleTodo(t);
  if (!before && t.special) {
    showStamp.value = true;
    setTimeout(() => showStamp.value = false, 1200)
  }
}

function logoutNow() {
  logout();
  tab.value = 'today'
}
</script>
<template>
  <main class="app-shell">
    <section v-if="!logged" class="login-screen">
      <div class="brand"><span class="brand-mark">★</span>
        <h1>GoodStamp</h1>
        <p>오늘도 잘했어요!</p></div>
      <div class="login-card"><label>아이디</label><input v-model="loginId" placeholder="아이디를 입력하세요"/><label>생년월일</label><input v-model="birth" inputmode="numeric" maxlength="6" placeholder="YYMMDD"/>
        <button class="primary" @click="doLogin">시작하기</button>
      </div>
    </section>
    
    <template v-else>
      
      <header class="topbar">
        <div>
          <div class="eyebrow">GOOD STAMP</div>
          <h1>{{ tab === 'today' ? '오늘의 할일' : tab === 'weekly' ? '주간 리스트' : '보상 리스트' }}</h1></div>
        <button class="avatar" @click="logoutNow">{{ state.profile.id.slice(0, 1).toUpperCase() }}</button>
      </header>
      
      <section v-if="tab==='today'" class="page">
        <div class="hero-card">
          <div><p>오늘의 스탬프</p><strong>{{ stamps }}개</strong></div>
          <div class="stamp-mini">★</div>
        </div>
        <div class="section-title"><h2>오늘 할 일</h2><span>{{ todayTodos.filter(t => t.completed).length }} / {{ todayTodos.length }}</span></div>
        <!--        v1 할일 목록-->
        <div v-if="!todayTodos.length" class="empty">아직 오늘의 할 일이 없어요.<br/>작은 일부터 하나 추가해볼까요?</div>
        <div v-for="t in todayTodos" :key="t.id" class="todo-card" :class="{done:t.completed,special:t.special}">
          <button class="check" @click="complete(t)">{{ t.completed ? '✓' : '' }}</button>
          <div class="todo-main">
            <div class="todo-title-row">
              <div class="todo-title">{{ t.title }} <span v-if="t.special" class="special-tag">SPECIAL</span></div>
              <!-- v1 할일메뉴 및 삭제 -->
              <div class="todo-menu">
                <button type="button" class="more-button" @click.stop="toggleTodoMenu(t.id)">⋮</button>
                <div v-if="openTodoMenu === t.id" class="todo-menu-popup">
                  <button type="button" class="delete-button" @click.stop="removeTodo(t)">삭제</button>
                </div>
              </div>
            </div>
            <div v-if="t.progressEnabled" class="progress-wrap">
              <div class="progress"><i :style="{width:t.progress+'%'}"></i></div>
              <small>{{ t.progress }}% / {{ t.requiredProgress }}%</small>
              <input type="range" min="0" max="100" :value="t.progress" @input="updateProgress(t,+$event.target.value)"/>
            </div>
            <small v-else>{{ t.repeat === 'daily' ? '매일' : '오늘만' }}</small>
          </div>
        </div>
        <button class="add-button" @click="showAdd=true"><span>＋</span> 할 일 추가</button>
      </section>
<!--      v2 주간-->
      <TodoWeek v-else-if="tab==='weekly'" class="page"/>

<!--      v2 보상-->
      <TodoReward v-else class="page"/>

      <BottomNav :tab="tab" @change="tab=$event"/>
    </template>

    <!--    v2 할 일 추가-->
    <TodoAddModal v-if="showAdd" @close="showAdd = false" @submit="createTodo"/>
    
    <div v-if="showStamp" class="stamp-overlay">
      <div class="stamp-pop">참 잘했어요!</div>
    </div>
  </main>
</template>

<script setup>
import {ref, computed} from 'vue'
import {state, todayTodos, stamps, login, logout, addTodo, deleteTodo, toggleTodo, updateProgress, addReward, exchangeReward} from './stores/useStore'
import BottomNav from './components/BottomNav.vue'
import TodoAddModal from './views/TodoAddModal.vue'
import TodoWeek from "./views/TodoWeek.vue";

const tab = ref('today'), showAdd = ref(false), showReward = ref(false), showStamp = ref(false), showBirth = ref(false), 
    selectedReward = ref(null), loginId = ref(''), birth = ref(''),
    rewardForm = ref({title: '', required: 5})
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

function verify() {
  if (!selectedReward.value) return;
  if (birth.value === state.profile.birth) {
    if (exchangeReward(selectedReward.value)) {
      showBirth.value = false;
      selectedReward.value = null;
      alert('보상을 교환했어요!')
    }
  } else alert('생년월일이 일치하지 않아요.')
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

<!--      보상-->
      <section v-else class="page">
        <div class="reward-balance">
          <div><small>현재 보유</small><strong>{{ stamps }}</strong><span>STAMP</span></div>
          <div class="big-stamp">★</div>
        </div>
        <div class="section-title"><h2>나의 보상</h2>
          <button class="text-btn" @click="showReward=true">+ 추가</button>
        </div>
        <div v-for="r in state.rewards" :key="r.id" class="reward-card">
          <div class="reward-icon">🎁</div>
          <div class="reward-main"><strong>{{ r.title }}</strong><small>{{ r.required }} 스탬프 필요</small></div>
          <button class="exchange" :disabled="stamps<r.required" @click="selectedReward=r;showBirth=true">교환</button>
        </div>
        <div v-if="state.exchanges.length" class="history"><h3>교환 기록</h3>
          <p v-for="e in [...state.exchanges].reverse()" :key="e.id">{{ e.date }} · {{ e.title }} · -{{ e.count }}개</p></div>
      </section>
      <BottomNav :tab="tab" @change="tab=$event"/>
    </template>

    <!--    v2 할 일 추가-->
    <TodoAddModal v-if="showAdd" @close="showAdd = false" @submit="createTodo"
    />
    <div v-if="showReward" class="modal-backdrop" @click.self="showReward=false">
      <div class="modal"><h2>보상 추가</h2><input v-model="rewardForm.title" placeholder="보상 이름"/><input v-model.number="rewardForm.required" type="number" min="1" placeholder="필요 스탬프"/>
        <button class="primary" @click="addReward(rewardForm.title,rewardForm.required);showReward=false;rewardForm={title:'',required:5}">추가하기</button>
      </div>
    </div>
    
    <div v-if="showBirth" class="modal-backdrop">
      <div class="modal center">
        <div class="stamp-icon">★</div>
        <h2>생년월일 확인</h2>
        <p>보상을 교환하려면 생년월일을 입력해주세요.</p><input v-model="birth" inputmode="numeric" maxlength="6" placeholder="YYMMDD"/>
        <button class="primary" @click="verify">교환하기</button>
        <button class="cancel" @click="showBirth=false">취소</button>
      </div>
    </div>
    
    <div v-if="showStamp" class="stamp-overlay">
      <div class="stamp-pop">참 잘했어요!</div>
    </div>
  </main>
</template>

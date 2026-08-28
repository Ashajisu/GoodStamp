<script setup>
import {computed, ref} from 'vue'
import {state, weekStamps, getWeekMonday} from '../stores/useStore.js'
const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일']

/*
 * 스탬프 이미지 public/stamps/
 */
const stampImages = [
  'stamps/stamp-1.png'
]

/* 현재 스탬프 카드 페이지 */
const stampPage = ref(0)

/* =========================
   날짜
   ========================= */
function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function todayKey() {
  return formatDate(new Date())
}

/**
 * 이번 주 월요일 ~ 일요일
 */
const weekDays = computed(() => {
  const today = new Date()
  const monday = getWeekMonday(today)

  return Array.from({length: 7}, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    const key = formatDate(date)
    return {key, name: DAY_NAMES[index], date, isToday: key === todayKey()}
  })
})

function todosForDate(dateKey) {
    return state.todos.filter(todo => todo.date === dateKey)
}

function completedCount(dateKey) {
  return todosForDate(dateKey).filter(todo => todo.completed).length
}

function completionRate(dateKey) {
  const todos = todosForDate(dateKey)
  if (!todos.length) {return 0}
  return Math.round(
      completedCount(dateKey) / todos.length * 100
  )
}

const stampPageCount = computed(() =>
    Math.max(1, Math.ceil(weekStamps.value.length / 9))
)

const currentStampPage = computed(() => {
  const start = stampPage.value * 9
  return weekStamps.value.slice(start, start + 9)
})

function prevStampPage() {
  if (stampPage.value > 0) {stampPage.value--}
}

function nextStampPage() {
  if (stampPage.value < stampPageCount.value - 1) {stampPage.value++}
}

function stampDate(dateKey) {
  const [, month, day] = dateKey.split('-')

  return `${Number(month)}.${Number(day)}`
}

function stampImage(index) {
  return `${import.meta.env.BASE_URL}${stampImages[index % stampImages.length]}`
}
</script>


<template>
  <section class="page week-page">
    <!-- ========================= Reward Stamp Card ========================= -->
    <section class="stamp-card-section">
      <div class="section-title">
        <div>
          <h2>Reward Stamp Card</h2>
          <p>This Week</p>
        </div>
        <div class="stamp-total"><span>★</span><strong>{{ state.stamps.length }}</strong></div>
      </div>
      
      <div class="stamp-card">
        <button v-if="stampPageCount > 1" type="button" class="stamp-nav prev" :disabled="stampPage === 0" @click="prevStampPage">‹</button>
        <div class="stamp-grid">
          <div v-for="index in 9" :key="index" class="stamp-slot">
            <!-- 실제 스탬프 -->
            <template v-if="currentStampPage[index - 1]">
              <img :src="stampImage(stampPage * 9 + index - 1)" alt="획득한 스탬프" class="stamp-image"/>
              <span class="stamp-date">{{stampDate(currentStampPage[index - 1].date) }}</span>
            </template>
            <!-- 빈 슬롯 -->
            <div v-else class="empty-stamp"><span>✦</span></div>
          </div>
        </div>
        <button v-if="stampPageCount > 1" type="button" class="stamp-nav next" :disabled="stampPage === stampPageCount - 1" @click="nextStampPage">›</button>
      </div>
      
      <!-- 페이지 인디케이터 -->
      <div v-if="stampPageCount > 1" class="stamp-pages">
        <button v-for="page in stampPageCount" :key="page" type="button" :class="{ active: stampPage === page - 1 }" @click="stampPage = page - 1"/>
      </div>
    </section>
    
    <!-- ========================= This Week ========================= -->
    <section class="week-section">
      <div class="week-section-header">
        <div>
          <h2>This Week</h2>
          <p>이번 주 달성 기록</p>
        </div>
      </div>

      <!-- 가로 스크롤 -->
      <div class="week-scroll">
        <div v-for="day in weekDays" :key="day.key" class="day-card" 
             :class="{today: day.isToday,completed: completionRate(day.key) === 100}">
          <div class="day-name">{{ day.name }}</div>
          <div class="day-date">{{ day.date.getMonth() + 1 }}.{{ day.date.getDate() }}</div>
          <div class="day-progress">
            <div class="progress-circle"
                :style="{'--progress':completionRate(day.key) + '%'}">
              <span>{{ completionRate(day.key) }}%</span>
            </div>
          </div>
          <div class="day-count">{{ completedCount(day.key) }} / {{ todosForDate(day.key).length }}</div>
          <div v-if="state.stamps.some(stamp => stamp.date === day.key)" class="day-stamp"> ★ </div>
        </div>
      </div>
    </section>

  </section>
</template>

<style scoped>
@import '../styles/todoWeek.css';
</style>
<script setup>
import { reactive } from 'vue'

const emit = defineEmits(['close', 'submit'])

const props = defineProps({
    todo: {
        type: Object,
        default: null
    }
})
const addForm = reactive({
    title: props.todo?.title ?? '',
    repeat: props.todo?.repeat ?? 'today',
    special: props.todo?.special ?? false,
    progressEnabled: props.todo?.progressEnabled ?? false,
    requiredProgress: props.todo?.requiredProgress ?? 80
})

function toggleProgress() {
  addForm.progressEnabled = !addForm.progressEnabled

  if (addForm.progressEnabled && !addForm.requiredProgress) {
    addForm.requiredProgress = 80
  }
}

function submit() {
  const title = addForm.title.trim()
  if (!title) {
    return
  }

  emit('submit', {
    title,
    repeat: addForm.repeat,
    special: addForm.special,
    progressEnabled: addForm.progressEnabled,
    requiredProgress: addForm.progressEnabled
        ? addForm.requiredProgress
        : 100
  })
}

function close() {
  emit('close')
}
</script>

<template>
  <div
      class="modal-backdrop"
      @click.self="close"
  >
    <div class="modal todo-modal">

      <!-- 헤더 -->
      <div class="modal-header">
        <div>
          <h2>할 일 추가</h2>
          <p>오늘 할 일을 하나 추가해볼까요?</p>
        </div>

        <button
            type="button"
            class="close-button"
            @click="close"
        >
          ×
        </button>
      </div>

      <!-- 할 일 입력 -->
      <div class="form-section">
        <label class="form-label">
          무엇을 할까요?
        </label>

        <input
            v-model="addForm.title"
            class="todo-input"
            type="text"
            maxlength="100"
            placeholder="예: 물 2L 마시기"
            @keyup.enter="submit"
        />
      </div>

      <!-- 반복 -->
      <div class="form-section">
        <label class="form-label">
          언제 할까요?
        </label>

        <div class="choice-row">

          <button
              type="button"
              class="choice-button"
              :class="{
              selected: addForm.repeat === 'today'
            }"
              @click="addForm.repeat = 'today'"
          >
            <strong>오늘만</strong>
            <small>이번 한 번만</small>
          </button>

          <button
              type="button"
              class="choice-button"
              :class="{
              selected: addForm.repeat === 'daily'
            }"
              @click="addForm.repeat = 'daily'"
          >
            <strong>매일</strong>
            <small>매일 반복</small>
          </button>

        </div>
      </div>

      <!-- 스탬프 -->
      <div class="form-section">
        <label class="form-label">
          보상
        </label>

        <button
            type="button"
            class="option-card"
            :class="{
            selected: addForm.special
          }"
            @click="addForm.special = !addForm.special"
        >
          <span class="option-icon">
            ★
          </span>

          <span class="option-content">
            <strong>스탬프 받을 수 있는 할 일</strong>

            <small>
              완료하면 보상용 스탬프를 획득해요
            </small>
          </span>

          <span class="option-check">
            {{ addForm.special ? '✓' : '' }}
          </span>
        </button>
      </div>

      <!-- 진행률 -->
      <div class="form-section">
        <label class="form-label">
          완료 방식
        </label>

        <button
            type="button"
            class="option-card"
            :class="{
            selected: addForm.progressEnabled
          }"
            @click="toggleProgress"
        >
          <span class="option-icon">
            ◔
          </span>

          <span class="option-content">
            <strong>진행률로 완료하기</strong>

            <small>
              {{
                addForm.progressEnabled
                    ? `${addForm.requiredProgress}% 이상이면 완료`
                    : '체크 한 번으로 완료'
              }}
            </small>
          </span>

          <span class="option-check">
            {{ addForm.progressEnabled ? '✓' : '' }}
          </span>
        </button>

        <!-- 진행률 상세 -->
        <div
            v-if="addForm.progressEnabled"
            class="progress-setting"
        >
          <div class="progress-header">
            <span>완료 기준</span>

            <strong>
              {{ addForm.requiredProgress }}%
            </strong>
          </div>

          <input
              v-model.number="addForm.requiredProgress"
              class="progress-range"
              type="range"
              min="1"
              max="100"
              step="1"
          />

          <div class="range-labels">
            <span>1%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <!-- 버튼 -->
      <div class="modal-actions">

        <button
            type="button"
            class="secondary-button"
            @click="close"
        >
          취소
        </button>

        <button
            type="button"
            class="primary-button"
            :disabled="!addForm.title.trim()"
            @click="submit"
        >
          추가하기
        </button>

      </div>

    </div>
  </div>
</template>
<style scoped>
@import '../styles/todoAdd.css';
</style>

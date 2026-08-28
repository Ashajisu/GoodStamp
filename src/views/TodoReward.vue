<script setup>
import {ref} from 'vue'
import {addReward, updateReward, deleteReward, exchangeReward, stamps, state, usedStampCount, totalStampCount} from '../stores/useStore.js'

const showReward = ref(false), showBirth = ref(false), birth = ref(''),
    selectedReward = ref(null), editingReward = ref(null), openMenu = ref(null), 
    rewardForm = ref({title: '', required: 5})

function openAddReward() {
  editingReward.value = null
  rewardForm.value = {title: '', required: 5}
  openMenu.value = null
  showReward.value = true
}

function openEditReward(reward) {
  editingReward.value = reward
  rewardForm.value = {
    title: reward.title,
    required: reward.required
  }
  openMenu.value = null
  showReward.value = true
}

function saveReward() {
  if (!rewardForm.value.title.trim()) {
    alert('보상 이름을 입력해주세요.')
    return
  }
  if (!rewardForm.value.required || rewardForm.value.required < 1) {
    alert('필요 스탬프는 1개 이상 입력해주세요.')
    return
  }
  if (editingReward.value) {
    updateReward(
        editingReward.value.id,
        rewardForm.value.title.trim(),
        rewardForm.value.required
    )
  } else {
    addReward(
        rewardForm.value.title.trim(),
        rewardForm.value.required
    )
  }
  showReward.value = false
  editingReward.value = null
  rewardForm.value = {title: '', required: 5}
}

function removeReward(reward) {
  openMenu.value = null
  if (!confirm(`'${reward.title}' 보상을 삭제할까요?`)) {return}
  deleteReward(reward.id)
}

function verify() {
  if (!selectedReward.value) return;
  if (birth.value === state.profile.birth) {
    if (exchangeReward(selectedReward.value)) {
      showBirth.value = false
      selectedReward.value = null
      birth.value = ''
      alert('보상을 교환했어요!')
    }
  } else alert('생년월일이 일치하지 않아요.')
}
</script>

<template>
  <section class="reward-page">
    <div class="reward-balance">
      <div><small>현재 보유</small><strong>{{ stamps }}</strong><span>STAMP</span></div>
      <div class="big-stamp">★</div>
    </div>
    <div class="section-title">
      <h2>나의 보상</h2>
      <button class="text-btn" @click="openAddReward()">+ 추가</button>
    </div>
    <div v-for="r in state.rewards" :key="r.id" class="reward-card">
      <div class="reward-icon">🎁</div>
      <div class="reward-main"><strong>{{ r.title }}</strong><small>{{ r.required }} 스탬프 필요</small></div>
      <button type="button" class="more-button" @click.stop="openMenu = openMenu === r.id ? null : r.id">⋮</button>
      <div v-if="openMenu === r.id" class="reward-menu" @click.stop>
        <button type="button" @click="openEditReward(r)">수정</button>
        <button type="button" class="delete" @click="removeReward(r)">삭제</button>
      </div>
      <button class="exchange" :disabled="stamps<r.required" @click="selectedReward=r;showBirth=true">교환</button>
    </div>
    
    <div class="history">
      <h3>스탬프 요약</h3>
      <div class="history-total">
        <div class="history-card">
          <div color="brown">⊕</div>
          <h3>누적 스탬프</h3>
          <strong color="brown">{{ totalStampCount }}</strong>
        </div>
        <div class="history-card">
          <div color="khaki">⊖</div>
          <h3>사용한 스탬프</h3>
          <strong color="khaki">{{ usedStampCount  }}</strong>
        </div>
      </div>
    </div>
    
    <div v-if="state.exchanges.length" class="history">
      <h3>교환 기록</h3>
      <p v-for="e in [...state.exchanges].reverse()" :key="e.id">{{ e.date }} · {{ e.title }} · -{{ e.count }}개</p>
    </div>
  
    <div v-if="showReward" class="modal-backdrop" @click.self="showReward=false">
      <div class="modal">
        <h2>{{ editingReward ? '보상 수정' : '보상 추가' }}</h2>
        <input v-model="rewardForm.title" placeholder="보상 이름"/>
        <input v-model.number="rewardForm.required" type="number" min="1" placeholder="필요 스탬프"/>
        <button class="primary" @click="saveReward">{{ editingReward ? '수정하기' : '추가하기' }}</button>
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
  </section>
</template>

<style scoped>
@import '../styles/todoReward.css';
</style>
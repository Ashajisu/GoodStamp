<script setup>
import { ref } from 'vue'
import TodoAddModal from './TodoAddModal.vue'
import { stamps, todayTodos, addTodo, updateTodo, deleteTodo, toggleTodo, updateProgress } from '../stores/useStore.js'

const openTodoMenu = ref(null), showStamp = ref(false),
    showAdd = ref(false), showEdit = ref(false), editingTodo = ref(null)

function toggleTodoMenu(todoId) {
    openTodoMenu.value = openTodoMenu.value === todoId ? null : todoId
}

function removeTodo(todo) {
    openTodoMenu.value = null
    deleteTodo(todo)
}

function openEdit(todo) {
    openTodoMenu.value = null
    editingTodo.value = todo
    showEdit.value = true
}

function closeEdit() {
    showEdit.value = false
    editingTodo.value = null
}

function createTodo(data) {
    addTodo(data)
    showAdd.value = false
}

function editTodo(data) {
    updateTodo(editingTodo.value.id, data)
    closeEdit()
}

function complete(t) {
    const before = t.completed;
    toggleTodo(t);
    if (!before && t.special) {
        showStamp.value = true;
        setTimeout(() => showStamp.value = false, 1200)
    }
}
</script>

<template>
    <section class="page">
        <div class="hero-card">
            <div><p>오늘의 스탬프</p><strong>{{ stamps }}개</strong></div>
            <div class="stamp-mini">★</div>
        </div>

        <div class="section-title"><h2>오늘 할 일</h2><span>{{ todayTodos.filter(t => t.completed).length }} / {{ todayTodos.length }}</span></div>

        <div v-if="!todayTodos.length" class="empty">아직 오늘의 할 일이 없어요.<br />작은 일부터 하나 추가해볼까요?</div>

        <div v-for="t in todayTodos" :key="t.id" class="todo-card" :class="{ done: t.completed, special: t.special }">
            <button class="check" @click="complete(t)">{{ t.completed ? '✓' : '' }}</button>

            <div class="todo-main">
                <div class="todo-title-row">
                    <div class="todo-title">{{ t.title }} <span v-if="t.special" class="special-tag">SPECIAL</span></div>

                    <div class="todo-menu">
                        <button type="button" class="more-button" @click.stop="toggleTodoMenu(t.id)">⋮</button>

                        <div v-if="openTodoMenu === t.id" class="todo-menu-popup">
                            <button type="button" @click.stop="openEdit(t)">수정</button>
                            <button type="button" class="delete-button" @click.stop="removeTodo(t)">삭제</button>
                        </div>
                    </div>
                </div>

                <div v-if="t.progressEnabled" class="progress-wrap">
                    <div class="progress"><i :style="{ width: t.progress + '%' }"></i></div>
                    <small>{{ t.progress }}% / {{ t.requiredProgress }}%</small>
                    <input type="range" min="0" max="100" :value="t.progress" @input="updateProgress(t, +$event.target.value)" />
                </div>

                <small v-else>{{ t.repeat === 'daily' ? '매일' : '오늘만' }}</small>
            </div>
        </div>

        <button class="add-button" @click="showAdd = true"><span>＋</span> 할 일 추가</button>

        <TodoAddModal v-if="showAdd" @close="showAdd = false" @submit="createTodo" />
        <TodoAddModal v-if="showEdit" :todo="editingTodo" @close="closeEdit" @submit="editTodo" />

        <div v-if="showStamp" class="stamp-overlay">
            <div class="stamp-pop">참 잘했어요!</div>
        </div>
    </section>
</template>
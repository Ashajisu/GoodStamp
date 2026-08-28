<script setup>
import {ref, computed} from 'vue'
import {state, login, logout} from './stores/useStore'
import BottomNav from './components/BottomNav.vue'
import TodoWeek from "./views/TodoWeek.vue";
import TodoReward from "./views/TodoReward.vue";
import TodoToday from "./views/TodoToday.vue";

const VERSION = '2.2'
const tab = ref('today'), loginId = ref(''), birth = ref('')
const logged = computed(() => !!state.profile)

function doLogin() {
    if (!loginId.value.trim() || !/^[0-9]{6}$/.test(birth.value)) return alert('아이디와 생년월일 6자리를 입력해주세요.');
    login(loginId.value.trim(), birth.value)
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
            <div class="login-footer"><span>version.{{ VERSION }}</span><span>·</span><span>dev. Asha</span></div>
        </section>

        <template v-else>

            <header class="topbar">
                <div>
                    <div class="eyebrow">GOOD STAMP</div>
                    <h1>{{ tab === 'today' ? '오늘의 할일' : tab === 'weekly' ? '주간 리스트' : '보상 리스트' }}</h1></div>
                <button class="avatar" @click="logoutNow">{{ state.profile.id.slice(0, 1).toUpperCase() }}</button>
            </header>

            <!--      v2 오늘 화면-->
            <TodoToday v-if="tab==='today'" class="page"/>

            <!--      v2 주간-->
            <TodoWeek v-else-if="tab==='weekly'" class="page"/>

            <!--      v2 보상-->
            <TodoReward v-else class="page"/>

            <BottomNav :tab="tab" @change="tab=$event"/>
        </template>
    </main>
</template>

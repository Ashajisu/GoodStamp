import { reactive, computed } from 'vue'
const KEY='goodstamp-v1'
const seed=()=>({profile:null,todos:[],stamps:[],rewards:[{id:1,title:'좋아하는 카페에서 음료 한 잔',required:5},{id:2,title:'맛있는 디저트 먹기',required:10},{id:3,title:'영화 한 편 보기',required:20}],exchanges:[]})
let raw=localStorage.getItem(KEY); const state=reactive(raw?JSON.parse(raw):seed())
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
const todayTodos=computed(()=>state.todos.filter(t=>t.date===todayKey() || (t.repeat==='daily' && new Date(t.date)<=new Date())))
const stamps=computed(()=>state.stamps.length)
function login(id,birth){state.profile={id,birth};save()}
function logout(){state.profile=null;save()}
function deleteTodo(data) {
    const index = state.todos.findIndex(t => t.id === data.id)
    if (index === -1) return false
    state.todos.splice(index, 1)
    save()
    return true
}
function addTodo(data){
    state.todos.push({id:Date.now(),date:todayKey(),title:data.title,type:data.type||'today',repeat:data.repeat||'none',special:!!data.special,progressEnabled:!!data.progressEnabled,progress:0,requiredProgress:data.requiredProgress||100,completed:false});
    save()
}
function toggleTodo(todo){todo.completed=!todo.completed;if(todo.completed&&todo.special&&!todo.stamped){state.stamps.push({id:Date.now(),todoId:todo.id,date:todayKey()});todo.stamped=true}save()}
function updateProgress(todo,p){todo.progress=Math.max(0,Math.min(100,p)); if(todo.progress>=todo.requiredProgress&&!todo.completed) toggleTodo(todo); save()}
function addReward(title,required){state.rewards.push({id:Date.now(),title,required});save()}
function exchangeReward(reward){if(state.stamps.length<reward.required)return false;state.stamps.splice(0,reward.required);state.exchanges.push({id:Date.now(),rewardId:reward.id,title:reward.title,count:reward.required,date:todayKey()});save();return true}
export {state,todayTodos,todayKey,stamps,login,logout,addTodo,deleteTodo,toggleTodo,updateProgress,addReward,exchangeReward,save}

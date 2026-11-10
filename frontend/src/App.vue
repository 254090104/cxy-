<template>
  <div class="container">
    <h2>宿管通排班系统</h2>
    <div>
      <h3>成员管理</h3>
      <input v-model="name" placeholder="姓名"/>
      <input v-model="room" placeholder="宿舍号"/>
      <button @click="addMember">添加成员</button>
    </div>
    <div>
      <h3>自动排班</h3>
      <input v-model="startDate" type="date"/>
      <input v-model="dayNum" type="number" placeholder="排班天数"/>
      <button @click="autoSchedule">生成排班</button>
    </div>
    <div>
      <h3>排班列表</h3>
      <table border="1">
        <tr><th>日期</th><th>人员</th><th>状态</th><th>操作</th></tr>
        <tr v-for="item in scheduleList" :key="item.id">
          <td>{{item.work_date}}</td>
          <td>{{item.name}}</td>
          <td>{{item.status}}</td>
          <td>
            <button @click="changeStatus(item.id,'已完成')">完成</button>
            <button @click="changeStatus(item.id,'缺勤')">缺勤</button>
          </td>
        </tr>
      </table>
    </div>
    <div>
      <h3>统计</h3>
      <table border="1">
        <tr><th>姓名</th><th>完成次数</th><th>缺勤次数</th></tr>
        <tr v-for="s in statList" :key="s.name">
          <td>{{s.name}}</td>
          <td>{{s.finish}}</td>
          <td>{{s.absent}}</td>
        </tr>
      </table>
    </div>
  </div>
</template>
<script setup>
import {ref,onMounted} from 'vue'
import axios from 'axios'
const name = ref('')
const room = ref('')
const startDate = ref('')
const dayNum = ref(7)
const memberList = ref([])
const scheduleList = ref([])
const statList = ref([])
const api = axios.create({baseURL:'http://localhost:3000/api'})

const loadMember = async ()=>{
  const res = await api.get('/member')
  memberList.value = res.data
}
const addMember = async ()=>{
  await api.post('/member',{name:name.value,room:room.value})
  name.value=''
  room.value=''
  loadMember()
}
const autoSchedule = async ()=>{
  const ids = memberList.value.map(i=>i.id)
  await api.post('/schedule/auto',{startDate:startDate.value,days:Number(dayNum.value),memberList:ids})
  loadSchedule()
}
const loadSchedule = async ()=>{
  const res = await api.get('/schedule')
  scheduleList.value = res.data
}
const changeStatus = async (id,st)=>{
  await api.put(`/schedule/${id}`,{status:st})
  loadSchedule()
  loadStat()
}
const loadStat = async ()=>{
  const res = await api.get('/stat')
  statList.value = res.data
}
onMounted(()=>{
  loadMember()
  loadSchedule()
  loadStat()
})
</script>
<style>
.container{width:900px;margin:20px auto;}
table{margin:10px 0;border-collapse:collapse;}
button{margin:2px;}
input{margin:4px;}
</style>

<template>
  <div class="container">
    <h1>宿舍卫生值日管理系统</h1>
    
    <div class="section">
      <h3>选择宿舍</h3>
      <select v-model="selectedDormId" @change="loadMember">
        <option value="" disabled>请选择宿舍</option>
        <option v-for="item in dormList" :key="item.id" :value="item.id">
          {{ item.name }}
        </option>
      </select>
    </div>

    <div class="section">
      <h3>成员管理</h3>
      <div class="row">
        <input v-model="addName" placeholder="输入成员姓名" />
        <button @click="addMember" :disabled="!selectedDormId">添加成员</button>
      </div>
      <div class="member-list">
        <div v-for="m in memberList" :key="m.id" class="member-item">
          <span v-if="editId !== m.id">{{ m.name }}</span>
          <input v-else v-model="editName" />
          <div class="btn-group">
            <button v-if="editId !== m.id" @click="startEdit(m)">编辑</button>
            <button v-else @click="saveEdit(m.id)">保存</button>
            <button class="danger" @click="deleteMember(m.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>AI智能排班</h3>
      <div class="row">
        <input v-model="startDate" type="date" />
        <input v-model="dayNum" type="number" placeholder="排班天数" />
      </div>
      <div class="row">
        <label>
          <input v-model="skipWeekend" type="checkbox" />
          AI优化：跳过周末
        </label>
        <button @click="genSchedule" :disabled="!selectedDormId">生成排班</button>
      </div>
    </div>

    <div class="section">
      <h3>排班列表</h3>
      <table border="1">
        <thead>
          <tr>
            <th>日期</th>
            <th>值日人员</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in scheduleList" :key="s.id">
            <td>{{ new Date(s.sdate).toLocaleDateString() }}</td>
            <td>{{ s.name }}</td>
            <td :class="s.status === '已完成' ? 'done' : ''">{{ s.status }}</td>
            <td class="op-col">
              <button v-if="s.status === '未完成'" @click="toggleStatus(s.id, '已完成')">
                标记完成
              </button>
              <button v-else @click="toggleStatus(s.id, '未完成')">
                重置
              </button>
              <button @click="genRemind(s.id)">AI提醒</button>
              <button class="danger" @click="deleteSchedule(s.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- AI提醒弹窗 -->
    <div v-if="remindText" class="modal" @click="remindText = ''">
      <div class="modal-content" @click.stop>
        <h4>AI生成值日提醒</h4>
        <p>{{ remindText }}</p >
        <button @click="remindText = ''">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const baseUrl = 'http://localhost:3000'

const dormList = ref([])
const selectedDormId = ref('')
const memberList = ref([])
const addName = ref('')
const editId = ref('')
const editName = ref('')
const startDate = ref('')
const dayNum = ref(7)
const skipWeekend = ref(true)
const scheduleList = ref([])
const remindText = ref('')

// 加载宿舍
const loadDorm = async () => {
  const res = await fetch(baseUrl + '/dorm')
  dormList.value = await res.json()
}

// 加载成员
const loadMember = async () => {
  if (!selectedDormId.value) return
  const res = await fetch(baseUrl + '/member/' + selectedDormId.value)
  memberList.value = await res.json()
  loadSchedule()
}

// 添加成员
const addMember = async () => {
  if (!addName.value.trim()) return
  await fetch(baseUrl + '/member', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dorm_id: selectedDormId.value, name: addName.value.trim() })
  })
  addName.value = ''
  loadMember()
}

// 开始编辑
const startEdit = (m) => {
  editId.value = m.id
  editName.value = m.name
}

// 保存编辑
const saveEdit = async (id) => {
  if (!editName.value.trim()) return
  await fetch(baseUrl + '/member/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: editName.value.trim() })
  })
  editId.value = ''
  loadMember()
}

// 删除成员
const deleteMember = async (id) => {
  if (!confirm('确定删除该成员？关联值日记录也会同步删除')) return
  await fetch(baseUrl + '/member/' + id, { method: 'DELETE' })
  loadMember()
}

// 生成排班
const genSchedule = async () => {
  if (!startDate.value || !dayNum.value) return
  await fetch(baseUrl + '/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dorm_id: selectedDormId.value,
      start_date: startDate.value,
      days: Number(dayNum.value),
      skip_weekend: skipWeekend.value
    })
  })
  loadSchedule()
}

// 切换值日状态
const toggleStatus = async (id, status) => {
  await fetch(baseUrl + '/schedule/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
  loadSchedule()
}

// 删除排班
const deleteSchedule = async (id) => {
  if (!confirm('确定删除这条值日记录？')) return
  await fetch(baseUrl + '/schedule/' + id, { method: 'DELETE' })
  loadSchedule()
}

// AI生成提醒
const genRemind = async (id) => {
  const res = await fetch(baseUrl + '/remind/' + id)
  const data = await res.json()
  remindText.value = data.text
}

// 加载排班
const loadSchedule = async () => {
  if (!selectedDormId.value) return
  const res = await fetch(baseUrl + '/schedule/' + selectedDormId.value)
  scheduleList.value = await res.json()
}

onMounted(() => {
  loadDorm()
})
</script>

<style scoped>
.container {
  width: 720px;
  margin: 30px auto;
  font-family: "Microsoft Yahei", sans-serif;
}
.section {
  margin: 20px 0;
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
}
h3 {
  margin-top: 0;
  color: #333;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 0;
}
input, select {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #409eff;
  color: white;
  cursor: pointer;
}
button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
button.danger {
  background: #f56c6c;
}
.member-list {
  margin-top: 10px;
}
.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}
.btn-group {
  display: flex;
  gap: 6px;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
th, td {
  padding: 8px;
  text-align: center;
  border: 1px solid #eee;
}
.done {
  color: #67c23a;
  font-weight: bold;
}
.op-col {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
}
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 400px;
}
</style>

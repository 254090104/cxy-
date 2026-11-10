const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({
  user: 'postgres',
  password: '你自己的pg密码',
  host: 'localhost',
  port: 5432,
  database: 'dorm'
})

// 获取全部成员
app.get('/api/member', async (req, res) => {
  const ret = await pool.query('SELECT * FROM member ORDER BY id')
  res.json(ret.rows)
})
// 添加成员
app.post('/api/member', async (req, res) => {
  const {name,room} = req.body
  const ret = await pool.query('INSERT INTO member(name,room) VALUES($1,$2) RETURNING *',[name,room])
  res.json(ret.rows[0])
})
// 自动排班
app.post('/api/schedule/auto', async (req,res)=>{
  const {startDate,days,memberList} = req.body
  let list = []
  for(let i=0;i<days;i++){
    const mid = memberList[i % memberList.length]
    const d = new Date(startDate)
    d.setDate(d.getDate()+i)
    list.push({member_id:mid,work_date:d.toISOString().slice(0,10)})
  }
  for(let item of list){
    await pool.query('INSERT INTO schedule(member_id,work_date) VALUES($1,$2) ON CONFLICT DO NOTHING',[item.member_id,item.work_date])
  }
  res.json({msg:"排班成功"})
})
// 获取排班
app.get('/api/schedule',async (req,res)=>{
  const ret = await pool.query(`SELECT s.*,m.name FROM schedule s JOIN member m ON s.member_id=m.id ORDER BY work_date`)
  res.json(ret.rows)
})
// 标记打扫完成/缺勤
app.put('/api/schedule/:id',async (req,res)=>{
  const {status} = req.body
  await pool.query('UPDATE schedule SET status=$1 WHERE id=$2',[status,req.params.id])
  res.json({msg:"更新成功"})
})
// 换班申请
app.post('/api/change',async (req,res)=>{
  const {from_id,to_id,work_date} = req.body
  const ret = await pool.query('INSERT INTO change_apply(from_id,to_id,work_date) VALUES($1,$2,$3) RETURNING *',[from_id,to_id,work_date])
  res.json(ret.rows[0])
})
// 统计
app.get('/api/stat',async (req,res)=>{
  const ret = await pool.query(`
    SELECT m.name,
    COUNT(CASE WHEN s.status='已完成' THEN 1 END) finish,
    COUNT(CASE WHEN s.status='缺勤' THEN 1 END) absent
    FROM member m LEFT JOIN schedule s ON m.id=s.member_id
    GROUP BY m.id,m.name
  `)
  res.json(ret.rows)
})

app.listen(3000,()=>{
  console.log("后端启动：http://localhost:3000")
})
// 新增：统计接口优化

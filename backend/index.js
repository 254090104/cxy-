const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json())

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dorm_schedule',
  password: '123456',
  port: 5432
})

// 获取宿舍列表
app.get('/dorm', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM new_dorm ORDER BY id')
    res.json(r.rows)
  } catch (e) {
    console.log(e)
    res.status(500).json([])
  }
})

// 获取宿舍成员
app.get('/member/:dormId', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM new_member WHERE dorm_id = $1 ORDER BY id', [req.params.dormId])
    res.json(r.rows)
  } catch (e) {
    res.status(500).json([])
  }
})

// 添加成员
app.post('/member', async (req, res) => {
  const { dorm_id, name } = req.body
  try {
    await pool.query('INSERT INTO new_member(dorm_id, name) VALUES($1,$2)', [dorm_id, name])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false })
  }
})

// 编辑成员姓名
app.put('/member/:id', async (req, res) => {
  const { name } = req.body
  try {
    await pool.query('UPDATE new_member SET name=$1 WHERE id=$2', [name, req.params.id])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false })
  }
})

// 删除成员（同步删除关联排班）
app.delete('/member/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM new_schedule WHERE member_id = $1', [req.params.id])
    await pool.query('DELETE FROM new_member WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false })
  }
})

// AI智能生成排班
app.post('/schedule', async (req, res) => {
  const { dorm_id, start_date, days, skip_weekend } = req.body
  try {
    await pool.query('DELETE FROM new_schedule WHERE dorm_id=$1', [dorm_id])
    const members = await pool.query('SELECT id, name FROM new_member WHERE dorm_id=$1 ORDER BY id', [dorm_id])
    const memberList = members.rows
    if (memberList.length === 0) return res.json([])

    let result = []
    let currentDate = new Date(start_date)
    let memberIndex = 0
    let count = 0

    while (count < days) {
      const weekDay = currentDate.getDay()
      // AI优化规则：跳过周末
      if (skip_weekend && (weekDay === 0 || weekDay === 6)) {
        currentDate.setDate(currentDate.getDate() + 1)
        continue
      }
      const member = memberList[memberIndex % memberList.length]
      await pool.query(
        'INSERT INTO new_schedule(dorm_id, member_id, sdate, status) VALUES($1,$2,$3,$4)',
        [dorm_id, member.id, currentDate.toISOString().split('T')[0], '未完成']
      )
      result.push({
        id: count + 1,
        sdate: currentDate.toISOString().split('T')[0],
        name: member.name,
        status: '未完成'
      })
      currentDate.setDate(currentDate.getDate() + 1)
      memberIndex++
      count++
    }
    res.json(result)
  } catch (e) {
    console.log(e)
    res.status(500).json([])
  }
})

// 更新值日状态
app.put('/schedule/:id', async (req, res) => {
  const { status } = req.body
  try {
    await pool.query('UPDATE new_schedule SET status=$1 WHERE id=$2', [status, req.params.id])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false })
  }
})

// 删除单条排班
app.delete('/schedule/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM new_schedule WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false })
  }
})

// AI生成值日提醒文案
app.get('/remind/:scheduleId', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT s.sdate, m.name, d.name as dorm_name
      FROM new_schedule s
      JOIN new_member m ON s.member_id = m.id
      JOIN new_dorm d ON s.dorm_id = d.id
      WHERE s.id = $1
    `, [req.params.scheduleId])
    const info = r.rows[0]
    // 格式化日期为 YYYY-MM-DD
    const dateStr = new Date(info.sdate).toISOString().split('T')[0]
    const templates = [
      `${info.name}同学你好，${dateStr}轮到你在${info.dorm_name}值日啦，请记得按时打扫卫生，保持宿舍整洁哦~`,
      `【值日提醒】${info.name}，${dateStr}是你的值日日期，请负责好宿舍地面清扫和垃圾倾倒，辛苦啦！`,
      `Hi ${info.name}，提醒你${dateStr}在${info.dorm_name}的值日任务，完成后可以标记已完成打卡~`
    ]
    const text = templates[Math.floor(Math.random() * templates.length)]
    res.json({ text })
  } catch (e) {
    res.status(500).json({ text: '生成失败' })
  }
})


// 查询排班列表
app.get('/schedule/:dormId', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT s.id, s.sdate, m.name, s.status
      FROM new_schedule s
      JOIN new_member m ON s.member_id = m.id
      WHERE s.dorm_id=$1 ORDER BY s.sdate
    `, [req.params.dormId])
    res.json(r.rows)
  } catch (e) {
    res.status(500).json([])
  }
})

app.listen(3000, () => {
  console.log('✅后端启动成功：http://localhost:3000')
})

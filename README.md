# 宿舍卫生值日管理系统

## 项目介绍
基于前后端分离架构开发的宿舍卫生值日管理系统，融入AI智能排班与AI提醒生成能力，实现值日人员管理、自动排班、状态流转、值日提醒等完整功能。

## 技术栈
- 数据库：PostgreSQL
- 后端：Node.js + Express
- 前端：Vue3 + Vite

## 启动步骤
1.  执行 sql/init.sql 完成数据库建表与初始化
2.  进入 dorm-schedule-server，执行 `npm install`，修改数据库密码后执行 `node index.js` 启动后端（端口3000）
3.  进入 dorm-schedule-web，执行 `npm install`，执行 `npm run dev` 启动前端（端口5173）
4.  浏览器访问 http://localhost:5173 即可使用系统

## 核心功能
- 宿舍信息管理
- 值日成员增删改查
- AI智能优化排班（支持跳过周末）
- 值日状态标记与流转
- AI生成值日提醒文案
- 值日记录删除管理

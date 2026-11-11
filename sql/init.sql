-- 清理旧表
DROP TABLE IF EXISTS new_schedule CASCADE;
DROP TABLE IF EXISTS new_member CASCADE;
DROP TABLE IF EXISTS new_dorm CASCADE;

-- 宿舍表
CREATE TABLE new_dorm(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

-- 成员表
CREATE TABLE new_member(
    id SERIAL PRIMARY KEY,
    dorm_id INT REFERENCES new_dorm(id),
    name VARCHAR(50)
);

-- 值日排班表
CREATE TABLE new_schedule(
    id SERIAL PRIMARY KEY,
    dorm_id INT REFERENCES new_dorm(id),
    member_id INT REFERENCES new_member(id),
    sdate DATE,
    status VARCHAR(20)
);

-- 初始化宿舍数据
INSERT INTO new_dorm(name) VALUES ('301宿舍'), ('302宿舍');

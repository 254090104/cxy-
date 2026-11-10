-- 成员表
CREATE TABLE member (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    room VARCHAR(20) NOT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 排班表
CREATE TABLE schedule (
    id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES member(id),
    work_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT '待完成',
    UNIQUE(member_id, work_date)
);

-- 换班申请表
CREATE TABLE change_apply (
    id SERIAL PRIMARY KEY,
    from_id INT NOT NULL REFERENCES member(id),
    to_id INT NOT NULL REFERENCES member(id),
    work_date DATE NOT NULL,
    apply_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    state VARCHAR(20) DEFAULT '待审核'
);

-- 打扫记录表
CREATE TABLE clean_record (
    id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL REFERENCES schedule(id),
    result VARCHAR(20),
    remark TEXT,
    record_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

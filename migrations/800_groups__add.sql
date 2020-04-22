
-- was called group_type
-- maybe call group_criteria or group_config or group_contraints?
-- This group defines additional criteria or 'ownership' of the group, perhaps
-- if the group was autogenerated based on rules
--CREATE TABLE IF NOT EXISTS group_config (
--    id BIGSERIAL PRIMARY KEY,
--    course_instance_id BIGINT NOT NULL REFERENCES course_instances(id) ON DELETE CASCADE ON UPDATE CASCADE,
--    scope_table TEXT,
--    scope_id INT,
--    type TEXT,
--    minimum INT,
--    maximum INT,
--    date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
--    deleted_at timestamp with time zone
--);

CREATE TABLE IF NOT EXISTS groups (
    id BIGSERIAL PRIMARY KEY,
    course_instance_id BIGINT NOT NULL REFERENCES course_instances(id) ON DELETE CASCADE ON UPDATE CASCADE,
    name TEXT,
    source TEXT,
    --group_config_id BIGINT REFERENCES group_config(id) ON DELETE CASCADE ON UPDATE CASCADE,
    date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS group_users (
    group_id BIGINT REFERENCES groups(id),
    user_id BIGINT REFERENCES users,
    PRIMARY KEY (group_id, user_id)
);

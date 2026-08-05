CREATE TABLE `llm_config`
(
    `id`           varchar(32)  NOT NULL,
    `org_id`       varchar(32)  NOT NULL,
    `provider`     varchar(32)  NOT NULL,
    `api_base_url` varchar(512) NOT NULL,
    `api_key`      varchar(1024) NOT NULL,
    `model`        varchar(128) NOT NULL,
    `temperature`  double       NOT NULL DEFAULT 0.3,
    `max_tokens`   int          NOT NULL DEFAULT 4096,
    `is_active`    tinyint      NOT NULL DEFAULT 0,
    `create_by`    varchar(32)  DEFAULT NULL,
    `create_time`  timestamp    DEFAULT CURRENT_TIMESTAMP,
    `update_by`    varchar(32)  DEFAULT NULL,
    `update_time`  timestamp    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
);
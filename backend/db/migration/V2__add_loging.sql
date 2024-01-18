CREATE type logging_level AS ENUM ('info', 'warn', 'error');

CREATE TABLE logging (
  source character varying(100),
  log_timestamp timestamp,
  invocation_id character varying(512),
  log_message text,
  log_level logging_level default 'info'
);

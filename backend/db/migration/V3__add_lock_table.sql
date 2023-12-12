CREATE TABLE data_process_lock(
  holder_type character varying(20) NOT NULL,
  zip_file_name character varying(512),
  create_time timestamp NOT NULL
)

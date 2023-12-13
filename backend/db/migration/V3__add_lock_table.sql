CREATE TABLE data_process_lock(
  id integer NOT NULL PRIMARY KEY,
  holder_type character varying(20) NOT NULL,
  zip_file_name character varying(512),
  create_time timestamp NOT NULL
);

ALTER TABLE data_process_lock ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
  SEQUENCE NAME data_process_lock_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1
);

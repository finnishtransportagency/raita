ALTER TABLE mittaus ADD COLUMN track character varying(40);
ALTER TABLE mittaus ADD COLUMN location character varying(40);
ALTER TABLE mittaus ADD COLUMN latitude character varying(40);
ALTER TABLE mittaus ADD COLUMN longitude character varying(40);
ALTER TABLE mittaus RENAME COLUMN ss_count to sscount;
ALTER TABLE mittaus RENAME COLUMN ajonopeus to sscount;
ALTER TABLE ohl_mittaus ADD COLUMN ohl_ajonopeus decimal;

ALTER TABLE mittaus
  ADD CONSTRAINT mittaus_pkey PRIMARY KEY (id);

ALTER TABLE raportti ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
  SEQUENCE NAME raportti_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1
  );

ALTER TABLE mittaus ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
  SEQUENCE NAME mittaus_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1
  );

ALTER TABLE ams_mittaus ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
  SEQUENCE NAME ams_mittaus_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1
  );


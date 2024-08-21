CREATE TABLE puuttuva_kolumni(
  id integer NOT NULL PRIMARY KEY,
  raportti_id integer,
  column_name varchar,
  UNIQUE (raportti_id, column_name)
);

ALTER TABLE puuttuva_kolumni ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
  SEQUENCE NAME puuttuva_kolumni_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  CACHE 1
  NO MAXVALUE
);

ALTER TABLE puuttuva_kolumni
    ADD CONSTRAINT puuttuva_kolumni_id_fkey FOREIGN KEY (raportti_id) REFERENCES raportti(id);

CREATE TABLE raportti_deletions (
  id INTEGER NOT NULL,
  deleted_at TIMESTAMP,
  key VARCHAR(1500)
);

ALTER TABLE raportti_deletions
    ADD CONSTRAINT raportti_deletions_pkey PRIMARY KEY (id);

ALTER TABLE raportti_deletions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
  SEQUENCE NAME raportti_deletions_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1
);

CREATE OR REPLACE FUNCTION log_deleted_raportti()
RETURNS TRIGGER
AS
$$
BEGIN
    INSERT INTO raportti_deletions(deleted_at, key)
    VALUES (NOW(), OLD.key);
    RETURN OLD;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER after_raportti_delete_trigger
AFTER DELETE ON raportti
FOR EACH ROW
EXECUTE FUNCTION log_deleted_raportti();

alter table mittaus add column created timestamp default now();
alter table mittaus add column modified timestamp;

alter table raportti add column created timestamp default now();;
alter table raportti add column modified timestamp;

CREATE OR REPLACE FUNCTION update_modified_column()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.modified = now();
  RETURN NEW;
END;
$$ language 'plpgsql';


CREATE TRIGGER update_modified_time BEFORE UPDATE ON mittaus FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_modified_time BEFORE UPDATE ON raportti FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

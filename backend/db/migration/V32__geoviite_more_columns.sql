--new fields from geoviite that we dont have an equivalent of prior to conversion. Are these valuable?
ALTER TABLE mittaus ADD COLUMN IF NOT EXISTS geoviite_ratanumero_oid character varying(40);
ALTER TABLE mittaus ADD COLUMN IF NOT EXISTS geoviite_sijaintiraide_oid character varying(40);

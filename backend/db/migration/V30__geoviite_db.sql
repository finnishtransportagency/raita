--new fields for geoviite converted values
ALTER TABLE mittaus ADD COLUMN IF NOT EXISTS geoviite_konvertoitu_lat numeric;
ALTER TABLE mittaus ADD COLUMN IF NOT EXISTS geoviite_konvertoitu_long numeric;
ALTER TABLE mittaus ADD COLUMN IF NOT EXISTS geoviite_konvertoitu_rataosuus_numero character varying(40);
ALTER TABLE mittaus ADD COLUMN IF NOT EXISTS geoviite_konvertoitu_rataosuus_nimi character varying(40);
ALTER TABLE mittaus ADD COLUMN IF NOT EXISTS geoviite_konvertoitu_raide_numero character varying(40);
ALTER TABLE mittaus ADD COLUMN IF NOT EXISTS geoviite_konvertoitu_rata_kilometri integer;
ALTER TABLE mittaus ADD COLUMN IF NOT EXISTS geoviite_konvertoitu_rata_metrit numeric;
ALTER TABLE mittaus ADD COLUMN IF NOT EXISTS geoviite_konvertoitu_sijainti geography(point);
--new fields from geoviite that we dont have an equivalent of prior to conversion. Are these valuable?
ALTER TABLE mittaus ADD COLUMN IF NOT EXISTS geoviite_valimatka numeric;
ALTER TABLE mittaus ADD COLUMN IF NOT EXISTS geoviite_sijaintiraide_kuvaus character varying(200);
ALTER TABLE mittaus ADD COLUMN IF NOT EXISTS geoviite_sijaintiraide_tyyppi character varying(40);

--geoviite timestamp field for mittauses so we find the ones not updated
ALTER TABLE mittaus ADD COLUMN IF NOT EXISTS geoviite_updated_at timestamp;

--add index for geoviite timestamp cause we want to query by it
CREATE INDEX IF NOT EXISTS mittaus_geoviite_updated_index ON mittaus(geoviite_updated_at);
CREATE INDEX IF NOT EXISTS ams_mittaus_geoviite_updated_index ON ams_mittaus(geoviite_updated_at);
CREATE INDEX IF NOT EXISTS ohl_mittaus_geoviite_updated_index ON ohl_mittaus(geoviite_updated_at);
CREATE INDEX IF NOT EXISTS pi_mittaus_geoviite_updated_index ON pi_mittaus(geoviite_updated_at);
CREATE INDEX IF NOT EXISTS rc_mittaus_geoviite_updated_index ON rc_mittaus(geoviite_updated_at);
CREATE INDEX IF NOT EXISTS rp_mittaus_geoviite_updated_index ON rp_mittaus(geoviite_updated_at);
CREATE INDEX IF NOT EXISTS tg_mittaus_geoviite_updated_index ON tg_mittaus(geoviite_updated_at);
CREATE INDEX IF NOT EXISTS tsight_mittaus_geoviite_updated_index ON tsight_mittaus(geoviite_updated_at);

--raportti geoviite status and timestamp fields
ALTER TABLE raportti ADD COLUMN  IF NOT EXISTS geoviite_update_at timestamp;
ALTER TABLE raportti ADD COLUMN  IF NOT EXISTS geoviite_status character varying(20);

ALTER TABLE mittaus ADD COLUMN geoviite_konvertoitu_lat numeric;
ALTER TABLE mittaus ADD COLUMN geoviite_konvertoitu_long numeric;
ALTER TABLE mittaus ADD COLUMN geoviite_konvertoitu_rataosuus_numero character varying(40);
ALTER TABLE mittaus ADD COLUMN geoviite_konvertoitu_rataosuus_nimi character varying(40);
ALTER TABLE mittaus ADD COLUMN geoviite_konvertoitu_raide_numero character varying(40);
ALTER TABLE mittaus ADD COLUMN geoviite_konvertoitu_rata_kilometri integer;
ALTER TABLE mittaus ADD COLUMN geoviite_konvertoitu_rata_metrit numeric;
ALTER TABLE mittaus ADD COLUMN geoviite_konvertoitu_sijainti geography(point);

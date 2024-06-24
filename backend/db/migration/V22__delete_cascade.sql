-- tg_mittaus table
ALTER TABLE tg_mittaus
DROP CONSTRAINT IF EXISTS tg_mittaus_raportti_id_fkey;

ALTER TABLE tg_mittaus
ADD CONSTRAINT tg_mittaus_raportti_id_fkey
FOREIGN KEY (raportti_id) REFERENCES raportti(id)
ON DELETE CASCADE;

-- tsight_mittaus table
ALTER TABLE tsight_mittaus
DROP CONSTRAINT IF EXISTS tsight_mittaus_raportti_id_fkey;

ALTER TABLE tsight_mittaus
ADD CONSTRAINT tsight_mittaus_raportti_id_fkey
FOREIGN KEY (raportti_id) REFERENCES raportti(id)
ON DELETE CASCADE;

-- mittaus table
ALTER TABLE mittaus
DROP CONSTRAINT IF EXISTS mittaus_raportti_id_fkey;

ALTER TABLE mittaus
ADD CONSTRAINT mittaus_raportti_id_fkey
FOREIGN KEY (raportti_id) REFERENCES raportti(id)
ON DELETE CASCADE;

-- pi_mittaus table
ALTER TABLE pi_mittaus
DROP CONSTRAINT IF EXISTS pi_mittaus_raportti_id_fkey;

ALTER TABLE pi_mittaus
ADD CONSTRAINT pi_mittaus_raportti_id_fkey
FOREIGN KEY (raportti_id) REFERENCES raportti(id)
ON DELETE CASCADE;

-- rc_mittaus table
ALTER TABLE rc_mittaus
DROP CONSTRAINT IF EXISTS rc_mittaus_raportti_id_fkey;

ALTER TABLE rc_mittaus
ADD CONSTRAINT rc_mittaus_raportti_id_fkey
FOREIGN KEY (raportti_id) REFERENCES raportti(id)
ON DELETE CASCADE;

-- ohl_mittaus table
ALTER TABLE ohl_mittaus
DROP CONSTRAINT IF EXISTS ohl_mittaus_raportti_id_fkey;

ALTER TABLE ohl_mittaus
ADD CONSTRAINT ohl_mittaus_raportti_id_fkey
FOREIGN KEY (raportti_id) REFERENCES raportti(id)
ON DELETE CASCADE;

-- ams_mittaus table
ALTER TABLE ams_mittaus
DROP CONSTRAINT IF EXISTS ams_mittaus_raportti_id_fkey;

ALTER TABLE ams_mittaus
ADD CONSTRAINT ams_mittaus_raportti_id_fkey
FOREIGN KEY (raportti_id) REFERENCES raportti(id)
ON DELETE CASCADE;

-- puuttuva_kolumni table
ALTER TABLE puuttuva_kolumni
DROP CONSTRAINT IF EXISTS puuttuva_kolumni_raportti_id_fkey;

ALTER TABLE puuttuva_kolumni
ADD CONSTRAINT puuttuva_kolumni_raportti_id_fkey
FOREIGN KEY (raportti_id) REFERENCES raportti(id)
ON DELETE CASCADE;

-- rp_mittaus table
ALTER TABLE rp_mittaus
DROP CONSTRAINT IF EXISTS rp_mittaus_raportti_id_fkey;

ALTER TABLE rp_mittaus
ADD CONSTRAINT rp_mittaus_raportti_id_fkey
FOREIGN KEY (raportti_id) REFERENCES raportti(id)
ON DELETE CASCADE;

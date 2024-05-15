
ALTER TABLE raportti ADD COLUMN maintenance_area VARCHAR(20);
ALTER TABLE raportti ADD COLUMN is_empty BOOLEAN DEFAULT FALSE;
ALTER TABLE raportti ADD COLUMN length INTEGER;
ALTER TABLE raportti ADD COLUMN tilirataosanumero VARCHAR(20);
ALTER TABLE raportti ADD COLUMN report_type VARCHAR(50);
ALTER TABLE raportti ADD COLUMN temperature REAL;
ALTER TABLE raportti ADD COLUMN measurement_start_location VARCHAR(20);
ALTER TABLE raportti ADD COLUMN measurement_end_location VARCHAR(20);
ALTER TABLE raportti ADD COLUMN measurement_direction VARCHAR(20);
ALTER TABLE raportti ADD COLUMN maintenance_level VARCHAR(20);

ALTER TYPE jarjestelma ADD VALUE 'LSI-TSI';
ALTER TYPE jarjestelma ADD VALUE 'CW';
ALTER TYPE jarjestelma ADD VALUE 'THIS';
ALTER TYPE jarjestelma ADD VALUE 'VCUBE';

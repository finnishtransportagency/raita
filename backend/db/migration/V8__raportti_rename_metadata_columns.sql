alter table raportti rename column tiedostotyyppi to file_type;
alter table raportti rename column tarkastusvaunu to source_system;
alter table raportti rename column zip_tiedostonimi to zip_name;
alter table raportti rename column kampanja to campaign;
alter table raportti rename column rataosuus_numero to track_number;
alter table raportti rename column raportointiosuus to track_part;
alter table raportti rename column raide_numero to track_id;
alter table raportti rename column aloitus_rata_kilometri to km_start;
alter table raportti rename column lopetus_rata_kilometri to km_end;
alter table raportti rename column jarjestelma to system;
alter table raportti rename column tarkastusajon_tunniste to nonparsed_inspection_datetime;
alter table raportti rename column raportin_kategoria to report_category;
alter table raportti rename column vuosi to year;
alter table raportti rename column pvm to inspection_date;
alter table raportti rename column tiedostonimi to file_name;
alter table raportti rename column tiedoston_koko_kb to size;

alter table raportti add column parsed_at_datetime timestamp;
alter table raportti add column key character varying(1500);
alter table raportti add column inspection_datetime timestamp;
alter table raportti add column parser_version character varying(15);

alter table raportti drop column zip_vastaanotto_vuosi;
alter table raportti drop column zip_vastaanotto_pvm;
alter table raportti add column zip_reception__year integer;
alter table raportti add column zip_reception__date integer;

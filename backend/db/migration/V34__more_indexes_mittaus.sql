create index concurrently if not exists mittaus_multi_index on mittaus(raportti_id, id);
create index concurrently if not exists ams_mittaus_multi_index on ams_mittaus(raportti_id, id);
create index concurrently if not exists ohl_mittaus_multi_index on ohl_mittaus(raportti_id, id);
create index concurrently if not exists pi_mittaus_multi_index on pi_mittaus(raportti_id, id);
create index concurrently if not exists rc_mittaus_multi_index on rc_mittaus(raportti_id, id);
create index concurrently if not exists rp_mittaus_multi_index on rp_mittaus(raportti_id, id);
create index concurrently if not exists tg_mittaus_multi_index on tg_mittaus(raportti_id, id);
create index concurrently if not exists tsight_mittaus_multi_index on tsight_mittaus(raportti_id, id);

create index concurrently if not exists geoviite_updated_at_index on mittaus(geoviite_updated_at);
create index concurrently if not exists ams_geoviite_updated_at_index on ams_mittaus(geoviite_updated_at);
create index concurrently if not exists ohl_geoviite_updated_at_index on ohl_mittaus(geoviite_updated_at);
create index concurrently if not exists pi_geoviite_updated_at_index on pi_mittaus(geoviite_updated_at);
create index concurrently if not exists rc_geoviite_updated_at_index on rc_mittaus(geoviite_updated_at);
create index concurrently if not exists rp_geoviite_updated_at_index on rp_mittaus(geoviite_updated_at);
create index concurrently if not exists tg_geoviite_updated_at_index on tg_mittaus(geoviite_updated_at);
create index concurrently if not exists tsight_geoviite_updated_at_index on tsight_mittaus(geoviite_updated_at);

create index concurrently if not exists geoviite_virhe_index on mittaus(geoviite_virhe);
create index concurrently if not exists ams_geoviite_virhe_index on ams_mittaus(geoviite_virhe);
create index concurrently if not exists ohl_geoviite_virhe_index on ohl_mittaus(geoviite_virhe);
create index concurrently if not exists pi_geoviite_virhe_index on pi_mittaus(geoviite_virhe);
create index concurrently if not exists rc_geoviite_virhe_index on rc_mittaus(geoviite_virhe);
create index concurrently if not exists rp_geoviite_virhe_index on rp_mittaus(geoviite_virhe);
create index concurrently if not exists tg_geoviite_virhe_index on tg_mittaus(geoviite_virhe);
create index concurrently if not exists tsight_geoviite_virhe_index on tsight_mittaus(geoviite_virhe);

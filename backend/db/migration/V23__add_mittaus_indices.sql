create index if not exists ams_index on ams_mittaus(raportti_id);
create index if not exists ohl_index on ohl_mittaus(raportti_id);
create index if not exists pi_index on pi_mittaus(raportti_id);
create index if not exists rc_index on rc_mittaus(raportti_id);
create index if not exists rp_index on rp_mittaus(raportti_id);
create index if not exists tg_index on tg_mittaus(raportti_id);
create index if not exists tsight_index on tsight_mittaus(raportti_id);

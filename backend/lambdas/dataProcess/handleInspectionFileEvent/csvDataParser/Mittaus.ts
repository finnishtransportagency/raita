import {Rataosoite} from "./rataosoite";

enum Jarjestelma {
  AMS = 'AMS',
  OHL = 'OHL',
  PI = 'PI',
  RC = 'RC',
  RP = 'RP',
  TG = 'TG',
  TSIGHT = 'TSIGHT',
};

export type Mittaus = {
  id: number,
  raportti_id: number,
  running_date: Date,
  jarjestelma: string,
  sscount: number,
  rataosoite: Rataosoite,
  sijainti: unknown,
  ajonopeus: string,
  track: string,
  location: string,
  latitude: string,
  longitude: string,
}

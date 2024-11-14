import { Rataosoite } from './Rataosoite';

enum Jarjestelma {
  AMS = 'AMS',
  OHL = 'OHL',
  PI = 'PI',
  RC = 'RC',
  RP = 'RP',
  TG = 'TG',
  TSIGHT = 'TSIGHT',
}

export type Mittaus = {
  id: number;
  raportti_id: number;
  running_date: Date;
  jarjestelma: string;
  sscount: number;
  rataosoite: Rataosoite;
  sijainti: unknown;
  ajonopeus: string;
  track: string;
  location: string;
  latitude: string;
  longitude: string;
};

export enum ConversionStatus {
  READY_FOR_CONVERSION = 'READY_FOR_CONVERSION', // set status to this in db for manual processing
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

import { IExtractionSpec } from "./specification";

export interface ISpecificationAdapterInterface {
  getSpecification: () => Promise<string>;
}

export interface ISpecificationPortInterface {
  getSpecification: () => Promise<IExtractionSpec>;
}

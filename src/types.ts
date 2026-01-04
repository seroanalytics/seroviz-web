// Types for SeroViz WebR

export type DataSeries = {
  name: string;
  model: {
    x: (number | string | null)[];
    y: (number | null)[];
  } | null;
  raw: {
    x: (number | string | null)[];
    y: (number | null)[];
  };
  warnings: string[] | null;
}[];

export interface DatasetMetadata {
  variables: VariableSchema[];
  biomarkers: string[];
  xcol: string;
  type: "surveillance" | "post-exposure";
}

export interface VariableSchema {
  name: string;
  levels: (string | number | null)[];
}

export type DatasetNames = string[];

export interface ErrorDetail {
  error: string;
  detail: string | null;
}

export interface Plotly {
  data: {
    x?: unknown[] | null | number;
    y?: unknown[] | null | number;
    [k: string]: unknown;
  }[];
  layout: {
    [k: string]: unknown;
  };
  warnings: string | null | string[];
  numPages: number;
  page: number;
}

export type PublicDatasets = {
  name: string;
  description: string;
  [k: string]: unknown;
}[];

export interface ResponseFailure {
  status: "failure";
  data: null;
  errors: ErrorDetail[];
}

export interface ResponseSuccess<T> {
  status: "success";
  data: T;
  errors: null;
}

export type GenericResponse<T> = ResponseSuccess<T> | ResponseFailure;

export type UploadResult = string;

export interface Variable {
  name: string;
  levels: (string | number | null)[];
}

export type Version = string;

// Application-specific types
type PlotDisplay = "facet" | "trace";

export interface Dict<T> {
  [index: string]: T;
}

export interface CovariateSettings extends Variable {
  display: PlotDisplay;
}

export interface SplineSettings {
  method: "gam" | "loess" | "auto";
  k: number;
  span: number;
}

export interface IndividualSettings {
  pid: string;
  filter: string;
  color: string;
  linetype: string;
}

export interface DatasetSettings {
  covariateSettings: CovariateSettings[];
  scale: "log" | "natural" | "log2";
  splineSettings: SplineSettings;
  individualSettings: IndividualSettings;
  colorBy: string;
  facetBy: string;
}

export interface AppState {
  datasetNames: DatasetNames;
  publicDatasets: PublicDatasets;
  datasetMetadata: DatasetMetadata | null;
  selectedDataset: string;
  selectedDatasetIsPublic: boolean;
  datasetSettings: Dict<DatasetSettings>;
  selectedPlot: "population" | "individual";
  uploadError: ErrorDetail | null;
  genericErrors: ErrorDetail[];
  language: string;
}

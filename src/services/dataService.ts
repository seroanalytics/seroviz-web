import { serovizService, WebRResponse } from "./webrService";
import { ActionType, RootAction } from "../RootContext";
import {
  DataSeries,
  DatasetMetadata,
  DatasetNames,
  Plotly,
  PublicDatasets,
  UploadResult,
  GenericResponse,
  CovariateSettings,
  IndividualSettings,
  SplineSettings,
} from "../types";
import { Dispatch } from "react";

export class DataService {
  private readonly _dispatch: (action: RootAction) => void;

  constructor(dispatch: (action: RootAction) => void) {
    this._dispatch = dispatch;
  }

  async refreshSession(): Promise<void | GenericResponse<string>> {
    try {
      const response = await serovizService.getRoot();
      return this.convertWebRResponse(response);
    } catch (error) {
      this._dispatch({
        type: ActionType.ERROR_ADDED,
        payload: {
          error: "SESSION_ERROR",
          detail: error instanceof Error ? error.message : "Unknown session error"
        }
      });
    }
  }

  async getDatasetNames(): Promise<void | GenericResponse<DatasetNames>> {
    try {
      const response = await serovizService.getDatasets();
      if (response.status === 'success') {
        this._dispatch({
          type: ActionType.DATASET_NAMES_FETCHED,
          payload: response.data!
        });
      } else {
        this._dispatch({
          type: ActionType.ERROR_ADDED,
          payload: response.errors![0]
        });
      }
      return this.convertWebRResponse(response);
    } catch (error) {
      this._dispatch({
        type: ActionType.ERROR_ADDED,
        payload: {
          error: "FETCH_ERROR",
          detail: error instanceof Error ? error.message : "Unknown fetch error"
        }
      });
    }
  }

  async getPublicDatasets(): Promise<void | GenericResponse<PublicDatasets>> {
    try {
      const response = await serovizService.getPublicDatasets();
      if (response.status === 'success') {
        this._dispatch({
          type: ActionType.PUBLIC_DATASETS_FETCHED,
          payload: response.data!
        });
      } else {
        this._dispatch({
          type: ActionType.ERROR_ADDED,
          payload: response.errors![0]
        });
      }
      return this.convertWebRResponse(response);
    } catch (error) {
      this._dispatch({
        type: ActionType.ERROR_ADDED,
        payload: {
          error: "FETCH_ERROR",
          detail: error instanceof Error ? error.message : "Unknown fetch error"
        }
      });
    }
  }

  async getDatasetMetadata(selectedDataset: string, isPublic: boolean): Promise<void | GenericResponse<DatasetMetadata>> {
    try {
      const response = await serovizService.getDatasetMetadata(selectedDataset, isPublic);
      if (response.status === 'success') {
        this._dispatch({
          type: ActionType.DATASET_METADATA_FETCHED,
          payload: response.data!
        });
      } else {
        this._dispatch({
          type: ActionType.ERROR_ADDED,
          payload: response.errors![0]
        });
      }
      return this.convertWebRResponse(response);
    } catch (error) {
      this._dispatch({
        type: ActionType.ERROR_ADDED,
        payload: {
          error: "FETCH_ERROR",
          detail: error instanceof Error ? error.message : "Unknown fetch error"
        }
      });
    }
  }

  async uploadDataset(formData: FormData): Promise<void | GenericResponse<UploadResult>> {
    try {
      const response = await serovizService.uploadDataset(formData);
      if (response.status === 'failure') {
        this._dispatch({
          type: ActionType.UPLOAD_ERROR_ADDED,
          payload: response.errors![0]
        });
      }
      return this.convertWebRResponse(response);
    } catch (error) {
      this._dispatch({
        type: ActionType.UPLOAD_ERROR_ADDED,
        payload: {
          error: "UPLOAD_ERROR",
          detail: error instanceof Error ? error.message : "Unknown upload error"
        }
      });
    }
  }

  async getDataSeries(
    selectedDataset: string,
    biomarker: string,
    facetDefinition: string,
    covariateSettings: CovariateSettings[],
    scale: "log" | "natural" | "log2",
    splineSettings: SplineSettings,
    isPublic: boolean
  ): Promise<void | GenericResponse<DataSeries>> {
    try {
      const traces = covariateSettings
        .filter(v => v.display === "trace")
        .map(v => v.name).join("+");

      const response = await serovizService.getTrace(
        selectedDataset,
        biomarker,
        facetDefinition || undefined,
        traces || undefined,
        scale,
        splineSettings.method,
        splineSettings.span,
        splineSettings.k,
        isPublic
      );

      return this.convertWebRResponse(response);
    } catch (error) {
      console.error("Error getting data series:", error);
    }
  }

  async getIndividualData(
    selectedDataset: string,
    scale: "log" | "natural" | "log2",
    individualSettings: IndividualSettings,
    page: number,
    isPublic: boolean
  ): Promise<void | GenericResponse<Plotly>> {
    try {
      const response = await serovizService.getIndividual(
        selectedDataset,
        individualSettings.pid,
        scale,
        individualSettings.filter || undefined,
        individualSettings.color || undefined,
        individualSettings.linetype || undefined,
        page,
        isPublic
      );

      return this.convertWebRResponse(response);
    } catch (error) {
      console.error("Error getting individual data:", error);
    }
  }

  async deleteDataset(dataset: string): Promise<void | GenericResponse<string>> {
    try {
      const response = await serovizService.deleteDataset(dataset);
      if (response.status === 'success') {
        this._dispatch({
          type: ActionType.DATASET_DELETED,
          payload: response.data!
        });
      } else {
        this._dispatch({
          type: ActionType.ERROR_ADDED,
          payload: response.errors![0]
        });
      }
      return this.convertWebRResponse(response);
    } catch (error) {
      this._dispatch({
        type: ActionType.ERROR_ADDED,
        payload: {
          error: "DELETE_ERROR",
          detail: error instanceof Error ? error.message : "Unknown delete error"
        }
      });
    }
  }

  async endSession(): Promise<void | GenericResponse<string>> {
    try {
      const response = await serovizService.endSession();
      if (response.status === 'success') {
        this._dispatch({
          type: ActionType.SESSION_ENDED,
          payload: response.data!
        });
      }
      return this.convertWebRResponse(response);
    } catch (error) {
      console.error("Error ending session:", error);
    }
  }

  private convertWebRResponse<T>(response: WebRResponse<T>): GenericResponse<T> {
    if (response.status === 'success') {
      return {
        status: 'success',
        data: response.data!,
        errors: null
      };
    } else {
      return {
        status: 'failure',
        data: null,
        errors: response.errors || []
      };
    }
  }
}

export const dataService = (lang: string, dispatch: Dispatch<RootAction>) => new DataService(dispatch);

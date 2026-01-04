import { WebR } from 'webr';
import { 
  DatasetMetadata, 
  DatasetNames, 
  DataSeries, 
  Plotly, 
  PublicDatasets, 
  UploadResult,
  GenericResponse,
  ErrorDetail
} from '../types';

export interface WebRResponse<T> {
  status: 'success' | 'failure';
  data?: T;
  errors?: ErrorDetail[];
}

export class SeroVizService {
  private webr: WebR | null = null;
  private isInitialized = false;
  private datasets: Map<string, any> = new Map();
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('Initializing SeroViz backend...');
    console.log('Using JavaScript implementations for data processing...');
    
    // Skip WebR initialization for now due to browser security issues
    // Use pure JavaScript implementations instead
    this.webr = null;
    this.isInitialized = true;
    
    console.log('SeroViz backend initialized successfully');
  }

  private async installRPackages(): Promise<void> {
    // Skip package installation for now - use base R functions only
    console.log('Skipping R package installation - using base R functions only');
    return;
  }

  private async loadRLibraries(): Promise<void> {
    // Skip library loading for now - use base R functions only
    console.log('Skipping R library loading - using base R functions only');
    return;
  }

  async getRoot(): Promise<WebRResponse<string>> {
    await this.initialize();
    return {
      status: 'success',
      data: 'Welcome to serovizr WebR'
    };
  }

  async getVersion(): Promise<WebRResponse<string>> {
    await this.initialize();
    return {
      status: 'success',
      data: '0.0.0-webr'
    };
  }

  async getDatasets(): Promise<WebRResponse<DatasetNames>> {
    await this.initialize();
    const datasetNames = Array.from(this.datasets.keys());
    return {
      status: 'success',
      data: datasetNames
    };
  }

  async getPublicDatasets(): Promise<WebRResponse<PublicDatasets>> {
    await this.initialize();
    
    try {
      // Load public datasets from the public directory
      const publicDatasets = await this.loadPublicDatasets();
      return {
        status: 'success',
        data: publicDatasets
      };
    } catch (error) {
      console.error('Error loading public datasets:', error);
      return {
        status: 'success',
        data: []
      };
    }
  }

  private async loadPublicDatasets(): Promise<PublicDatasets> {
    // Define the public datasets that are available
    const publicDatasets: PublicDatasets = [
      {
        name: 'antia2018',
        description: 'Longitudinal data on multiple pathogens compiled from <a href="https://www.nejm.org/doi/10.1056/NEJMoa066092">https://www.nejm.org/doi/10.1056/NEJMoa066092</a> and <a href="https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.2006601">https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.2006601</a>'
      },
      {
        name: 'sim',
        description: 'Simulated surveillance data over a time period of about 150 days, with a small increase in antibody titre over time.'
      }
    ];

    return publicDatasets;
  }

  async uploadDataset(formData: FormData): Promise<WebRResponse<UploadResult>> {
    await this.initialize();
    
    try {
      const file = formData.get('file') as File;
      const name = formData.get('name') as string;
      const xcol = formData.get('xcol') as string;
      const seriesType = formData.get('series_type') as string;
      
      if (!file) {
        return {
          status: 'failure',
          errors: [{
            error: 'NO_FILE',
            detail: 'No file provided'
          }]
        };
      }

      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Validate required columns
      const requiredCols = ['value', 'biomarker', xcol || 'day'];
      const missingCols = requiredCols.filter(col => !headers.includes(col));
      
      if (missingCols.length > 0) {
        return {
          status: 'failure',
          errors: [{
            error: 'MISSING_COLUMNS',
            detail: `Missing required columns: ${missingCols.join(', ')}`
          }]
        };
      }

      // Parse CSV data
      const data = this.parseCSV(text);
      
      // Validate x column values
      const xcolName = xcol || 'day';
      const xValues = data.map(row => row[xcolName]);
      const parsedXValues = this.parseXValues(xValues);
      
      if (parsedXValues.every(val => isNaN(val))) {
        return {
          status: 'failure',
          errors: [{
            error: 'INVALID_XCOL',
            detail: 'Could not parse x column values as numbers or dates'
          }]
        };
      }

      // Store dataset
      const datasetName = name || file.name.replace('.csv', '');
      this.datasets.set(datasetName, {
        data: data,
        xcol: xcolName,
        xtype: this.getXType(parsedXValues),
        seriesType: seriesType || 'surveillance'
      });

      return {
        status: 'success',
        data: datasetName
      };
    } catch (error) {
      return {
        status: 'failure',
        errors: [{
          error: 'UPLOAD_ERROR',
          detail: error instanceof Error ? error.message : 'Unknown upload error'
        }]
      };
    }
  }

  async getDatasetMetadata(name: string, isPublic: boolean = false): Promise<WebRResponse<DatasetMetadata>> {
    await this.initialize();
    
    if (isPublic) {
      // Load metadata for public datasets
      try {
        const metadata = await this.loadPublicDatasetMetadata(name);
        return {
          status: 'success',
          data: metadata
        };
      } catch (error) {
        return {
          status: 'failure',
          errors: [{
            error: 'DATASET_NOT_FOUND',
            detail: `Public dataset '${name}' not found`
          }]
        };
      }
    }
    
    const dataset = this.datasets.get(name);
    if (!dataset) {
      return {
        status: 'failure',
        errors: [{
          error: 'DATASET_NOT_FOUND',
          detail: `Dataset '${name}' not found`
        }]
      };
    }

    const data = dataset.data;
    const xcol = dataset.xcol;
    const biomarkers = Array.from(new Set(data.map((row: any) => row.biomarker))) as string[];
    const covariates = Object.keys(data[0]).filter(col => 
      !['value', 'biomarker', xcol].includes(col)
    );

    const variables = covariates.map(col => ({
      name: col,
      levels: Array.from(new Set(data.map((row: any) => row[col]))) as (string | number | null)[]
    }));

    return {
      status: 'success',
      data: {
        variables,
        biomarkers,
        xcol,
        type: dataset.seriesType
      }
    };
  }

  private async loadPublicDatasetMetadata(name: string): Promise<DatasetMetadata> {
    // Load metadata for public datasets
    const baseUrl = process.env.PUBLIC_URL || '';
    
    try {
      const [description, seriesType, xcol, xtype] = await Promise.all([
        fetch(`${baseUrl}/datasets/${name}/description`).then(r => r.text()),
        fetch(`${baseUrl}/datasets/${name}/series_type`).then(r => r.text()),
        fetch(`${baseUrl}/datasets/${name}/xcol`).then(r => r.text()),
        fetch(`${baseUrl}/datasets/${name}/xtype`).then(r => r.text())
      ]);

      // Load the data to get variable information
      const dataResponse = await fetch(`${baseUrl}/datasets/${name}/data`);
      const dataText = await dataResponse.text();
      const lines = dataText.split('\n').filter(l => l.trim());
      const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Parse all data to get unique values for each column
      const data = this.parseCSV(dataText);
      
      // Get biomarkers
      const biomarkers = Array.from(new Set(data.map((row: any) => row.biomarker))) as string[];
      
      // Get all variables except xcol, value, and biomarker
      const xcolName = xcol.trim();
      const variables = header
        .filter(col => !['value', 'biomarker', xcolName].includes(col))
        .map(col => ({
          name: col,
          levels: Array.from(new Set(data.map((row: any) => row[col]))) as (string | number | null)[]
        }));

      return {
        variables,
        biomarkers,
        xcol: xcolName,
        type: seriesType.trim() as "surveillance" | "post-exposure"
      };
    } catch (error) {
      console.error(`Error loading metadata for public dataset ${name}:`, error);
      throw error;
    }
  }

  private async loadPublicDataset(name: string): Promise<any> {
    // Load public dataset data
    const baseUrl = process.env.PUBLIC_URL || '';
    
    try {
      const [dataResponse, seriesType, xcol, xtype] = await Promise.all([
        fetch(`${baseUrl}/datasets/${name}/data`),
        fetch(`${baseUrl}/datasets/${name}/series_type`).then(r => r.text()),
        fetch(`${baseUrl}/datasets/${name}/xcol`).then(r => r.text()),
        fetch(`${baseUrl}/datasets/${name}/xtype`).then(r => r.text())
      ]);

      const dataText = await dataResponse.text();
      const data = this.parseCSV(dataText);

      return {
        data: data,
        xcol: xcol.trim(),
        xtype: xtype.trim(),
        seriesType: seriesType.trim()
      };
    } catch (error) {
      console.error(`Error loading public dataset ${name}:`, error);
      throw error;
    }
  }

  async getTrace(
    name: string,
    biomarker: string,
    filter?: string,
    disaggregate?: string,
    scale: string = 'natural',
    method: string = 'auto',
    span: number = 0.75,
    k: number = 10,
    isPublic: boolean = false
  ): Promise<WebRResponse<DataSeries>> {
    await this.initialize();
    
    let dataset;
    if (isPublic) {
      // Load public dataset
      try {
        dataset = await this.loadPublicDataset(name);
      } catch (error) {
        return {
          status: 'failure',
          errors: [{
            error: 'DATASET_NOT_FOUND',
            detail: `Public dataset '${name}' not found`
          }]
        };
      }
    } else {
      dataset = this.datasets.get(name);
      if (!dataset) {
        return {
          status: 'failure',
          errors: [{
            error: 'DATASET_NOT_FOUND',
            detail: `Dataset '${name}' not found`
          }]
        };
      }
    }

    try {
      // Filter data by biomarker
      let filteredData = dataset.data.filter((row: any) => row.biomarker === biomarker);
      
      // Apply additional filters
      if (filter) {
        filteredData = this.applyFilters(filteredData, filter);
      }

      // Apply scale transformation
      filteredData = this.applyScale(filteredData, scale);

      // Process disaggregation if specified
      if (disaggregate) {
        const groups = this.disaggregateData(filteredData, disaggregate);
        const results = [];
        
        for (const [groupName, groupData] of Object.entries(groups)) {
          const model = await this.fitModel(groupData, dataset.xcol, dataset.xtype, method, span, k);
          results.push({
            name: groupName,
            model: model,
            raw: this.extractRawData(groupData, dataset.xcol),
            warnings: []
          });
        }
        
        return {
          status: 'success',
          data: results
        };
      } else {
        // Single trace
        const model = await this.fitModel(filteredData, dataset.xcol, dataset.xtype, method, span, k);
        const result = [{
          name: filter || 'all',
          model: model,
          raw: this.extractRawData(filteredData, dataset.xcol),
          warnings: []
        }];
        
        return {
          status: 'success',
          data: result
        };
      }
    } catch (error) {
      return {
        status: 'failure',
        errors: [{
          error: 'MODEL_ERROR',
          detail: error instanceof Error ? error.message : 'Unknown modeling error'
        }]
      };
    }
  }

  async getIndividual(
    name: string,
    pidcol: string,
    scale: string = 'natural',
    filter?: string,
    color?: string,
    linetype?: string,
    page: number = 1,
    isPublic: boolean = false
  ): Promise<WebRResponse<Plotly>> {
    await this.initialize();
    
    let dataset;
    if (isPublic) {
      // Load public dataset
      try {
        dataset = await this.loadPublicDataset(name);
      } catch (error) {
        return {
          status: 'failure',
          errors: [{
            error: 'DATASET_NOT_FOUND',
            detail: `Public dataset '${name}' not found`
          }]
        };
      }
    } else {
      dataset = this.datasets.get(name);
      if (!dataset) {
        return {
          status: 'failure',
          errors: [{
            error: 'DATASET_NOT_FOUND',
            detail: `Dataset '${name}' not found`
          }]
        };
      }
    }

    try {
      let data = dataset.data;
      
      // Apply filters
      if (filter) {
        data = this.applyFilters(data, filter);
      }

      // Apply scale transformation
      data = this.applyScale(data, scale);

      // Check if pidcol exists
      if (!data[0] || !(pidcol in data[0])) {
        return {
          status: 'failure',
          errors: [{
            error: 'COLUMN_NOT_FOUND',
            detail: `Column '${pidcol}' not found in dataset`
          }]
        };
      }

      // Get unique IDs and paginate
      const uniqueIds = Array.from(new Set(data.map((row: any) => row[pidcol])));
      const pageLength = 20;
      const numPages = Math.ceil(uniqueIds.length / pageLength);
      const startIdx = (page - 1) * pageLength;
      const endIdx = Math.min(startIdx + pageLength, uniqueIds.length);
      const pagedIds = uniqueIds.slice(startIdx, endIdx);
      
      const pagedData = data.filter((row: any) => pagedIds.includes(row[pidcol]));

      // Generate plotly data using R
      const plotlyData = await this.generatePlotlyData(pagedData, dataset.xcol, pidcol, color, linetype);

      return {
        status: 'success',
        data: {
          data: plotlyData.data,
          layout: plotlyData.layout,
          page: page,
          numPages: numPages,
          warnings: []
        }
      };
    } catch (error) {
      return {
        status: 'failure',
        errors: [{
          error: 'PLOT_ERROR',
          detail: error instanceof Error ? error.message : 'Unknown plotting error'
        }]
      };
    }
  }

  async deleteDataset(name: string): Promise<WebRResponse<string>> {
    await this.initialize();
    
    if (this.datasets.has(name)) {
      this.datasets.delete(name);
      return {
        status: 'success',
        data: name
      };
    } else {
      return {
        status: 'failure',
        errors: [{
          error: 'DATASET_NOT_FOUND',
          detail: `Dataset '${name}' not found`
        }]
      };
    }
  }

  async endSession(): Promise<WebRResponse<string>> {
    await this.initialize();
    
    this.datasets.clear();
    return {
      status: 'success',
      data: 'OK'
    };
  }

  // Helper methods
  private parseCSV(text: string): any[] {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
  }

  private parseXValues(values: string[]): number[] {
    return values.map(val => {
      const num = parseFloat(val);
      if (!isNaN(num)) return num;
      
      // Try parsing as date
      const date = new Date(val);
      return isNaN(date.getTime()) ? NaN : date.getTime() / (1000 * 60 * 60 * 24);
    });
  }

  private getXType(values: number[]): string {
    // Simple heuristic: if values are very large, they're likely dates
    const max = Math.max(...values);
    return max > 1000000 ? 'date' : 'number';
  }

  private applyFilters(data: any[], filter: string): any[] {
    const filters = filter.split('+');
    let filteredData = data;
    
    for (const f of filters) {
      const [varName, level] = f.split(':');
      filteredData = filteredData.filter(row => row[varName] === level);
    }
    
    return filteredData;
  }

  private applyScale(data: any[], scale: string): any[] {
    if (scale === 'natural') return data;
    
    return data.map(row => ({
      ...row,
      value: scale === 'log' ? Math.log(row.value) : Math.log2(row.value)
    }));
  }

  private disaggregateData(data: any[], disaggregate: string): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    const vars = disaggregate.split('+');
    
    data.forEach(row => {
      const key = vars.map(v => row[v]).join('_');
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });
    
    return groups;
  }

  private async fitModel(data: any[], xcol: string, xtype: string, method: string, span: number, k: number): Promise<any> {
    if (data.length === 0) {
      return { x: [], y: [] };
    }

    console.log('fitModel called with:', { method, span, k, dataLength: data.length });

    try {
      // Convert data to R format
      const rData = data.map(row => ({
        x: parseFloat(row[xcol]),
        y: parseFloat(row.value)
      }));

      // Create R data frame
      const xValues = rData.map(d => d.x);
      const yValues = rData.map(d => d.y);
      
      // Use WebR to fit models in R with base functions only
      if (this.webr) {
        try {
          // Set up R data
          await this.webr.evalR(`x <- c(${xValues.join(',')})`);
          await this.webr.evalR(`y <- c(${yValues.join(',')})`);
          await this.webr.evalR(`df <- data.frame(x = x, y = y)`);
          
          // Use base R functions only
          let modelCode = '';
          if (method === 'linear') {
            // Simple linear regression
            modelCode = `model <- lm(y ~ x, data = df)`;
          } else if (method === 'gam' || (method === 'auto' && data.length > 1000)) {
            // Use polynomial regression as GAM alternative
            // k parameter controls the polynomial degree (capped at 10 to avoid overfitting)
            const degree = Math.min(k, 10);
            modelCode = `model <- lm(y ~ poly(x, degree = ${degree}), data = df)`;
          } else {
            // Use LOESS model (base R function)
            modelCode = `model <- loess(y ~ x, data = df, span = ${span})`;
          }
          
          await this.webr.evalR(modelCode);
          
          // Generate predictions
          const minX = Math.min(...xValues);
          const maxX = Math.max(...xValues);
          const xseq = Array.from({ length: Math.ceil(maxX - minX) + 1 }, (_, i) => minX + i);
          
          await this.webr.evalR(`xseq <- c(${xseq.join(',')})`);
          await this.webr.evalR(`pred <- predict(model, data.frame(x = xseq))`);
          
          // Get predictions from R
          const predResult = await this.webr.evalR(`pred`);
          const yseq = await predResult.toJs();
          
          return { x: xseq, y: yseq };
        } catch (error) {
          console.warn('WebR modeling failed, using JavaScript fallback:', error);
          // Fall through to JavaScript implementation
        }
      }
      
      // Enhanced JavaScript implementation
      {
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        const xseq = Array.from({ length: Math.ceil(maxX - minX) + 1 }, (_, i) => minX + i);
        
        let yseq: number[];
        
        if (method === 'linear') {
          // Simple linear regression
          yseq = this.linearRegression(xValues, yValues, xseq);
        } else if (method === 'gam' || (method === 'auto' && data.length > 1000)) {
          // Use polynomial regression for GAM-like behavior
          // k parameter controls the polynomial degree (capped at 10 to avoid overfitting)
          const degree = Math.min(k, 10);
          yseq = this.polynomialRegression(xValues, yValues, xseq, degree);
        } else {
          // Use LOESS-like smoothing
          yseq = this.loessSmoothing(xValues, yValues, xseq, span);
        }
        
        return { x: xseq, y: yseq };
      }
    } catch (error) {
      console.error('Error fitting model:', error);
      // Fallback to simple linear regression
      const xValues = data.map(row => parseFloat(row[xcol]));
      const yValues = data.map(row => parseFloat(row.value));
      
      const n = xValues.length;
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const xseq = Array.from({ length: Math.ceil(maxX - minX) + 1 }, (_, i) => minX + i);
      const yseq = xseq.map(x => slope * x + intercept);
      
      return { x: xseq, y: yseq };
    }
  }

  private extractRawData(data: any[], xcol: string): any {
    return {
      x: data.map(row => parseFloat(row[xcol])),
      y: data.map(row => parseFloat(row.value))
    };
  }

  // Enhanced statistical methods
  private linearRegression(x: number[], y: number[], xPred: number[]): number[] {
    // Simple linear regression: y = mx + b
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return xPred.map(xVal => slope * xVal + intercept);
  }
  
  private polynomialRegression(x: number[], y: number[], xPred: number[], degree: number): number[] {
    // Simple polynomial regression implementation
    const n = x.length;
    const coefficients = this.calculatePolynomialCoefficients(x, y, degree);
    
    return xPred.map(xVal => {
      let result = 0;
      for (let i = 0; i <= degree; i++) {
        result += coefficients[i] * Math.pow(xVal, i);
      }
      return result;
    });
  }

  private calculatePolynomialCoefficients(x: number[], y: number[], degree: number): number[] {
    // Polynomial regression using least squares
    const n = x.length;
    
    // Build the Vandermonde matrix
    const X: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j <= degree; j++) {
        row.push(Math.pow(x[i], j));
      }
      X.push(row);
    }
    
    // Calculate X^T * X
    const XtX: number[][] = [];
    for (let i = 0; i <= degree; i++) {
      XtX[i] = [];
      for (let j = 0; j <= degree; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += X[k][i] * X[k][j];
        }
        XtX[i][j] = sum;
      }
    }
    
    // Calculate X^T * y
    const Xty: number[] = [];
    for (let i = 0; i <= degree; i++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * y[k];
      }
      Xty[i] = sum;
    }
    
    // Solve XtX * coefficients = Xty using Gaussian elimination
    const coefficients = this.gaussianElimination(XtX, Xty);
    
    return coefficients;
  }
  
  private gaussianElimination(A: number[][], b: number[]): number[] {
    const n = A.length;
    const Ab: number[][] = A.map((row, i) => [...row, b[i]]);
    
    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(Ab[k][i]) > Math.abs(Ab[maxRow][i])) {
          maxRow = k;
        }
      }
      [Ab[i], Ab[maxRow]] = [Ab[maxRow], Ab[i]];
      
      // Make all rows below this one 0 in current column
      for (let k = i + 1; k < n; k++) {
        const factor = Ab[k][i] / Ab[i][i];
        for (let j = i; j <= n; j++) {
          Ab[k][j] -= factor * Ab[i][j];
        }
      }
    }
    
    // Back substitution
    const x: number[] = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = Ab[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= Ab[i][j] * x[j];
      }
      x[i] /= Ab[i][i];
    }
    
    return x;
  }

  private loessSmoothing(x: number[], y: number[], xPred: number[], span: number): number[] {
    // LOESS (Locally Weighted Scatterplot Smoothing)
    const n = x.length;
    
    return xPred.map(xVal => {
      // Calculate distances from xVal to all data points
      const distances = x.map(xi => Math.abs(xi - xVal));
      
      // Determine the number of neighbors based on span
      const numNeighbors = Math.max(2, Math.floor(span * n));
      
      // Get the distance to the k-th nearest neighbor
      const sortedDistances = [...distances].sort((a, b) => a - b);
      const maxDistance = sortedDistances[Math.min(numNeighbors - 1, n - 1)];
      
      // Tricube weight function
      const weights = distances.map(d => {
        if (maxDistance === 0) return 1;
        const u = d / maxDistance;
        return u <= 1 ? Math.pow(1 - Math.pow(u, 3), 3) : 0;
      });
      
      // Weighted least squares regression (linear fit)
      const sumW = weights.reduce((sum, w) => sum + w, 0);
      
      if (sumW === 0) {
        // Fallback to nearest point
        const nearestIdx = distances.indexOf(Math.min(...distances));
        return y[nearestIdx];
      }
      
      const meanX = weights.reduce((sum, w, i) => sum + w * x[i], 0) / sumW;
      const meanY = weights.reduce((sum, w, i) => sum + w * y[i], 0) / sumW;
      
      const numerator = weights.reduce((sum, w, i) => sum + w * (x[i] - meanX) * (y[i] - meanY), 0);
      const denominator = weights.reduce((sum, w, i) => sum + w * Math.pow(x[i] - meanX, 2), 0);
      
      if (denominator === 0) {
        return meanY;
      }
      
      const slope = numerator / denominator;
      const intercept = meanY - slope * meanX;
      
      return slope * xVal + intercept;
    });
  }

  private async generatePlotlyData(data: any[], xcol: string, pidcol: string, color?: string, linetype?: string): Promise<any> {
    try {
      if (this.webr) {
        try {
          // Use base R functions to create simple plot data
          const uniqueIds = Array.from(new Set(data.map(row => row[pidcol])));
          
          // Prepare data for R
          const rData = data.map(row => ({
            x: parseFloat(row[xcol]),
            y: parseFloat(row.value),
            pid: row[pidcol],
            color: color ? row[color] : undefined,
            linetype: linetype ? row[linetype] : undefined
          }));
          
          // Convert to R data frame
          const xValues = rData.map(d => d.x);
          const yValues = rData.map(d => d.y);
          const pidValues = rData.map(d => d.pid);
          
          await this.webr.evalR(`x <- c(${xValues.join(',')})`);
          await this.webr.evalR(`y <- c(${yValues.join(',')})`);
          await this.webr.evalR(`pid <- c(${pidValues.map(p => `"${p}"`).join(',')})`);
          await this.webr.evalR(`df <- data.frame(x = x, y = y, pid = pid)`);
          
          // Create simple base R plot data
          await this.webr.evalR(`
            plot_data <- list()
            unique_pids <- unique(df$pid)
            for(i in 1:length(unique_pids)) {
              subset_data <- df[df$pid == unique_pids[i], ]
              plot_data[[i]] <- list(
                x = subset_data$x,
                y = subset_data$y,
                name = as.character(unique_pids[i])
              )
            }
          `);
          
          // Get the plot data
          const plotDataResult = await this.webr.evalR('plot_data');
          const plotData = await plotDataResult.toJs();
          
          return {
            data: plotData,
            layout: {
              title: 'Individual Plots',
              xaxis: { title: xcol },
              yaxis: { title: 'Antibody titre' }
            }
          };
        } catch (error) {
          console.warn('WebR plotting failed, using JavaScript fallback:', error);
          // Fall through to JavaScript implementation
        }
      }
      
      // JavaScript fallback implementation
      {
        // Fallback to simple plotly data
        const traces: any[] = [];
        const uniqueIds = Array.from(new Set(data.map(row => row[pidcol])));
        
        uniqueIds.forEach(id => {
          const idData = data.filter(row => row[pidcol] === id);
          const trace: any = {
            x: idData.map(row => parseFloat(row[xcol])),
            y: idData.map(row => parseFloat(row.value)),
            type: 'scatter',
            mode: 'lines',
            name: id.toString()
          };
          
          if (color && idData[0][color]) {
            trace.line = { color: idData[0][color] };
          }
          
          traces.push(trace);
        });
        
        return {
          data: traces,
          layout: {
            title: 'Individual Plots',
            xaxis: { title: xcol },
            yaxis: { title: 'Antibody titre' }
          }
        };
      }
    } catch (error) {
      console.error('Error generating plotly data:', error);
      // Fallback to simple plotly data
      const traces: any[] = [];
      const uniqueIds = Array.from(new Set(data.map(row => row[pidcol])));
      
      uniqueIds.forEach(id => {
        const idData = data.filter(row => row[pidcol] === id);
        const trace: any = {
          x: idData.map(row => parseFloat(row[xcol])),
          y: idData.map(row => parseFloat(row.value)),
          type: 'scatter',
          mode: 'lines',
          name: id.toString()
        };
        
        if (color && idData[0][color]) {
          trace.line = { color: idData[0][color] };
        }
        
        traces.push(trace);
      });
      
      return {
        data: traces,
        layout: {
          title: 'Individual Plots',
          xaxis: { title: xcol },
          yaxis: { title: 'Antibody titre' }
        }
      };
    }
  }
}

export const serovizService = new SeroVizService();

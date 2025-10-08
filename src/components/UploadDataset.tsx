import Form from "react-bootstrap/Form";
import { Button, Col, OverlayTrigger, Tooltip } from "react-bootstrap";
import React, { useContext, useState } from "react";
import { ActionType, RootContext, RootDispatchContext } from "../RootContext";
import { dataService } from "../services/dataService";
import { isAlphaNumeric } from "../services/utils";
import { HelpCircle } from "lucide-react";

export default function UploadDataset() {
  const state = useContext(RootContext);
  const dispatch = useContext(RootDispatchContext);

  const [timeColumnHeader, setTimeColumnHeader] = useState("day");
  const [dataType, setDataType] = useState("surveillance");
  const [datasetName, setDatasetName] = useState("");
  const [validName, setValidName] = useState(true);
  const [selectedFile, selectFile] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<any[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);

  const onSelectTimeColumnHeader = (e: any) => setTimeColumnHeader(e.target.value);
  const onSelectDataType = (e: any) => setDataType(e.target.value);
  const onSelectDatasetName = (e: any) => {
    setDatasetName(e.target.value);
    setValidName(isAlphaNumeric(e.target.value));
  };

  const parseCSVPreview = (text: string): { headers: string[], rows: any[] } => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const rows = lines.slice(1, 6).map(line => { // Show first 5 rows
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    
    return { headers, rows };
  };

  const onSelectFile = async (event: any) => {
    if (event.currentTarget.files?.length) {
      dispatch({
        type: ActionType.UPLOAD_ERROR_DISMISSED,
        payload: null
      });
      const file = event.currentTarget.files[0];
      selectFile(file);
      setDatasetName(file.name.replace(".csv", ""));
      
      // Generate preview
      try {
        const text = await file.text();
        const { headers, rows } = parseCSVPreview(text);
        setFileHeaders(headers);
        setFilePreview(rows);
      } catch (error) {
        console.error('Error reading file:', error);
        setFileHeaders([]);
        setFilePreview([]);
      }
    }
  };

  const uploadNewFile = async (event: any) => {
    event.preventDefault();

    dispatch({
      type: ActionType.UPLOAD_ERROR_DISMISSED,
      payload: null
    });

    setIsUploading(true);
    if (!validName) {
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('xcol', timeColumnHeader);
    formData.append('name', datasetName);
    formData.append('series_type', dataType);

    const result = await dataService(state.language, dispatch).uploadDataset(formData);

    setIsUploading(false);

    if (result && result.status === 'success') {
      await dataService(state.language, dispatch).getDatasetNames();
    }
  };

  return (
    <Form.Group className={"mb-3"}>
      <h4>Upload new dataset</h4>
      <Form.Control
        type="file"
        name="upload-file"
        data-testid={"upload-file"}
        id={"upload-file"}
        disabled={isUploading}
        onChange={onSelectFile}
        accept={".csv"}
      />
      <Form.Text style={{ fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        File must be in CSV format. Required columns:<br/>
        • <strong>biomarker</strong> (name of the biomarker as a string, e.g., "sVNT", "IgG")<br/>
        • <strong>value</strong> (the biomarker measurement value as a number)<br/>
        • <strong>[Time Column]</strong> (specify value below)
      </Form.Text>
      
      {/* File Preview */}
      {filePreview.length > 0 && (
        <div className="mt-3 mb-3">
          <h6>File Preview</h6>
          <p className="text-muted small">First 5 rows of your CSV file:</p>
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead className="table-light">
                <tr>
                  {fileHeaders.map((header, index) => (
                    <th key={index} className="text-nowrap">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filePreview.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {fileHeaders.map((header, colIndex) => (
                      <td key={colIndex} className="text-nowrap">
                        {row[header] || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2">
            <small className="text-muted" style={{ fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              <strong>Required columns:</strong> 
              <strong>biomarker</strong> (biomarker name as string), 
              <strong>value</strong> (biomarker measurement as number), 
              <strong>{timeColumnHeader || 'day'}</strong> (time column)
            </small>
          </div>
        </div>
      )}
      
      <Form.Group className={"row mb-3 mt-3"}>
        <Form.Label column sm={3}>
          Name
          <OverlayTrigger
            placement="right"
            overlay={
              <Tooltip id="dataset-name-tooltip">
                Optional name for this dataset; can only contain alphanumeric characters and underscores. If not specified, the filename will be used.
              </Tooltip>
            }
          >
            <HelpCircle size={16} className="ms-1" style={{ cursor: 'help', color: '#6c757d' }} />
          </OverlayTrigger>
        </Form.Label>
        <Col sm={6}>
          <Form.Control
            type={"text"}
            data-testid={"dataset-name"}
            placeholder={"dataset name"}
            onChange={onSelectDatasetName}
            value={datasetName}
            className={!validName ? "is-invalid" : ""}
          />
          <div className={"invalid-feedback"}>
            Dataset name can only contain alphanumeric characters and underscores.
          </div>
        </Col>
      </Form.Group>
      <Form.Group className={"row mb-3"}>
        <Form.Label column sm={3}>
          Time column
          <OverlayTrigger
            placement="right"
            overlay={
              <Tooltip id="time-column-tooltip">
                Data should be in the form of a time series and by default we expect the indices of this series to be given in a column called 'day'. If you want to index your time series by a different value, e.g. time since last exposure, you can specify that here. Numeric and date type values are supported.
              </Tooltip>
            }
          >
            <HelpCircle size={16} className="ms-1" style={{ cursor: 'help', color: '#6c757d' }} />
          </OverlayTrigger>
        </Form.Label>
        <Col sm={6}>
          <Form.Control
            type={"text"}
            placeholder={"name of column"}
            onChange={onSelectTimeColumnHeader}
            value={timeColumnHeader}
          />
        </Col>
      </Form.Group>
      <Form.Group className={"row mb-3"}>
        <Form.Label column sm={3}>
          Time series type
          <OverlayTrigger
            placement="right"
            overlay={
              <Tooltip id="time-series-type-tooltip">
                <strong>Surveillance:</strong> Absolute time series where the time variable is based on absolute calendar date (e.g., day of study, calendar date).<br/><br/>
                <strong>Post-exposure:</strong> Relative time series where biomarker levels are measured for each individual relative to a known exposure (vaccination or infection). The time variable would be time since exposure.
              </Tooltip>
            }
          >
            <HelpCircle size={16} className="ms-1" style={{ cursor: 'help', color: '#6c757d' }} />
          </OverlayTrigger>
        </Form.Label>
        <Col sm={6}>
          <Form.Select onChange={onSelectDataType} value={dataType}>
            <option value={"surveillance"}>surveillance</option>
            <option value={"post-exposure"}>post-exposure</option>
          </Form.Select>
        </Col>
      </Form.Group>
      <div className={state.uploadError ? "invalid-feedback d-block" : "d-none"}>
        {state.uploadError && state.uploadError.detail}
      </div>
      <Button
        key="go-btn"
        variant="success"
        className={"mt-2 mb-3"}
        disabled={!validName || isUploading}
        type="submit"
        onClick={uploadNewFile}
      >
        Upload
      </Button>
    </Form.Group>
  );
}

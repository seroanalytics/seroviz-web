import React, { useContext } from "react";
import { Form, Row, Col, Alert } from "react-bootstrap";
import { ActionType, RootContext, RootDispatchContext } from "../RootContext";

export default function PlotOptions() {
  const state = useContext(RootContext);
  const dispatch = useContext(RootDispatchContext);

  if (!state.datasetMetadata) {
    return null;
  }

  const colorBy = state.datasetSettings[state.selectedDataset]?.colorBy || "biomarker";
  const facetBy = state.datasetSettings[state.selectedDataset]?.facetBy || "none";

  // Get all available columns except 'value'
  const availableColumns = ["biomarker", ...state.datasetMetadata.variables.map(v => v.name)];
  const colorOptions = ["none", ...availableColumns.filter(col => col !== "value")];
  const facetOptions = ["none", ...availableColumns.filter(col => col !== "value")];

  // Check if facet variable has too many groups
  const facetVariable = state.datasetMetadata.variables.find(v => v.name === facetBy);
  const showFacetWarning = facetBy !== "none" && facetVariable && facetVariable.levels.length > 100;

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: ActionType.SELECT_COLOR_BY,
      payload: e.target.value
    });
  };

  const handleFacetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: ActionType.SELECT_FACET_BY,
      payload: e.target.value
    });
  };

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Color by</Form.Label>
        <Form.Select value={colorBy} onChange={handleColorChange}>
          {colorOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Facet by</Form.Label>
        <Form.Select value={facetBy} onChange={handleFacetChange}>
          {facetOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Form.Select>
        {showFacetWarning && (
          <Alert variant="warning" className="mt-2 mb-0 py-2 px-2">
            This has more than 100 groups. Can you make sure this variable is categorical?
          </Alert>
        )}
      </Form.Group>
    </>
  );
}

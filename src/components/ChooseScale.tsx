import React, { useContext } from "react";
import { Form } from "react-bootstrap";
import { ActionType, RootContext, RootDispatchContext } from "../RootContext";

export default function ChooseScale() {
  const state = useContext(RootContext);
  const dispatch = useContext(RootDispatchContext);

  const handleScaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: ActionType.SELECT_SCALE,
      payload: e.target.value
    });
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>Scale</Form.Label>
      <Form.Select
        value={state.datasetSettings[state.selectedDataset]?.scale || "natural"}
        onChange={handleScaleChange}
      >
        <option value="natural">Natural</option>
        <option value="log">Log</option>
        <option value="log2">Log2</option>
      </Form.Select>
    </Form.Group>
  );
}

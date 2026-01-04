import React, { useContext } from "react";
import { Form } from "react-bootstrap";
import { ActionType, RootContext, RootDispatchContext } from "../RootContext";

export default function ChooseScale() {
  const state = useContext(RootContext);
  const dispatch = useContext(RootDispatchContext);

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: ActionType.SELECT_SCALE,
      payload: e.target.value
    });
  };

  const currentScale = state.datasetSettings[state.selectedDataset]?.scale || "natural";

  return (
    <Form.Group className="mb-3">
      <Form.Label>Transform</Form.Label>
      <div>
        <Form.Check
          type="radio"
          id="scale-natural"
          name="scale"
          label="Natural"
          value="natural"
          checked={currentScale === "natural"}
          onChange={handleScaleChange}
        />
        <Form.Check
          type="radio"
          id="scale-log"
          name="scale"
          label="Log"
          value="log"
          checked={currentScale === "log"}
          onChange={handleScaleChange}
        />
        <Form.Check
          type="radio"
          id="scale-log2"
          name="scale"
          label="Log2"
          value="log2"
          checked={currentScale === "log2"}
          onChange={handleScaleChange}
        />
      </div>
    </Form.Group>
  );
}

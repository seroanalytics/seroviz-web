import React from "react";
import { Form } from "react-bootstrap";

interface Props {
  selectedPlot: string;
  selectPlot: (plot: string) => void;
  seriesType: string;
}

export default function ChoosePlot({ selectedPlot, selectPlot, seriesType }: Props) {
  return (
    <Form.Group className="mb-3">
      <Form.Label>Plot type</Form.Label>
      <Form.Select
        value={selectedPlot}
        onChange={(e) => selectPlot(e.target.value)}
      >
        <option value="population">Population</option>
        <option value="individual">Individual</option>
      </Form.Select>
    </Form.Group>
  );
}

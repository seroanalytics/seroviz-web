import React from "react";
import { Form } from "react-bootstrap";

interface Props {
  selectedDataset: string;
}

export default function ChooseDataset({ selectedDataset }: Props) {
  return (
    <Form.Group className="mb-3">
      <Form.Label>Dataset</Form.Label>
      <Form.Control
        type="text"
        value={selectedDataset}
        readOnly
        className="bg-light"
      />
    </Form.Group>
  );
}

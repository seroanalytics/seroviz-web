import Form from 'react-bootstrap/Form';
import { Col, Row } from "react-bootstrap";
import React, { useContext } from "react";
import { RootContext } from "../RootContext";
import ChooseDataset from "./ChooseDataset";
import ChooseScale from "./ChooseScale";
import SplineOptions from "./SplineOptions";
import PlotOptions from "./PlotOptions";

export default function SideBar() {
  const state = useContext(RootContext);

  return (
    <Col xs="3" className="pt-3 border-1 border-end border-secondary" data-testid="sidebar">
      <Form>
        <fieldset>
          <ChooseDataset selectedDataset={state.selectedDataset} />
          <Row className={"mb-3"}>
            <Col>
              Time series type <br />
              <span className={"text-secondary"}>{state.datasetMetadata?.type}</span>
            </Col>
          </Row>
          <Row className={"mb-3"}>
            <Col>
              Detected biomarkers <br />
              <span className={"text-secondary"}>{state.datasetMetadata?.biomarkers.join(", ")}</span>
            </Col>
          </Row>
          <ChooseScale />
          <Form.Group className="mb-3">
            <Form.Label>Spline options</Form.Label>
            <SplineOptions />
          </Form.Group>
          <PlotOptions />
        </fieldset>
      </Form>
    </Col>
  );
}

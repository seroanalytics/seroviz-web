import Form from "react-bootstrap/Form";
import React, { useContext } from "react";
import { RootContext, RootDispatchContext } from "../RootContext";
import { Button, Card, Row, Col } from "react-bootstrap";
import { dataService } from "../services/dataService";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

function DatasetListItem({
  dataset,
  onSelectDataset,
  onRemoveDataset
}: {
  dataset: string;
  onSelectDataset: (d: string) => void;
  onRemoveDataset: (d: string) => void;
}) {
  return (
    <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
      <Card 
        className="h-100 border-0 shadow-sm"
        style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
        onClick={() => onSelectDataset(dataset)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }}
      >
        <Card.Body className="d-flex justify-content-between align-items-center p-3">
          <div className="flex-grow-1">
            <h6 className="mb-0 text-primary">{dataset}</h6>
          </div>
          <Button
            variant="link"
            size="sm"
            className="p-0 text-muted"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveDataset(dataset);
            }}
            style={{ minWidth: '20px', height: '20px' }}
          >
            <X size={16} />
          </Button>
        </Card.Body>
      </Card>
    </Col>
  );
}

export default function ListDatasets() {
  const state = useContext(RootContext);
  const dispatch = useContext(RootDispatchContext);
  const navigate = useNavigate();

  const onSelectData = (dataset: string) => {
    navigate("/dataset/" + dataset);
  };

  const onRemoveData = async (dataset: string) => {
    await dataService(state.language, dispatch).deleteDataset(dataset);
  };

  return (
    <Form.Group key="choose-dataset" className={"mb-5"}>
      <h4>Available datasets <small className="text-muted">(click name)</small></h4>
      <Row>
        {state.datasetNames.map((d: string) => (
          <DatasetListItem
            key={d}
            dataset={d}
            onSelectDataset={onSelectData}
            onRemoveDataset={onRemoveData}
          />
        ))}
      </Row>
    </Form.Group>
  );
}

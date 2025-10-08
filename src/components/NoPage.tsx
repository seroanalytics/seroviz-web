import React from "react";
import { Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function NoPage() {
  return (
    <Row className={"mt-5"}>
      <Col xs={12} sm={{ span: 6, offset: 3 }}>
        <div className="text-center">
          <h1>404</h1>
          <h4>Page Not Found</h4>
          <p>The page you're looking for doesn't exist.</p>
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </Col>
    </Row>
  );
}

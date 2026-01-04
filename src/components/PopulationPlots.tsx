import {useContext, useState} from "react";
import {RootContext} from "../RootContext";
import {Col, Row, Nav} from "react-bootstrap";
import LinePlot from "./LinePlot";

export function PopulationPlots() {

    const state = useContext(RootContext);
    const [activePage, setActivePage] = useState(0);
    
    const colorBy = state.datasetSettings[state.selectedDataset]?.colorBy || "biomarker";
    const facetBy = state.datasetSettings[state.selectedDataset]?.facetBy || "none";
    
    const biomarkers = state.datasetMetadata?.biomarkers || [];
    
    // Get facet levels if faceting is enabled
    let facetLevels: string[] = [];
    if (facetBy !== "none") {
        if (facetBy === "biomarker") {
            // Special case: facet by biomarker uses the biomarkers list
            facetLevels = biomarkers;
        } else {
            const facetVariable = state.datasetMetadata?.variables.find(v => v.name === facetBy);
            if (facetVariable) {
                facetLevels = facetVariable.levels.map(l => String(l));
            }
        }
    }

    // No faceting
    if (facetBy === "none" || facetLevels.length === 0) {
        return <Col sm={8}>
                <Row>
                    <Col>
                        <LinePlot biomarkers={biomarkers}
                                  colorBy={colorBy}
                                  facetBy="none"
                                  facetLevel={null}/>
                    </Col>
                </Row>
            </Col>
    }

    // With faceting - add "All" at the beginning
    const allFacets = ["All", ...facetLevels];
    const facetsPerPage = 20;
    const totalPages = Math.ceil(allFacets.length / facetsPerPage);
    const startIndex = activePage * facetsPerPage;
    const endIndex = Math.min(startIndex + facetsPerPage, allFacets.length);
    const currentPageFacets = allFacets.slice(startIndex, endIndex);

    return <Col sm={8}>
            {totalPages > 1 && (
                <Nav variant="tabs" className="mb-3">
                    {Array.from({length: totalPages}, (_, i) => (
                        <Nav.Item key={i}>
                            <Nav.Link 
                                active={activePage === i}
                                onClick={() => setActivePage(i)}
                            >
                                Page {i + 1}
                            </Nav.Link>
                        </Nav.Item>
                    ))}
                </Nav>
            )}
            <Row>
                {currentPageFacets.map((level, i) => <Col key={i} xs={12} md={6} lg={4} className="mb-3">
                    <LinePlot biomarkers={biomarkers}
                              colorBy={colorBy}
                              facetBy={level === "All" ? "none" : facetBy}
                              facetLevel={level === "All" ? null : level}/>
                </Col>)}
            </Row>
        </Col>
}

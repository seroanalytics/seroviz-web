import React, {useContext, useState} from 'react';
import Plot from 'react-plotly.js';
import {RootContext, RootDispatchContext} from "../RootContext";
import {DataSeries, ErrorDetail} from "../generated";
import {dataService} from "../services/dataService";
import {toFilename} from "../services/utils";
import {useDebouncedEffect} from "../hooks/useDebouncedEffect";
import PlotError from "./PlotError";
import PlotWarnings from "./PlotWarnings";
import {Dict} from "../types";

interface Props {
    biomarkers: string[]
    colorBy: string
    facetBy: string
    facetLevel: string | null
}

const colors = [
    '#1f77b4',  // muted blue
    '#ff7f0e',  // safety orange
    '#2ca02c',  // cooked asparagus green
    '#d62728',  // brick red
    '#9467bd',  // muted purple
    '#8c564b',  // chestnut brown
    '#e377c2',  // raspberry yogurt pink
    '#7f7f7f',  // middle gray
    '#bcbd22',  // curry yellow-green
    '#17becf'   // blue-teal
];

export default function LinePlot({
                                     biomarkers,
                                     colorBy,
                                     facetBy,
                                     facetLevel
                                 }: Props) {

    const state = useContext(RootContext);
    const dispatch = useContext(RootDispatchContext);

    const [allSeriesData, setAllSeriesData] = useState<Map<string, DataSeries | null>>(new Map());
    const [plotError, setPlotError] = useState<ErrorDetail | null>(null);

    const covariateSettings = state.datasetSettings[state.selectedDataset].covariateSettings;
    const scale = state.datasetSettings[state.selectedDataset].scale;
    const splineSettings = state.datasetSettings[state.selectedDataset].splineSettings;
    
    // Build facet filter
    const facetFilter = facetBy !== "none" && facetLevel ? `${facetBy}:${facetLevel}` : "";
    
    // When faceting by biomarker, only fetch that specific biomarker
    const biomarkersToFetch = facetBy === "biomarker" && facetLevel ? [facetLevel] : biomarkers;
    
    useDebouncedEffect(() => {
        setPlotError(null);
        const fetchData = async () => {
            const newSeriesData = new Map<string, DataSeries | null>();
            
            console.log('Fetching data with spline settings:', splineSettings);
            console.log('ColorBy:', colorBy, 'FacetBy:', facetBy);
            
            // Build disaggregate parameter for the backend
            const disaggregate = (colorBy !== "none" && colorBy !== "biomarker") ? colorBy : undefined;
            
            for (const biomarker of biomarkersToFetch) {
                const result = await dataService(state.language, dispatch)
                    .getDataSeries(state.selectedDataset,
                        biomarker, facetFilter, covariateSettings, scale, splineSettings, state.selectedDatasetIsPublic, disaggregate);

                if (result && result.data) {
                    newSeriesData.set(biomarker, result.data);
                } else {
                    newSeriesData.set(biomarker, null);
                }
                if (result && result.errors?.length) {
                    setPlotError(result.errors[0]);
                }
            }
            
            setAllSeriesData(newSeriesData);
        }
        fetchData();
    }, [state.language, dispatch, state.selectedDataset, biomarkersToFetch.join(','), facetFilter, colorBy, covariateSettings, scale, splineSettings.method, splineSettings.span, splineSettings.k, state.selectedDatasetIsPublic], 100);

    let series: any[] = [];
    const warnings: Dict<string[]> = {};

    // Group data by color variable
    const colorGroups = new Map<string, any[]>();
    
    for (const [biomarker, seriesData] of allSeriesData.entries()) {
        if (seriesData && seriesData.length > 0) {
            seriesData.forEach(s => {
                let colorKey: string;
                if (colorBy === "none") {
                    colorKey = "all";
                } else if (colorBy === "biomarker") {
                    colorKey = biomarker;
                } else {
                    colorKey = s.name !== "all" ? s.name : biomarker;
                }
                
                if (!colorGroups.has(colorKey)) {
                    colorGroups.set(colorKey, []);
                }
                colorGroups.get(colorKey)!.push({
                    biomarker,
                    series: s
                });
            });
        }
    }

    // Create plot traces
    let colorIndex = 0;
    for (const [colorKey, items] of colorGroups.entries()) {
        const groupColor = colors[colorIndex % colors.length];
        let isFirstInGroup = true;
        
        items.forEach(({ biomarker, series: s }) => {
            if (s.warnings && s.warnings.length > 0) {
                warnings[colorKey] = s.warnings;
            }
            
            // Add model line
            if (s.model && s.model.x && s.model.y) {
                series.push({
                    x: s.model.x,
                    y: s.model.y,
                    name: colorKey,
                    legendgroup: colorKey,
                    type: "scatter",
                    mode: "line",
                    line: {shape: 'spline', width: 2, color: groupColor},
                    showlegend: colorBy !== "none" && isFirstInGroup,
                    marker: {color: groupColor}
                });
            }
            
            // Add raw data points
            series.push({
                x: s.raw.x,
                y: s.raw.y,
                name: colorKey,
                legendgroup: colorKey,
                type: "scatter",
                mode: "markers",
                showlegend: false,
                marker: {color: groupColor, opacity: 0.5}
            });
            
            isFirstInGroup = false;
        });
        
        colorIndex++;
    }

    let title = facetLevel && facetBy !== "none" ? `${facetBy}: ${String(facetLevel)}` : facetBy === "none" ? "All" : "All";
    
    console.log('LinePlot rendering:', { facetBy, facetLevel, title, colorBy });

    return <div>{series.length > 0 && <Plot
        data={series}
        layout={{
            title: {
                text: title,
                font: { size: 14, family: 'Arial, sans-serif' }
            },
            showlegend: colorBy !== "none",
            legend: {
                orientation: 'v',
                x: 1.02,
                y: 1,
                font: { size: 10 }
            },
            xaxis: {
                title: {
                    text: state.datasetMetadata?.xcol,
                    font: { size: 11 }
                },
                tickfont: { size: 9 },
                showline: true,
                linewidth: 1.5,
                linecolor: '#333',
                mirror: false,
                showgrid: true,
                gridwidth: 1,
                gridcolor: '#e0e0e0',
                zeroline: false
            },
            yaxis: {
                title: {
                    text: scale === "natural" ? "value" : `${scale} value`,
                    font: { size: 11 }
                },
                tickfont: { size: 9 },
                showline: true,
                linewidth: 1.5,
                linecolor: '#333',
                mirror: false,
                showgrid: true,
                gridwidth: 1,
                gridcolor: '#e0e0e0',
                zeroline: false
            },
            margin: { l: 60, r: 100, t: title ? 40 : 20, b: 50 },
            paper_bgcolor: 'white',
            plot_bgcolor: 'white',
            font: { family: 'Arial, sans-serif', color: '#333' }
        }}
        config={{toImageButtonOptions: {filename: toFilename(title || 'plot')}}}
        useResizeHandler={true}
        style={{minWidth: "300px", width: "100%", height: "300px"}}
    />}{plotError &&
        <PlotError title={facetLevel || ""} error={plotError}/>
    } <PlotWarnings warnings={warnings}/>
    </div>
}

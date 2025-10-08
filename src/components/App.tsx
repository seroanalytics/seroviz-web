import React, { useEffect, useReducer } from 'react';
import { Container } from "react-bootstrap";
import TopNav from "./TopNav";
import usePersistedState from "../hooks/usePersistedState";
import {
  initialState,
  RootContext,
  RootDispatchContext
} from "../RootContext";
import AppError from "./AppError";
import { dataService } from "../services/dataService";
import { rootReducer } from "../reducers/rootReducer";
import ExploreDataset from "./ExploreDataset";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import FAQ from "./FAQ";
import NoPage from "./NoPage";
import PublicDatasets from "./PublicDatasets";
import { ManageDatasets } from "./ManageDatasets";

export default function App() {
  const [theme, setTheme] = usePersistedState<string>("theme", "dark");
  const [state, dispatch] = useReducer(rootReducer, initialState);

  useEffect(() => {
    // Apply theme to body immediately
    document.body.setAttribute("data-bs-theme", theme as string);
  }, [theme]);

  useEffect(() => {
    // Initialize WebR and load initial data
    const initializeApp = async () => {
      try {
        await dataService("en", dispatch).refreshSession();
        await dataService("en", dispatch).getDatasetNames();
        await dataService("en", dispatch).getPublicDatasets();
      } catch (error) {
        console.error("Failed to initialize app:", error);
      }
    };

    initializeApp();
  }, []);

  return (
    <RootContext.Provider value={state}>
      <RootDispatchContext.Provider value={dispatch}>
        <div data-bs-theme={theme}>
          <TopNav 
            theme={theme as string}
            setTheme={setTheme as (newState: string) => void}
          />
          {state.genericErrors.map((e, index) => (
            <AppError error={e} key={"error" + index} />
          ))}
          <Container fluid>
            <BrowserRouter basename="/seroviz-web">
              <Routes>
                <Route path="/" element={<ManageDatasets />} />
                <Route path="/dataset/:name" element={<ExploreDataset isPublic={false} />} />
                <Route path="/dataset/public/:name" element={<ExploreDataset isPublic={true} />} />
                <Route path="/public" element={<PublicDatasets />} />
                <Route path="FAQ" element={<FAQ />} />
                <Route path="*" element={<NoPage />} />
              </Routes>
            </BrowserRouter>
          </Container>
        </div>
      </RootDispatchContext.Provider>
    </RootContext.Provider>
  );
}

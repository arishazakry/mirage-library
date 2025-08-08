"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import GraphVisualization from "./index";
import NetworkControls, { defaultParameter } from "./NetworkControls";
import { emptyGraph } from ".";

const defaultParameters = {
  threshold: 1,
  metadataVariable: "artists",
  maxNodes: 100,
  communityDetection: false,
};

export default function NetworkVisualizationContainer({ 
  data=emptyGraph,
  fetchNetworkData=()=>{},
}) {
  const [parameters, setParameters] = useState(defaultParameters);
  const [layoutKey, setLayoutKey] = useState(0); // Force re-render key
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Monitor container size changes (important for dockview panels)
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
        // Trigger layout update when container resizes
        setLayoutKey(prev => prev + 1);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Force refresh when data changes
  useEffect(() => {
    setLayoutKey(prev => prev + 1);
  }, [data]);

  const handleParameterChange = useCallback((newParameters) => {
    const updatedParams = { ...parameters, ...newParameters };
    setParameters(updatedParams);
    fetchNetworkData(updatedParams);
    // Force layout restart
    setLayoutKey(prev => prev + 1);
  }, [parameters, fetchNetworkData]);

  const handleRefresh = useCallback(() => {
    setParameters(defaultParameter);
    fetchNetworkData(defaultParameter);
    setLayoutKey(prev => prev + 1);
  }, [fetchNetworkData]);

  const handleLayoutStart = useCallback(() => {
    // Force re-initialization of the graph layout
    setLayoutKey(prev => prev + 1);
  }, []);

  const handleLayoutStop = useCallback(() => {
    // Optional: handle layout completion
  }, []);

  return (
    <div ref={containerRef} className="flex-col h-full w-full">
      <NetworkControls
        parameters={parameters}
        onParameterChange={handleParameterChange}
        onRefresh={handleRefresh}
        // loading={loading}
        // executionTime={executionTime}
      />
      <div className="flex-1 min-h-0"> {/* Ensure proper flex sizing */}
        <GraphVisualization
          key={layoutKey} // Force re-mount when layout needs updating
          data={data}
          threshold={parameters.threshold}
          communityDetection={parameters.communityDetection}
          containerSize={containerSize} // Pass container size if component supports it
          onLayoutStart={handleLayoutStart}
          onLayoutStop={handleLayoutStop}
        />
      </div>
    </div>
  );
}
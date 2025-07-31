"use client";

import { useState, useEffect, useCallback } from "react";
import GraphVisualization from "./index";
import NetworkControls from "./NetworkControls";
import { emptyGraph } from ".";

const defaultParameters = {
  threshold: 1,
  metadataVariable: "artists",
  maxNodes: 50,
  communityDetection: false,
};

export default function NetworkVisualizationContainer({ 
  data=emptyGraph,
  fetchNetworkData=()=>{},
}) {
  const [parameters, setParameters] = useState(defaultParameters);
//   const [loading, setLoading] = useState(false);
//   const [executionTime, setExecutionTime] = useState(null);

  const handleParameterChange = useCallback((newParameters) => {
    const updatedParams = { ...parameters, ...newParameters };
    setParameters(updatedParams);
    fetchNetworkData(updatedParams);
  }, [parameters, fetchNetworkData]);

  const handleRefresh = useCallback(() => {
    fetchNetworkData();
  }, [fetchNetworkData]);
        return <div className="flex-col">
             <NetworkControls
                parameters={parameters}
                onParameterChange={handleParameterChange}
                onRefresh={handleRefresh}
                // loading={loading}
                // executionTime={executionTime}
            />
            <GraphVisualization
                data={data}
                threshold ={parameters.threshold}
                communityDetection={parameters.communityDetection}
                // onLayoutStart={}
                // onLayoutStop={}
            />
        </div>
}
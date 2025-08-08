"use client";

import { useState, useEffect } from "react";
export const defaultParameter = {
    threshold: 1,
    metadataVariable: "artists",
    maxNodes: 100,
    communityDetection: false,
  };
export default function NetworkControls({
  parameters = {
    threshold: 1,
    metadataVariable: "artists",
    maxNodes: 100,
    communityDetection: false,
  },
  onParameterChange,
  onRefresh,
  loading = false,
  executionTime = null,
  graphRef = null, // Optional ref to graph component for layout controls
}) {
  const [localThreshold, setLocalThreshold] = useState(parameters.threshold);
  const [localMaxNodes, setLocalMaxNodes] = useState(parameters.maxNodes);
  const [localCommunityDetection, setLocalCommunityDetection] = useState(parameters.communityDetection);
  const [localMetadataVariable, setLocalMetadataVariable] = useState(parameters.metadataVariable);

  // Update local state when parameters change
  useEffect(() => {
    setLocalThreshold(parameters.threshold);
    setLocalMaxNodes(parameters.maxNodes);
    setLocalCommunityDetection(parameters.communityDetection);
    setLocalMetadataVariable(parameters.metadataVariable);
  }, [parameters]);

  const handleParameterUpdate = () => {
    if (onParameterChange) {
      onParameterChange({
        threshold: localThreshold,
        maxNodes: localMaxNodes,
        communityDetection: localCommunityDetection,
        metadataVariable: localMetadataVariable,
      });
    }
  };

  const handleStartLayout = () => {
    if (graphRef?.current?.startLayout) {
      graphRef.current.startLayout();
    }
  };

  const handleStopLayout = () => {
    if (graphRef?.current?.stopLayout) {
      graphRef.current.stopLayout();
    }
  };

  const hasChanges = () => {
    return (
      localThreshold !== parameters.threshold ||
      localMaxNodes !== parameters.maxNodes ||
      localCommunityDetection !== parameters.communityDetection ||
      localMetadataVariable !== parameters.metadataVariable
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Network Controls
          </h3>
          <p className="text-sm text-gray-600">
            Configure network visualization parameters
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {executionTime && (
            <span className="text-sm text-gray-500">
              Generated in {executionTime}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metadata Variable Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Network Type
          </label>
          <select
            value={localMetadataVariable}
            onChange={(e) => setLocalMetadataVariable(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="artists">Artists</option>
            <option value="genres">Genres</option>
            <option value="timbres">Timbres</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Type of entities to connect
          </p>
        </div>

        {/* Threshold Control */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Edge Threshold: {localThreshold}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={localThreshold}
            onChange={(e) => setLocalThreshold(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>10</span>
          </div>
          <p className="text-xs text-gray-500">
            Minimum connection strength
          </p>
        </div>

        {/* Max Nodes Control */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Nodes: {localMaxNodes}
          </label>
          <input
            type="range"
            min="10"
            max="100"
            step="10"
            value={localMaxNodes}
            onChange={(e) => setLocalMaxNodes(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10</span>
            <span>100</span>
          </div>
          <p className="text-xs text-gray-500">
            Maximum nodes to display
          </p>
        </div>

        {/* Community Detection Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Community Detection
          </label>
          <div className="flex items-center space-x-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localCommunityDetection}
                onChange={(e) => setLocalCommunityDetection(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm text-gray-700">
                {localCommunityDetection ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Group nodes by community
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
        <button
          onClick={handleParameterUpdate}
          disabled={loading || !hasChanges()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{loading ? "Updating..." : "Update Network"}</span>
        </button>
        
        {hasChanges() && (
          <button
            onClick={() => {
              setLocalThreshold(parameters.threshold);
              setLocalMaxNodes(parameters.maxNodes);
              setLocalCommunityDetection(parameters.communityDetection);
              setLocalMetadataVariable(parameters.metadataVariable);
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Reset</span>
          </button>
        )}

        {/* Layout Controls (if graph ref is provided) */}
        {graphRef && (
          <>
            <button
              onClick={handleStartLayout}
              disabled={isLayoutRunning}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-9L15 5M9 9l6 6" />
              </svg>
              <span>{isLayoutRunning ? "Layout Running..." : "Start Layout"}</span>
            </button>
            
            <button
              onClick={handleStopLayout}
              disabled={!isLayoutRunning}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l6 6m0-6l-6 6" />
              </svg>
              <span>Stop Layout</span>
            </button>
          </>
        )}
      </div>

      {/* Parameter Summary */}
      <div className="bg-gray-50 p-3 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Configuration</h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div><span className="font-medium">Type:</span> {parameters.metadataVariable}</div>
          <div><span className="font-medium">Threshold:</span> {parameters.threshold}</div>
          <div><span className="font-medium">Max Nodes:</span> {parameters.maxNodes}</div>
          <div><span className="font-medium">Communities:</span> {parameters.communityDetection ? "Yes" : "No"}</div>
        </div>
      </div>
    </div>
  );
}
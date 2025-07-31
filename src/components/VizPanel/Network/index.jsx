"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import Sigma from "sigma";
import Graph from "graphology";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import { extent, scaleSqrt, scaleOrdinal, schemeCategory10 } from "d3";

export const emptyGraph = {
  nodes: [],
  edges: [],
};

// Community color scheme
const communityColors = scaleOrdinal(schemeCategory10);

const GraphVisualization = forwardRef(({ 
  data = emptyGraph, 
  threshold = 1,
  communityDetection = false,
  onLayoutStart,
  onLayoutStop
}, ref) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const layoutRef = useRef(null);
  const [isLayoutRunning, setIsLayoutRunning] = useState(false);
  const [networkStats, setNetworkStats] = useState({});

  const startLayout = () => {
    if (layoutRef.current && !isLayoutRunning) {
      layoutRef.current.start();
      setIsLayoutRunning(true);
      onLayoutStart?.();
      
      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (layoutRef.current) {
          layoutRef.current.stop();
          setIsLayoutRunning(false);
          onLayoutStop?.();
        }
      }, 10000);
    }
  };

  const stopLayout = () => {
    if (layoutRef.current && isLayoutRunning) {
      layoutRef.current.stop();
      setIsLayoutRunning(false);
      onLayoutStop?.();
    }
  };

  // Expose layout controls to parent component via ref
  useImperativeHandle(ref, () => ({
    startLayout,
    stopLayout,
    isLayoutRunning,
  }), [isLayoutRunning]);

  useEffect(() => {
    if (!data?.nodes?.length || !containerRef.current) return;

    // Clean up previous instances
    if (rendererRef.current) {
      rendererRef.current.kill();
    }
    if (layoutRef.current) {
      layoutRef.current.stop();
    }

    const graph = new Graph();
    
    // Calculate size scale
    const sizescale = scaleSqrt()
      .domain(extent(data.nodes, (d) => d.size))
      .range([3, 15]);

    // Add nodes with community coloring if available
    data.nodes.forEach((node) => {
      const nodeColor = communityDetection && node.community !== undefined 
        ? communityColors(node.community)
        : "#666";
        
      graph.addNode(node.id, {
        label: node.label || node.id,
        size: sizescale(node.size || 1),
        color: nodeColor,
        x: Math.random() * 100,
        y: Math.random() * 100,
        community: node.community,
        originalSize: node.size,
        genres: node.genres || [],
      });
    });

    // Add edges filtered by threshold
    const filteredEdges = data.edges.filter((edge) => +edge.weight >= threshold);
    
    filteredEdges.forEach((edge) => {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        graph.addEdge(edge.source, edge.target, {
          label: `${edge.weight}`,
          size: Math.max(0.5, Math.min(5, edge.weight / 2)),
          color: "#ccc",
          weight: edge.weight,
        });
      }
    });

    // Calculate network statistics
    const stats = {
      nodes: graph.order,
      edges: graph.size,
      density: graph.size / (graph.order * (graph.order - 1) / 2),
      communities: communityDetection ? new Set(data.nodes.map(n => n.community)).size : 0,
      avgDegree: graph.size * 2 / graph.order,
    };
    setNetworkStats(stats);

    // Create renderer
    const renderer = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      defaultNodeColor: "#666",
      defaultEdgeColor: "#ccc",
      labelColor: { color: "#000" },
      labelSize: 12,
      labelWeight: "bold",
      enableEdgeClickEvents: true,
      enableEdgeWheelEvents: true,
    });

    // Add hover effects
    renderer.on("enterNode", ({ node }) => {
      const nodeData = graph.getNodeAttributes(node);
      // Highlight connected nodes and edges
      const neighbors = new Set(graph.neighbors(node));
      
      graph.forEachNode((n, attributes) => {
        if (n === node || neighbors.has(n)) {
          graph.setNodeAttribute(n, "highlighted", true);
        } else {
          graph.setNodeAttribute(n, "color", "#ddd");
          graph.setNodeAttribute(n, "highlighted", false);
        }
      });
      
      graph.forEachEdge((edge, attributes) => {
        if (graph.hasExtremity(edge, node)) {
          graph.setEdgeAttribute(edge, "color", "#000");
          graph.setEdgeAttribute(edge, "size", attributes.size * 2);
        } else {
          graph.setEdgeAttribute(edge, "color", "#eee");
        }
      });
      
      renderer.refresh();
    });

    renderer.on("leaveNode", ({ node }) => {
      // Reset colors
      data.nodes.forEach((n) => {
        const originalColor = communityDetection && n.community !== undefined 
          ? communityColors(n.community)
          : "#666";
        graph.setNodeAttribute(n.id, "color", originalColor);
        graph.setNodeAttribute(n.id, "highlighted", false);
      });
      
      graph.forEachEdge((edge, attributes) => {
        graph.setEdgeAttribute(edge, "color", "#ccc");
        graph.setEdgeAttribute(edge, "size", attributes.weight ? Math.max(0.5, Math.min(5, attributes.weight / 2)) : 1);
      });
      
      renderer.refresh();
    });

    // Create layout
    const layout = new FA2Layout(graph, { 
      settings: { 
        slowDown: 10,
        strongGravityMode: true,
        gravity: 0.05,
        scalingRatio: 10,
        edgeWeightInfluence: 1.5,
      } 
    });

    rendererRef.current = renderer;
    layoutRef.current = layout;

    return () => {
      if (layoutRef.current) {
        layoutRef.current.stop();
      }
      if (rendererRef.current) {
        rendererRef.current.kill();
      }
      setIsLayoutRunning(false);
    };
  }, [data, threshold, communityDetection]);

  if (!data?.nodes?.length) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No network data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Network Statistics */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h3 className="text-lg font-semibold mb-2">Network Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
          <div>
            <span className="font-medium">Nodes:</span> {networkStats.nodes}
          </div>
          <div>
            <span className="font-medium">Edges:</span> {networkStats.edges}
          </div>
          <div>
            <span className="font-medium">Density:</span> {(networkStats.density || 0).toFixed(3)}
          </div>
          <div>
            <span className="font-medium">Avg Degree:</span> {(networkStats.avgDegree || 0).toFixed(1)}
          </div>
          {communityDetection && (
            <div>
              <span className="font-medium">Communities:</span> {networkStats.communities}
            </div>
          )}
        </div>
      </div>

      {/* Layout Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={startLayout}
            disabled={isLayoutRunning}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {isLayoutRunning ? "Layout Running..." : "Start Layout"}
          </button>
          <button
            onClick={stopLayout}
            disabled={!isLayoutRunning}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
          >
            Stop Layout
          </button>
        </div>
      </div>

      {/* Graph Container */}
      <div className="bg-white rounded-lg shadow">
        <div ref={containerRef} style={{ height: "600px", width: "100%" }} />
      </div>

      {/* Legend for Community Detection */}
      {communityDetection && data.communities && (
        <div className="bg-white p-4 rounded-lg shadow mt-4">
          <h3 className="text-lg font-semibold mb-2">Community Legend</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(data.nodes.map(n => n.community))).map(communityId => (
              <div key={communityId} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: communityColors(communityId) }}
                />
                <span className="text-sm">Community {communityId}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

GraphVisualization.displayName = 'GraphVisualization';

export default GraphVisualization;

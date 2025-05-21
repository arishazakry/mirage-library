"use client";

import { useEffect, useRef } from "react";
import Sigma from "sigma";
import Graph from "graphology";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import { extent, scaleSqrt } from "d3";

const emptyGraph = {
  nodes: [],
  edges: [],
};

export default function GraphClient({ data = emptyGraph, threshold = 1 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data?.nodes?.length || !data?.edges?.length) return;

    const graph = new Graph();
    const sizescale = scaleSqrt()
      .domain(extent(data.nodes, (d) => d.size))
      .range([2, 10]);
    // Add nodes with optional name and size
    data.nodes.forEach((node) => {
      graph.addNode(node.id, {
        label: node.label || node.id,
        size: sizescale(node.size || 1),
        x: Math.random(),
        y: Math.random(),
      });
    });

    // Add edges filtered by threshold
    data.edges
      .filter((edge) => +edge.weight >= threshold)
      .forEach((edge) => {
        if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
          graph.addEdge(edge.source, edge.target, {
            label: `${edge.weight}`,
            size: edge.weight,
          });
        }
      });

    // circular.assign(graph); // layout
    const renderer = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
    });
    const layout = new FA2Layout(graph, { settings: { slowDown: 10 } });
    layout.start();

    // Stop after 5 seconds
    const stopTimer = setTimeout(() => layout.stop(), 5000);

    return () => {
      layout.stop();
      clearTimeout(stopTimer);
      renderer.kill();
    };
  }, [data, threshold]);

  return <div ref={containerRef} style={{ height: "600px", width: "100%" }} />;
}

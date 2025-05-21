"use client";

import { useEffect, useRef } from "react";
import Sigma from "sigma";
import Graph from "graphology";
import { circular } from "graphology-layout";
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

    circular.assign(graph); // layout
    const renderer = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
    });

    return () => renderer.kill();
  }, [data, threshold]);

  return <div ref={containerRef} style={{ height: "600px", width: "100%" }} />;
}

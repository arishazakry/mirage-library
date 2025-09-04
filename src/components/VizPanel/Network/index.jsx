"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import Sigma from "sigma";
import { downloadAsImage, toBlob } from "@sigma/export-image";
import Graph from "graphology";
import { extent, scaleSqrt, scaleOrdinal, schemeCategory10,color as d3color } from "d3";
import { debounce } from "lodash";
import { Button } from "@/components/ui/button";
import louvain from "graphology-communities-louvain";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { bindWebGLLayer, createContoursProgram } from "@sigma/layer-webgl";
import NodeHaloProgram from "./NodeHaloProgram";
import { createNodeCompoundProgram, NodePointProgram } from "sigma/rendering";
import { useTheme } from "next-themes";
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";

export const emptyGraph = {
  nodes: [],
  edges: [],
};

// Community color scheme
const communityc = scaleOrdinal(schemeCategory10);
const communityColors = (communityId)=>{
   if (communityId === -1) {
      // "Other" category - use gray color
      return "#999";
    } else {
      // Regular community - use color from scheme
      return communityc(communityId);
    }
}

// Function to perform community detection with specified number of communities
const detectCommunities = (graph, numCommunities) => {
  const communities = louvain(graph);
  
  // Get all unique communities
  const uniqueCommunities = new Set(Object.values(communities));

  // Calculate community sizes
  const communitySizes = {};
  Object.values(communities).forEach(community => {
    communitySizes[community] = (communitySizes[community] || 0) + 1;
  });

  if (uniqueCommunities.size <= numCommunities) {
    return { communitySizes, communities };
  }

  // Sort and keep top
  const sortedCommunities = Object.entries(communitySizes)
    .sort((a, b) => b[1] - a[1])
    .map(([community]) => parseInt(community));

  const otherCommunities = sortedCommunities.slice(numCommunities);
  const communityMapping = {};
  otherCommunities.forEach(c => { communityMapping[c] = -1; });

  communitySizes[-1] = 0;
  otherCommunities.forEach(d => {
    communitySizes[-1] += communitySizes[d];
    delete communitySizes[d];
  });

  const finalCommunities = {};
  graph.forEachNode(node => {
    let c = communities[node];
    if (communityMapping[c] !== undefined) c = communityMapping[c];
    finalCommunities[node] = c;
  });

  return { communitySizes, communities: finalCommunities };
};


const GraphVisualization = forwardRef(({ 
  data = emptyGraph, 
  threshold = 1,
  communityDetection = false,
  numCommunities = 4,
  onLayoutStart,
  onLayoutStop
}, ref) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const layoutRef = useRef(null);
  const isRunningRef = useRef(false);
  const [isLayoutRunning, setIsLayoutRunning] = useState(false);
  const [communitySizes, setCommunitySizes] = useState({});
  const [communities, setCommunities] = useState({});
  const [networkStats, setNetworkStats] = useState({});
  const [graph, setGraph] = useState(null);
  
  // Drag and drop state with force modulation
  const dragStateRef = useRef({
    isDragging: false,
    draggedNode: null,
    dragStartTime: null
  });

  const startLayout = useCallback(() => {
    
    if (layoutRef.current && !isRunningRef.current) {
      try {
        isRunningRef.current = true;
        setIsLayoutRunning(true);
        onLayoutStart?.();
        console.log("Layout started successfully");
        
        // Start the layout animation
        layoutRef.current.start();
        
      } catch (error) {
        console.error("Error starting layout:", error);
        isRunningRef.current = false;
        setIsLayoutRunning(false);
      }
    }
  }, [ onLayoutStart, onLayoutStop]);

  const stopLayout = useCallback(() => {
    if (layoutRef.current && isRunningRef.current) {
      try {
        layoutRef.current.stop();
        isRunningRef.current=false;
        setIsLayoutRunning(false);
        onLayoutStop?.();
        console.log("Layout stopped successfully");
      } catch (error) {
        console.error("Error stopping layout:", error);
      }
    }
  }, [onLayoutStop]);


  const calculateNetworkMetrics = (graph) => {
    const basicStats = {
      nodes: graph.order,
      edges: graph.size,
      density: graph.order > 1 ? (2 * graph.size) / (graph.order * (graph.order - 1)) : 0,
      avgDegree: graph.order > 0 ? (2 * graph.size) / graph.order : 0,
    };

    // Degree distribution using built-in methods
    const degrees = [];
    const degreeMap = {};
    graph.forEachNode((node) => {
      const degree = graph.degree(node);
      degrees.push(degree);
      degreeMap[degree] = (degreeMap[degree] || 0) + 1;
    });

    const maxDegree = Math.max(...degrees);
    const minDegree = Math.min(...degrees);

    // Community stats - get communities from graph attributes
    const communities = new Map();
    graph.forEachNode((node) => {
      const communityId = graph.getNodeAttribute(node, 'community');
      if (communityId !== undefined) {
        if (!communities.has(communityId)) {
          communities.set(communityId, {
            nodes: new Set(),
            edges: new Set(),
            internalEdges: new Set(),
            externalEdges: new Set()
          });
        }
        communities.get(communityId).nodes.add(node);
      }
    });

    const communityCount = communities.size;

    // Calculate edges for each community and identify internal/external edges
    graph.forEachEdge((edge, attributes, source, target) => {
      const sourceCommunity = graph.getNodeAttribute(source, 'community');
      const targetCommunity = graph.getNodeAttribute(target, 'community');
      
      if (sourceCommunity !== undefined && targetCommunity !== undefined) {
        // This edge connects two nodes with communities
        if (sourceCommunity === targetCommunity) {
          // Internal edge
          if (communities.has(sourceCommunity)) {
            communities.get(sourceCommunity).internalEdges.add(edge);
            communities.get(sourceCommunity).edges.add(edge);
          }
        } else {
          // External edge - add to both communities as external
          if (communities.has(sourceCommunity)) {
            communities.get(sourceCommunity).externalEdges.add(edge);
            communities.get(sourceCommunity).edges.add(edge);
          }
          if (communities.has(targetCommunity)) {
            communities.get(targetCommunity).externalEdges.add(edge);
            communities.get(targetCommunity).edges.add(edge);
          }
        }
      }
    });

    // Calculate community-level statistics
    const communityStats = {};
    let totalModularity = 0;
    const m = graph.size; // Total edges in graph

    communities.forEach((communityData, communityId) => {
      const nodeCount = communityData.nodes.size;
      const internalEdgeCount = communityData.internalEdges.size;
      const externalEdgeCount = communityData.externalEdges.size;
      const totalEdgeCount = internalEdgeCount + externalEdgeCount;

      // Calculate degrees within this community
      let communityDegrees = [];
      let communityMaxDegree = 0;
      let communityMinDegree = Infinity;
      let totalDegree = 0;

      communityData.nodes.forEach(node => {
        const degree = graph.degree(node);
        communityDegrees.push(degree);
        totalDegree += degree;
        communityMaxDegree = Math.max(communityMaxDegree, degree);
        communityMinDegree = Math.min(communityMinDegree, degree);
      });

      const avgDegree = nodeCount > 0 ? totalDegree / nodeCount : 0;

      // Calculate density for this community
      const possibleEdges = nodeCount > 1 ? (nodeCount * (nodeCount - 1)) / 2 : 0;
      const density = possibleEdges > 0 ? internalEdgeCount / possibleEdges : 0;

      // Calculate clustering coefficient for this community
      let totalClusteringCoeff = 0;
      let validNodes = 0;

      communityData.nodes.forEach(node => {
        const neighbors = graph.neighbors(node);
        const degree = neighbors.length;
        
        if (degree < 2) return;
        
        let triangles = 0;
        for (let i = 0; i < neighbors.length; i++) {
          for (let j = i + 1; j < neighbors.length; j++) {
            if (graph.hasEdge(neighbors[i], neighbors[j])) {
              triangles++;
            }
          }
        }
        
        const possibleTriangles = (degree * (degree - 1)) / 2;
        const clusteringCoeff = possibleTriangles > 0 ? triangles / possibleTriangles : 0;
        totalClusteringCoeff += clusteringCoeff;
        validNodes++;
      });

      const avgClusteringCoeff = validNodes > 0 ? totalClusteringCoeff / validNodes : 0;

      // Calculate modularity contribution for this community
      let communityModularity = 0;
      if (m > 0) {
        communityData.nodes.forEach(i => {
          const ki = graph.degree(i);
          communityData.nodes.forEach(j => {
            if (i !== j) {
              const kj = graph.degree(j);
              const aij = graph.hasEdge(i, j) ? 1 : 0;
              communityModularity += (aij - (ki * kj) / (2 * m));
            }
          });
        });
        communityModularity = communityModularity / (2 * m);
        totalModularity += communityModularity;
      }

      communityStats[communityId] = {
        nodeCount,
        internalEdgeCount,
        externalEdgeCount,
        totalEdgeCount,
        density,
        avgDegree,
        maxDegree: communityMaxDegree,
        minDegree: communityMinDegree,
        avgClusteringCoeff,
        modularity: communityModularity,
        isolation: internalEdgeCount > 0 ? internalEdgeCount / totalEdgeCount : 0,
        connectivity: externalEdgeCount > 0 ? externalEdgeCount / totalEdgeCount : 0
      };
    });

    // Calculate global clustering coefficient
    let totalClusteringCoeff = 0;
    let validNodes = 0;
    
    graph.forEachNode((node) => {
      const neighbors = graph.neighbors(node);
      const degree = neighbors.length;
      
      if (degree < 2) return;
      
      let triangles = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (graph.hasEdge(neighbors[i], neighbors[j])) {
            triangles++;
          }
        }
      }
      
      const possibleTriangles = (degree * (degree - 1)) / 2;
      const clusteringCoeff = possibleTriangles > 0 ? triangles / possibleTriangles : 0;
      totalClusteringCoeff += clusteringCoeff;
      validNodes++;
    });

    const avgClusteringCoeff = validNodes > 0 ? totalClusteringCoeff / validNodes : 0;

    // Connected components using graph traversal
    const visited = new Set();
    const components = [];
    
    graph.forEachNode((startNode) => {
      if (visited.has(startNode)) return;
      
      const component = [];
      const queue = [startNode];
      
      while (queue.length > 0) {
        const node = queue.shift();
        if (visited.has(node)) continue;
        
        visited.add(node);
        component.push(node);
        
        graph.forEachNeighbor(node, (neighbor) => {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        });
      }
      
      components.push(component);
    });

    const largestComponent = components.length > 0 ? Math.max(...components.map(comp => comp.length)) : 0;

    // Edge weight statistics
    const weights = [];
    graph.forEachEdge((edge, attributes) => {
      if (attributes.weight) weights.push(parseFloat(attributes.weight));
    });

    const weightExtent = weights.length > 0 ? [Math.min(...weights), Math.max(...weights)] : [0, 0];
    const avgWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;

    // Assortativity (degree correlation)
    let assortativity = 0;
    if (graph.size > 0) {
      const edges = [];
      graph.forEachEdge((edge, attributes, source, target) => {
        edges.push([graph.degree(source), graph.degree(target)]);
      });
      
      if (edges.length > 0) {
        const meanX = edges.reduce((sum, [x]) => sum + x, 0) / edges.length;
        const meanY = edges.reduce((sum, [, y]) => sum + y, 0) / edges.length;
        
        let numerator = 0;
        let denomX = 0;
        let denomY = 0;
        
        edges.forEach(([x, y]) => {
          const dx = x - meanX;
          const dy = y - meanY;
          numerator += dx * dy;
          denomX += dx * dx;
          denomY += dy * dy;
        });
        
        const denominator = Math.sqrt(denomX * denomY);
        assortativity = denominator > 0 ? numerator / denominator : 0;
      }
    }

    // Calculate edge crossings
    const crossingData = calculateEdgeCrossings(graph);
    debugger
    return {
      ...basicStats,
      communities: communityCount,
      modularity: totalModularity.toFixed(4),
      communityStats, // Add community-level statistics
      connectedComponents: components.length,
      largestComponent,
      componentRatio: graph.order > 0 ? (largestComponent / graph.order).toFixed(3) : '0.000',
      weightExtent,
      avgWeight: avgWeight.toFixed(2),
      maxDegree,
      minDegree,
      avgClusteringCoeff: avgClusteringCoeff.toFixed(4),
      assortativity: assortativity.toFixed(4),
      degreeDistribution: degreeMap,
      estimatedDiameter: estimateDiameter(graph),
      edgeCrossings: crossingData.crossings,
      crossingDensity: crossingData.crossingDensity.toFixed(4),
      crossingPairs: crossingData.crossingPairs,
    };
  };

  useImperativeHandle(ref, () => ({
    startLayout,
    stopLayout,
    saveAsPNG: onsaveNetworkAsPNG,
    getStats: () => networkStats
  }));

  // Helper function to check if two line segments intersect
  const doLinesIntersect = (p1, q1, p2, q2) => {
    const orientation = (p, q, r) => {
      const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
      if (val === 0) return 0; // collinear
      return (val > 0) ? 1 : 2; // clock or counterclock wise
    };

    const onSegment = (p, q, r) => {
      return (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
              q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y));
    };

    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    // General case
    if (o1 !== o2 && o3 !== o4) return true;

    // Special cases
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;

    return false;
  };

  // Calculate edge crossings
  const calculateEdgeCrossings = (graph) => {
    const edges = [];
    const positions = {};
    
    // Get all edge positions
    graph.forEachEdge((edge, attributes, source, target) => {
      const sourcePos = graph.getNodeAttributes(source);
      const targetPos = graph.getNodeAttributes(target);
      
      positions[source] = { x: sourcePos.x, y: sourcePos.y };
      positions[target] = { x: targetPos.x, y: targetPos.y };
      
      edges.push({
        id: edge,
        source: source,
        target: target,
        sourcePos: positions[source],
        targetPos: positions[target]
      });
    });

    let crossings = 0;
    const crossingPairs = [];

    // Check all pairs of edges for intersections
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const edge1 = edges[i];
        const edge2 = edges[j];

        // Skip if edges share a node
        if (edge1.source === edge2.source || edge1.source === edge2.target ||
            edge1.target === edge2.source || edge1.target === edge2.target) {
          continue;
        }

        if (doLinesIntersect(
          edge1.sourcePos, edge1.targetPos,
          edge2.sourcePos, edge2.targetPos
        )) {
          crossings++;
          crossingPairs.push([edge1.id, edge2.id]);
        }
      }
    }

    return {
      crossings,
      crossingPairs,
      crossingDensity: edges.length > 1 ? crossings / (edges.length * (edges.length - 1) / 2) : 0
    };
  };
  
  const estimateDiameter = (graph) => {
    if (graph.order === 0) return 0;
    
    const nodes = graph.nodes();
    const startNode = nodes[Math.floor(Math.random() * nodes.length)];
    
    let maxDistance = 0;
    const distances = { [startNode]: 0 };
    const queue = [startNode];
    
    while (queue.length > 0) {
      const node = queue.shift();
      const currentDistance = distances[node];
      
      graph.forEachNeighbor(node, (neighbor) => {
        if (!(neighbor in distances)) {
          distances[neighbor] = currentDistance + 1;
          maxDistance = Math.max(maxDistance, currentDistance + 1);
          queue.push(neighbor);
        }
      });
    }
    
    return maxDistance;
  };

  useEffect(() => {
    if (!data?.nodes?.length || !containerRef.current) return;

    console.log("Initializing graph with", data.nodes.length, "nodes and", data.edges.length, "edges");

    // Clean up previous instances
    if (layoutRef.current) {
      try {
        layoutRef.current.stop();
        layoutRef.current.kill?.();
      } catch (error) {
        console.warn("Error stopping previous layout:", error);
      }
      layoutRef.current = null;
    }
    
    if (rendererRef.current) {
      try {
        rendererRef.current.kill();
      } catch (error) {
        console.warn("Error killing previous renderer:", error);
      }
      rendererRef.current = null;
    }

    // Reset layout state
    isRunningRef.current = false;

    const graph = new Graph();
    
    // Calculate size scale
    const sizescale = scaleSqrt()
      .domain(extent(data.nodes, (d) => d.size))
      .range([3, 15]);

    // Add nodes first without community coloring
    data.nodes.forEach((node) => {
      graph.addNode(node.id, {
        type: "circle",
        label: node.label || node.id,
        size: sizescale(node.size || 1),
        color: "#666",
        x: Math.random() * 100,
        y: Math.random() * 100,
        originalSize: node.size,
        genres: node.genres || [],
        highlighted: false,
        draggedRecently: false,
      });
    });

    // Add edges filtered by threshold
    const filteredEdges = data.edges.filter((edge) => +edge.weight >= threshold);
    console.log("Filtered edges:", filteredEdges.length, "from", data.edges.length);
    
    // Compute edge weight scale
    const weightExtent = extent(filteredEdges, (e) => +e.weight);
    const weightScale = scaleSqrt()
      .domain(weightExtent)
      .range([0.5, 5]); // min/max thickness
      
    filteredEdges.forEach((edge) => {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        graph.addEdge(edge.source, edge.target, {
          label: `${edge.weight}`,
          size: weightScale(edge.weight / 2),
          color: "#ccc",
          weight: edge.weight,
        });
      }
    });

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
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
      // nodeProgramClasses:{
      //     circle: createNodeCompoundProgram([
      //     NodeHaloProgram,
      //     NodePointProgram
      //   ]),
      // },
      // nodeHoverProgramClasses: {
      //   circle: createNodeCompoundProgram([
      //     NodePointProgram
      //   ]),
      // }
    });

    // Perform community detection if enabled
    if (communityDetection && graph.order > 0) {
      try {
        console.log("Performing community detection for", numCommunities, "communities");
        const {communitySizes,communities} = detectCommunities(graph, numCommunities);
        setCommunitySizes(communitySizes);
        setCommunities(communities);
        // Apply community colors to nodes
        graph.forEachNode((node) => {
          const communityId = communities[node];
          let nodeColor;
          nodeColor = communityColors(communityId);   
          graph.setNodeAttribute(node, "color", nodeColor);
          graph.setNodeAttribute(node, "community", communityId);

          graph.mergeNodeAttributes(node, {
            // type: "circle",
            color: nodeColor,
            community: communityId,
            // haloSize: 100,
            // haloIntensity: 1,
            // haloColor: nodeColor
          });
        });
        
        // const detectedCommunities = new Set(Object.values(communities));
        // // console.log("Community detection completed with", detectedCommunities.size, "communities");
        
        // detectedCommunities.forEach((c) => {
        //   const community = +c;
        //   if (community!=-1){
        //     const baseColor = communityColors(community);
        //     let colorWithOpacity = d3color(baseColor);
        //     if (colorWithOpacity) {
        //       colorWithOpacity.opacity = 0.7;  // set 30% opacity
        //       colorWithOpacity = colorWithOpacity.darker(2);
        //     }
        //     bindWebGLLayer(
        //       `metaball-${community}`,
        //       renderer,
        //       createContoursProgram(
        //         graph.filterNodes((_node) => communities[_node]===community),
        //         {
        //           radius: 50,
        //           levels: [
        //             {
        //               color: colorWithOpacity.toString(),
        //               threshold: 0.5,
        //             }
        //           ]
        //           // color: communityColors(community),
        //           // opacity: 0.25,
        //           // smoothingRadius: 25,
        //           // isBlending: true,
        //         }
        //       ),
        //     );}
        // });
      } catch (error) {
        console.error("Error in community detection:", error);
        // Fallback: assign random communities
        graph.forEachNode((node) => {
          const randomCommunity = Math.floor(Math.random() * numCommunities);
          graph.setNodeAttribute(node, "color", communityColors(randomCommunity));
          graph.setNodeAttribute(node, "community", randomCommunity);
        });
      }
    }

    console.log("Final graph:", graph.order, "nodes,", graph.size, "edges");

    // Calculate network statistics
    const stats = calculateNetworkMetrics(graph);
    stats.weightScale = weightScale;
    setNetworkStats(stats);

    

    // Drag and Drop Implementation with soft force
    const handleMouseDown = (e) => {
      dragStateRef.current.isDragging = true;
      dragStateRef.current.draggedNode = e.node;
      dragStateRef.current.dragStartTime = Date.now();
      graph.setNodeAttribute(e.node, "highlighted", true);
      graph.setNodeAttribute(e.node, "draggedRecently", true);
      renderer.refresh();
      // Don't completely disable camera, just set custom bbox
      if (!renderer.getCustomBBox()) {
        renderer.setCustomBBox(renderer.getBBox());
      }
    };

    const handleMouseMove = (e) => {
      if (!dragStateRef.current.isDragging || !dragStateRef.current.draggedNode) return;

      // Get new position of node
      const pos = renderer.viewportToGraph(e.event);
      graph.setNodeAttribute(dragStateRef.current.draggedNode, "x", pos.x);
      graph.setNodeAttribute(dragStateRef.current.draggedNode, "y", pos.y);

      // Prevent sigma from moving camera
      e.event.preventSigmaDefault();
      e.event.original.preventDefault();
      e.event.original.stopPropagation();
    };

    const handleMouseUp = () => {
      if (dragStateRef.current.draggedNode) {
        graph.removeNodeAttribute(dragStateRef.current.draggedNode, "highlighted");
        
        // Set a timer to remove the "recently dragged" status after a few seconds
        // This allows the force to gradually take effect
        setTimeout(() => {
          if (graph.hasNode(dragStateRef.current.draggedNode)) {
            graph.removeNodeAttribute(dragStateRef.current.draggedNode, "draggedRecently");
          }
        }, 3000); // 3 seconds of reduced force
      }
      dragStateRef.current.isDragging = false;
      dragStateRef.current.draggedNode = null;
      
      // Re-enable camera movement
      renderer.setCustomBBox(null);
    };
    
    const updateMetrics = debounce(() => {
      const stats = calculateNetworkMetrics(graph);
      stats.weightScale = weightScale;
      setNetworkStats(stats);
    }, 500);
    
    // Add drag and drop event listeners
    renderer.on("afterRender", updateMetrics);
    renderer.on("downNode", handleMouseDown);
    renderer.on("moveBody", handleMouseMove);
    renderer.on("upNode", handleMouseUp);
    renderer.on("upStage", handleMouseUp);

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

    renderer.on("leaveNode", () => {
      graph.forEachNode((n, attributes) => {
        const originalColor = communityDetection && attributes.community !== undefined
          ? communityColors(attributes.community)
          : "#666";
        graph.setNodeAttribute(n, "color", originalColor);
        graph.setNodeAttribute(n, "highlighted", false);
      });

      graph.forEachEdge((edge, attributes) => {
        graph.setEdgeAttribute(edge, "color", "#ccc");
        graph.setEdgeAttribute(edge, "size", stats.weightScale(attributes.weight));
      });

      renderer.refresh();
    });

    // Create layout with synchronous ForceAtlas2
    try {
      const layoutSettings = {
        slowDown: 10,
        strongGravityMode: true,
        gravity: 0.05,
        scalingRatio: 10,
        edgeWeightInfluence: 1.5,
      };

      let animationFrameId = null;

      const layoutInstance = {
        start: () => {
          // debugger
          // if (isLayoutRunning) return;
          
          // setIsLayoutRunning(true);
          // onLayoutStart?.();
          
          const runIteration = () => {
            if (!isRunningRef.current) return;
            
            // Apply one iteration of ForceAtlas2
            forceAtlas2.assign(graph, {
              settings: layoutSettings,
              iterations: 1,
              getEdgeWeight: (edge, attr) => attr.weight || 1,
              isNodeFixed: (node, attr) => attr.highlighted,
              getNodeMass: (node, attr) => {
                // Increase mass for recently dragged nodes to reduce force influence
                if (attr.draggedRecently && !attr.highlighted) {
                  return 10; // Higher mass = less affected by forces
                }
                return 1; // Normal mass
              }
            });
            
            renderer.refresh();
            
            // Continue with next iteration
            if (isRunningRef.current) {
              animationFrameId = requestAnimationFrame(runIteration);
            }
          };
          
          // Start the animation loop
          animationFrameId = requestAnimationFrame(runIteration);
        },
        
        stop: () => {
          isRunningRef.current=(false);
          onLayoutStop?.();
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        },
        
        kill: () => {
          isRunningRef.current=(false);
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        }
      };

      layoutRef.current = layoutInstance;
      rendererRef.current = renderer;
      
    } catch (error) {
      console.error("Error creating layout:", error);
      rendererRef.current = renderer;
    }
    setGraph(graph)
    startLayout();
    return () => {
      if (layoutRef.current) {
        try {
          layoutRef.current.stop();
          layoutRef.current.kill?.();
        } catch (error) {
          console.warn("Error cleaning up layout:", error);
        }
      }
      if (rendererRef.current) {
        try {
          rendererRef.current.kill();
        } catch (error) {
          console.warn("Error cleaning up renderer:", error);
        }
      }
      isRunningRef.current=(false);
      dragStateRef.current = { isDragging: false, draggedNode: null, dragStartTime: null };
    };
  }, [data, threshold, communityDetection, numCommunities]);
  const { theme } = useTheme();
  useEffect(()=>{
    if (rendererRef.current && communityDetection) {
        const cleanList = [];
        const detectedCommunities = new Set(Object.values(communities));
        detectedCommunities.forEach((c) => {
          const community = +c;
          if (community !== -1) {
            const baseColor = communityColors(community);
            const shadowColor = adjustColorWithTheme(baseColor, theme, 0.6);

            cleanList.push(bindWebGLLayer(
              `metaball-${community}`,
              rendererRef.current,
              createContoursProgram(
                graph.filterNodes((_node) => communities[_node] === community),
                {
                  radius: 50,
                  levels: [
                    {
                      color: shadowColor,
                      threshold: 0.5,
                    }
                  ]
                }
              )
            ));
          }
        });
        return ()=>{
          cleanList.forEach(c=>{
            c();
            c=null;
          })
        }
      }
  },[theme,communities,communityDetection,graph]
  );

  const onsaveNetworkAsPNG = useCallback(() => {
    if (rendererRef.current) {
      downloadAsImage(rendererRef.current, {
        layers: ["edges", "nodes", "edgeLabels", "labels"],
        format: "png",
        fileName: "network-export",
        backgroundColor: "#ffffff",
        width: 1200,
        height: 800,
        cameraState: undefined,
      });
    }
  }, [rendererRef]);

  const onsaveNetworkAsPDF = useCallback(async() => {
    if (rendererRef.current) {
      // 1. Export graph to Base64 PNG
        const blob = await toBlob(rendererRef.current, {
        layers: ["edges", "nodes", "edgeLabels", "labels"],
        format: "png",
        fileName: "network-export",
        backgroundColor: "#ffffff",
        width: 1200,
        height: 800,
        cameraState: undefined,
      });
       if (!blob) return;

  // 2. Convert Blob → Base64
      const base64 = await blobToBase64(blob);
        // 2. Create PDF
        applyPlugin(jsPDF);
        const doc = new jsPDF("p", "pt", "a4");
        doc.text("Network Analysis Report", 40, 40);
        doc.setFontSize(12);
        doc.text("Generated by MIRAGE-DASHBOARD", 40, 65);
        // 3. Add image
        doc.addImage(base64, "PNG", 40, 90, 500, 300);
        // --- Paragraph ---
        doc.setFontSize(12);
        doc.text(
          "This report contains an exported network visualization along with key statistics summarizing the graph data.",
          40,
          420,
          { maxWidth: 500 }
        );
        let startTitleY = 430;
        let head = [["Metric"]];
        let body = [
            ["Nodes"],
            ["Internal Edges"],
            ["External Edges"],
            ["Density"],
            ["Avg Degree"],
            ["Clustering"],
            ["Isolation"],
            ["Connectivity"],
          ]
        for (const [communityId, size] of Object.entries(communitySizes)) {
            const stats = networkStats.communityStats[communityId];
            if (!stats) continue;
            
          //   const table = doc.lastAutoTable;
          //   startTitleY =table?.finalY??startTitleY;
          //   debugger
            const communityName =
              communityId !== "-1" ? `Community ${+communityId + 1}` : "Other";
            
          //   // Section Title
          //   doc.setFontSize(14);
          //   startTitleY +=30;
          //   doc.text(communityName, 40, startTitleY);

          //   // Community Stats Table
          //   doc.setFontSize(12);
          //   const metrics = [
          //   ["Nodes", stats.nodeCount],
          //   ["Internal Edges", stats.internalEdgeCount],
          //   ["External Edges", stats.externalEdgeCount],
          //   ["Density", stats.density.toFixed(3)],
          //   ["Avg Degree", stats.avgDegree.toFixed(1)],
          //   ["Clustering", stats.avgClusteringCoeff.toFixed(3)],
          //   ["Isolation", (stats.isolation * 100).toFixed(1) + "%"],
          //   ["Connectivity", (stats.connectivity * 100).toFixed(1) + "%"],
          // ];

          // // Starting Y position (e.g. after image or previous section)
          // let y = startTitleY+20;

          //  doc.autoTable({
          //     startY: startTitleY + 20,
          //     head: [["Metric", "Value"]],
          //     body: metrics,
          //   });

          // startTitleY = y+metrics.length*20+40;

          head[0].push(communityName);
          body[0].push(stats.nodeCount);
          body[1].push( stats.internalEdgeCount);
          body[2].push(stats.externalEdgeCount);
          body[3].push(stats.density.toFixed(3));
          body[4].push(stats.avgDegree.toFixed(1));
          body[5].push(stats.avgClusteringCoeff.toFixed(3));
          body[6].push((stats.isolation * 100).toFixed(1) + "%");
          body[7].push((stats.connectivity * 100).toFixed(1) + "%");        
           
        }

        const chunkSize = 5; // max columns per table
        for (let i = 0; i < head[0].length; i += chunkSize) {
          const cols = head[0].slice(i, i + chunkSize);
          const data = body.map(r => r.slice(i, i + chunkSize));
          startTitleY =  (doc.lastAutoTable?.finalY??startTitleY) + 20;
           doc.autoTable({
            head: [cols],
            body: data,
            startY: startTitleY,
            // styles: { fontSize: 8 },
          });
        }
            //       doc.autoTable({
            //   startY: startTitleY + 20,
            //   head,
            //   body,
            // });

        // 4. Save PDF
        doc.save("graph.pdf");
    }
  }, [rendererRef,communitySizes,networkStats]);

  if (!data?.nodes?.length) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No network data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Enhanced Network Statistics */}
      <div className="bg-background p-4 rounded-lg shadow mb-4">
        <h3 className="text-lg font-semibold mb-3">Network Statistics</h3>
        <Accordion type="single" collapsible>
          {/* Basic Stats */}
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-md font-medium mb-2">Basic Metrics</AccordionTrigger>
            <AccordionContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
                  <div className="bg-primary-foreground p-2 rounded">
                    <span className="font-medium block">Nodes:</span> 
                    <span className="text-lg">{networkStats.nodes}</span>
                  </div>
                  <div className="bg-primary-foreground p-2 rounded">
                    <span className="font-medium block">Edges:</span> 
                    <span className="text-lg">{networkStats.edges}</span>
                  </div>
                  <div className="bg-primary-foreground p-2 rounded">
                    <span className="font-medium block">Density:</span> 
                    <span className="text-lg">{(networkStats.density || 0).toFixed(3)}</span>
                  </div>
                  <div className="bg-primary-foreground p-2 rounded">
                    <span className="font-medium block">Avg Degree:</span> 
                    <span className="text-lg">{(networkStats.avgDegree || 0).toFixed(1)}</span>
                  </div>
                  <div className="bg-primary-foreground p-2 rounded">
                    <span className="font-medium block">Components:</span> 
                    <span className="text-lg">{networkStats.connectedComponents}</span>
                  </div>
                  <div className="bg-primary-foreground p-2 rounded">
                    <span className="font-medium block">Largest Comp:</span> 
                    <span className="text-lg">{networkStats.largestComponent}</span>
                  </div>
            </AccordionContent>
          </AccordionItem>
          {/* Community Detection Stats */}
          {communityDetection &&<AccordionItem value="item-2">
            <AccordionTrigger className="text-md font-medium mb-2">Community Structure</AccordionTrigger>
            <AccordionContent className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-primary-foreground p-2 rounded">
                <span className="font-medium block">Communities:</span> 
                <span className="text-lg">{networkStats.communities}</span>
              </div>
              <div className="bg-primary-foreground p-2 rounded">
                <span className="font-medium block">Modularity:</span> 
                <span className="text-lg">{networkStats.modularity}</span>
              </div>
              <div className="bg-primary-foreground p-2 rounded">
                <span className="font-medium block">Component Ratio:</span> 
                <span className="text-lg">{networkStats.componentRatio}</span>
              </div>
            </AccordionContent>
          </AccordionItem>}
           {/* Network Structure Metrics */}
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-md font-medium mb-2">Network Structure</AccordionTrigger>
            <AccordionContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
              <div className="bg-primary-foreground p-2 rounded">
                <span className="font-medium block">Clustering Coeff:</span> 
                <span className="text-lg">{networkStats.avgClusteringCoeff}</span>
              </div>
              <div className="bg-primary-foreground p-2 rounded">
                <span className="font-medium block">Assortativity:</span> 
                <span className="text-lg">{networkStats.assortativity}</span>
              </div>
              <div className="bg-primary-foreground p-2 rounded">
                <span className="font-medium block">Est. Diameter:</span> 
                <span className="text-lg">{networkStats.estimatedDiameter}</span>
              </div>
              <div className="bg-primary-foreground p-2 rounded">
                <span className="font-medium block">Edge Crossings:</span> 
                <span className="text-lg">{networkStats.edgeCrossings}</span>
              </div>
              <div className="bg-primary-foreground p-2 rounded">
                <span className="font-medium block">Crossing Density:</span> 
                <span className="text-lg">{networkStats.crossingDensity}</span>
              </div>
            </AccordionContent>
          </AccordionItem>
          {/* Edge Weight Statistics */}
          <AccordionItem value="item-4">
            <AccordionTrigger className="text-md font-medium mb-2">Edge Weight</AccordionTrigger>
            <AccordionContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-primary-foreground p-2 rounded">
                <span className="font-medium block">Min Weight:</span> 
                <span className="text-lg">{networkStats.weightExtent?.[0] ?? 0}</span>
              </div>
              <div className="bg-primary-foreground p-2 rounded">
                <span className="font-medium block">Max Weight:</span> 
                <span className="text-lg">{networkStats.weightExtent?.[1] ?? 0}</span>
              </div>
              <div className="bg-primary-foreground p-2 rounded">
                <span className="font-medium block">Avg Weight:</span> 
                <span className="text-lg">{networkStats.avgWeight}</span>
              </div>
              <div className="bg-primary-foreground p-2 rounded">
                <span className="font-medium block">Degree Range:</span> 
                <span className="text-lg">{networkStats.minDegree}-{networkStats.maxDegree}</span>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Layout Controls */}
      <div className="bg-background p-4 rounded-lg shadow mb-4">
        <h4 className="text-md font-medium mb-2">Controls</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={startLayout}
            disabled={isRunningRef.current}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {isRunningRef.current ? "Layout Running..." : "Start Layout"}
          </button>
          <button
            onClick={stopLayout}
            disabled={!isRunningRef.current}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
          >
            Stop Layout
          </button>

          <Button
            onClick={onsaveNetworkAsPNG}
            className="px-4 py-2"
          >
            Save image
          </Button>
          <Button
            onClick={onsaveNetworkAsPDF}
            className="px-4 py-2"
          >
            Save PDF
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          💡 <strong>Tip:</strong> Click and drag nodes to reposition them. Dragged nodes will have reduced force for 3 seconds, allowing gradual settling while maintaining some layout dynamics.
        </p>
      </div>

      {/* Graph Container */}
      <div className="bg-background rounded-lg shadow relative">
        <div ref={containerRef} style={{ height: "600px", width: "100%" }} />
        <div className="absolute top-2 right-2 p-2 bg-white bg-opacity-90 rounded">
          <h4 className="text-sm font-semibold mb-1">Edge Weight Legend</h4>
          <div className="flex flex-col gap-1">
            {/* Thin edge */}
            <div className="flex items-center gap-2">
              <svg width="30" height="8">
                <line 
                  x1="0" y1="4" x2="30" y2="4" 
                  stroke="#ccc" 
                  strokeWidth={networkStats.weightScale ? networkStats.weightScale(networkStats.weightExtent?.[0] ?? 0) : 1}
                />
              </svg>
              <span className="text-xs">Low ({networkStats.weightExtent?.[0] ?? 0})</span>
            </div>
            {/* Thick edge */}
            <div className="flex items-center gap-2">
              <svg width="30" height="8">
                <line 
                  x1="0" y1="4" x2="30" y2="4" 
                  stroke="#ccc" 
                  strokeWidth={networkStats.weightScale ? networkStats.weightScale(networkStats.weightExtent?.[1] ?? 0) : 5}
                />
              </svg>
              <span className="text-xs">High ({networkStats.weightExtent?.[1] ?? 0})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend for Community Detection */}
      {communityDetection && (
        <div className="bg-white p-4 rounded-lg shadow mt-4">
          <h3 className="text-lg font-semibold mb-2">Community Legend</h3>
          <div className="flex flex-wrap gap-2">
            {/* Regular communities */}
            {Object.entries(communitySizes).map(([communityId,size]) => (
              <div key={communityId} className="flex items-center">
                <Tooltip>
                  <TooltipTrigger  className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: communityColors(+communityId) }}
                    />
                    <span className="text-sm">{communityId!=-1?`Community ${+communityId+1}`:"Other"}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                        {networkStats.communityStats[communityId]&&(
                          <div key={communityId} className="border rounded-lg p-4">
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Nodes:</span>
                                <span className="font-medium">{networkStats.communityStats[communityId].nodeCount}</span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span>Internal Edges:</span>
                                <span className="font-medium">{networkStats.communityStats[communityId].internalEdgeCount}</span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span>External Edges:</span>
                                <span className="font-medium">{networkStats.communityStats[communityId].externalEdgeCount}</span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span>Density:</span>
                                <span className="font-medium">{networkStats.communityStats[communityId].density.toFixed(3)}</span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span>Avg Degree:</span>
                                <span className="font-medium">{networkStats.communityStats[communityId].avgDegree.toFixed(1)}</span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span>Clustering:</span>
                                <span className="font-medium">{networkStats.communityStats[communityId].avgClusteringCoeff.toFixed(3)}</span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span>Isolation:</span>
                                <span className="font-medium">{(networkStats.communityStats[communityId].isolation * 100).toFixed(1)}%</span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span>Connectivity:</span>
                                <span className="font-medium">{(networkStats.communityStats[communityId].connectivity * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        )}
                  </TooltipContent>
                </Tooltip>
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


const adjustColorWithTheme = (baseColor, theme, opacity = 0.7) => {
  let c = d3color(baseColor);
  if (!c) return baseColor;

  // Dark mode → make color brighter so it pops
  // Light mode → make it slightly darker
  c = theme === "dark" ? c.brighter(1.2) : c.darker(0.8);

  c.opacity = opacity; // shadow-like
  return c.toString();
};

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
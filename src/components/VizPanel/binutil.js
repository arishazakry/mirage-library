import { extent, scaleLinear } from "d3";

export default function scatter2bin(data, binSize = 50) {
  const xExtent = extent(data, (d) => +d.x);
  const yExtent = extent(data, (d) => +d.y);
  const xMin = xExtent[0];
  const yMin = yExtent[0];

  // Create scales to map to bin indices
  const xScale = scaleLinear().domain(xExtent).nice(binSize);
  const yScale = scaleLinear().domain(yExtent).nice(binSize);

  const xStep = (xScale.domain()[1] - xScale.domain()[0]) / binSize;
  const yStep = (yScale.domain()[1] - yScale.domain()[0]) / binSize;

  const binMap = new Map();

  for (const point of data) {
    const i = Math.floor((point.x - xMin) / xStep);
    const j = Math.floor((point.y - yMin) / yStep);

    if (i >= 0 && i < binSize && j >= 0 && j < binSize) {
      const key = `${i},${j}`;
      if (!binMap.has(key)) {
        const x = xMin + (i + 0.5) * xStep;
        const y = yMin + (j + 0.5) * yStep;
        binMap.set(key, { x, y, count: 0 });
      }
      binMap.get(key).count += 1;
    }
  }

  // Convert to flat array
  return {
    data: Array.from(binMap.values()),
    xrange: xExtent,
    yrange: yExtent,
    stepX: xStep,
    stepY: yStep,
  };
}

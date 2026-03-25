/**
 * Visualization module for rendering graph data with D3
 */
console.log("Visualization module loaded");

const Visualization = (function () {
  // Default options
  const defaultOptions = {
    showLabels: false,
    showRelationships: false,
    nodeSize: "small",
  };

  // Visualization state
  let svg = null;
  let graphData = null;
  let visualOptions = { ...defaultOptions };
  let simulation = null;
  let dimensions = { width: 0, height: 0 };

  // Initialize visualization
  function init(containerSelector) {
    console.log("Visualization init called with", containerSelector);
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.error("Container not found:", containerSelector);
      return;
    }

    // Create SVG element if it doesn't exist
    if (!svg) {
      svg = d3
        .select(container)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

      // Add zoom behavior
      svg.call(
        d3
          .zoom()
          .scaleExtent([0.1, 10])
          .on("zoom", (event) => {
            const { transform } = event;
            svg.select("g").attr("transform", transform);
          })
      );
    }

    // Handle window resize
    window.addEventListener("resize", updateDimensions);
    updateDimensions();

    return svg;
  }

  // Update container dimensions
  function updateDimensions() {
    const container = document.querySelector("#visualization");
    if (container) {
      const rect = container.getBoundingClientRect();
      dimensions = { width: rect.width, height: rect.height };

      if (graphData) {
        render(graphData, visualOptions);
      }
    }
  }

  // Render graph visualization
  function render(data, options = {}) {
    console.log("Visualization render called");

    if (!svg || !data || !data.nodes || !data.links) {
      console.error("Cannot render: missing svg or data");
      return;
    }

    // Store original data
    graphData = data;
    visualOptions = { ...defaultOptions, ...options };

    // Clear previous visualization
    svg.selectAll("*").remove();

    // Stop any existing simulation
    if (simulation) {
      simulation.stop();
    }

    try {
      // Create SVG groups
      const g = svg.append("g");

      // Create force simulation
      simulation = d3
        .forceSimulation(data.nodes)
        .force(
          "link",
          d3
            .forceLink(data.links)
            .id((d) => d.id)
            .distance(100)
        )
        .force("charge", d3.forceManyBody().strength(-300))
        .force(
          "center",
          d3.forceCenter(dimensions.width / 2, dimensions.height / 2)
        );

      // Create links
      const link = g
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(data.links)
        .enter()
        .append("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1);

      const node_sizes = {small: 5, medium: 10, large: 18}
      const node_colors = {"Movie": "blue", "User": "orange"}

      // Create nodes - all grey
      const node = g
        .append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(data.nodes)
        .enter()
        .append("circle")
        .attr("r", node_sizes[visualOptions.nodeSize])
        .attr("fill", (d) => node_colors[d.labels[0]]) // All nodes are grey
        .call(drag(simulation));

      const nodeLabels = g
        .append("g")
        .attr("class", "node-labels")
        .selectAll("text")
        .data(data.nodes)
        .enter()
        .append("text")
        .text((d) => d.properties["title"] || ("User " + d.id))
        .attr("font-size", 10)
        .attr("dx", 8)
        .attr("dy", 3)
        .style("display", visualOptions.showLabels ? "block" : "none");

      const linkLabels = g
        .append("g")
        .attr("class", "link-labels")
        .selectAll("text")
        .data(data.links)
        .enter()
        .append("text")
        .text((d) => d.type || "")
        .attr("font-size", 8)
        .attr("fill", "#555")
        .style("display", visualOptions.showRelationships ? "block" : "none");

      const legend = svg
        .append("g")
        .attr("class", "legend")
        .attr("transform", "translate(960, 580)");
        
      legend.append("rect")
        .attr("width", 150)
        .attr("height", 160)
        .attr("fill", "white")
        .attr("stroke", "#555")
        .attr("rx", 6);
        
      legend.append("text")
        .text("Legend")
        .attr("x", 10)
        .attr("y", 15)
        .attr("font-weight", "bold")
        .attr("font-size", 18);

      legend.append("text")
        .attr("x", 10)
        .attr("y", 35)
        .attr("font-weight", "bold")
        .text("Node Types")
        .attr("font-size", 12);

      legend.append("circle")
        .attr("cx", 20)
        .attr("cy", 55)
        .attr("r", 10)
        .attr("fill", "blue")

      legend.append("text")
        .attr("x", 35)
        .attr("y", 58)
        .text("Movies")
        .attr("font-size", 10)

      legend.append("circle")
        .attr("cx", 20)
        .attr("cy", 80)
        .attr("r", 10)
        .attr("fill", "orange")

      legend.append("text")
        .attr("x", 35)
        .attr("y", 83)
        .text("Users")
        .attr("font-size", 10)

      legend.append("text")
        .attr("x", 10)
        .attr("y", 110)
        .attr("font-weight", "bold")
        .text("Relationship Types")
        .attr("font-size", 12);

      legend.append("line")
        .attr("x1", 10)
        .attr("y1", 130)
        .attr("x2", 30)
        .attr("y2", 130)
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1);

      legend.append("text")
        .attr("x", 35)
        .attr("y", 133)
        .text("Rating")
        .attr("font-size", 10)

      // Update positions on tick
      simulation.on("tick", () => {
        link
          .attr("x1", (d) => d.source.x || 0)
          .attr("y1", (d) => d.source.y || 0)
          .attr("x2", (d) => d.target.x || 0)
          .attr("y2", (d) => d.target.y || 0);

        node.attr("cx", (d) => d.x || 0).attr("cy", (d) => d.y || 0);

        nodeLabels.attr("x", (d) => d.x || 0).attr("y", (d) => d.y || 0);

        linkLabels.attr("x", (d) => ((d.source.x || 0) + (d.target.x || 0)) / 2)
                  .attr("y", (d) => ((d.source.y || 0) + (d.target.y || 0)) / 2)
      });

      console.log("Visualization rendered successfully");
    } catch (error) {
      console.error("Error rendering visualization:", error);
    }
  }

  // Drag handler for nodes
  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  // Clear visualization
  function clear() {
    if (svg) {
      svg.selectAll("*").remove();
    }

    if (simulation) {
      simulation.stop();
    }
  }

  // Return public API
  return {
    init,
    render,
    clear,
    updateDimensions,
  };
})();

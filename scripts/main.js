let data = d3.csv("../data/data.csv");

// set the dimensions and margins of the graph
const margin = {top: 20, right: 50, bottom: 20, left: 50},
  width = 500 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svgPcp = d3.select("#pcp")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform",
        `translate(${margin.left},${margin.top})`);
      
const tooltipPcp = d3.select("#pcp")
.append("div")
.style("opacity", 1)
.attr("class", "tooltip")
.style("background-color", "white")
.style("border", "solid")
.style("border-width", "1px")
.style("border-radius", "5px")
.style("padding", "10px")
    

// Parse the Data
d3.csv("../data/data.csv").then( function(data) {

  // Here I set the list of dimension manually to control the order of axis:
  dimensionsPcp = ["x1", "x2", "x3", "x4", "x5"]

  // For each dimension, I build a linear scale. I store all in a y object
  const yPcp = {}
  for (i in dimensionsPcp) {
    name = dimensionsPcp[i]
    yPcp[name] = d3.scaleLinear()
      .domain( [0,1] ) // --> Same axis range for each group
      // --> different axis range for each group --> .domain( [d3.extent(data, function(d) { return +d[name]; })] )
      .range([height, 0])
  }

  // Build the X scale -> it find the best position for each Y axis
  xPcp = d3.scalePoint()
    .range([0, width])
    .domain(dimensionsPcp);

  const highlightPcp = function(event, d){
    // first every group turns grey
    d3.select("#pcp").selectAll(".line")
      .transition().duration(200)
      .style("stroke", "lightgrey")
      .style("opacity", "0.5")
    
    d3.select("#scatter").selectAll(".dot")
      .transition()
      .duration(200)
      .style("fill", "lightgrey")
      .attr("r", 3)

    d3.select(this)
      .transition().duration(200)
      .style("stroke", "green")
      .style("opacity", "1")
      .style("stroke-width", "4")
    
      let idVal = d3.select(this).attr("value");

      svgScatter.selectAll(".dot").
      filter(function() {
          return d3.select(this).attr("value") == idVal
      }).transition()
        .duration(200)
        .style("fill", "green")
        .attr("r", 7)

    tooltipPcp.html("Design parameters: " + String(d3.select(this).attr("design")))
      .transition()
      .duration(500)
      .style("opacity", 1)
      .style("left", (event.x) / 2 + "px")
      .style("top", (event.y) / 2 + "px")
      
    let objectivesDesign = svgScatter.selectAll(".dot").
    filter(function(){
      return d3.select(this).attr("value") == idVal;
    }).attr("objectives");

    console.log(objectivesDesign);

    tooltipScatter.html("Objectives: " + String(objectivesDesign))
    .transition()
    .duration(500)
    .style("opacity", 1)
    .style("left", (event.x) / 2 + "px")
    .style("top", (event.y) / 2 + "px")

  }

  const doNotHighlightPcp = function(event, d){
    d3.select("#pcp").selectAll(".line")
      .transition().duration(200).delay(100)
      .style("stroke", function(d){ return("lightblue")} )
      .style("opacity", "1")
      .style("stroke-width", "2")
    
    d3.select("#scatter").selectAll(".dot")
      .transition()
      .duration(200).delay(100)
      .style("fill", "lightblue")
      .attr("r", 5 )
  }

  // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
  function pathPcp(d) {
      // console.log(d);
      const line = d3.line()(dimensionsPcp.map(function(p) { return [xPcp(p), yPcp[p](d[p])]; }));
      // console.log(dimensionsPcp.map(function(p) { return [xPcp(p), yPcp[p](d[p])]; }));
      return line;
  }

  // Draw the lines
  svgPcp
    .selectAll("myPath")
    .data(data)
    .join("path")
      .attr("class", function (d) { return "line"; } ) // 2 class for each line: 'line' and the group name
      .attr("d", pathPcp)
      .attr("value", function (d) {return d.id; })
      .attr("design", function (d) {return [d.x1, d.x2, d.x3, d.x4, d.x5]; })
      .style("fill", "none" )
      .style("stroke", function(d){ return( "lightblue")} )
      .style("opacity", 0.5)
      .style("stroke-width", "2")
      .on("mouseover", highlightPcp)
      .on("mouseout", doNotHighlightPcp)

  // Draw the axis:
  svgPcp.selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(dimensionsPcp).enter()
    .append("g")
    .attr("class", "axis")
    // I translate this element to its right position on the x axis
    .attr("transform", function(d) { return `translate(${xPcp(d)})`})
    // And I build the axis with the call function
    .each(function(d) { d3.select(this).call(d3.axisLeft().ticks(5).scale(yPcp[d])); })
    // Add axis title
    .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d; })
        .style("fill", "black")

})

const svgScatter = d3.select("#scatter")
.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
.append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

const tooltipScatter = d3.select("#scatter")
.append("div")
.style("opacity", 1)
.attr("class", "tooltip")
.style("background-color", "white")
.style("border", "solid")
.style("border-width", "1px")
.style("border-radius", "5px")
.style("padding", "10px")

d3.csv("../data/data.csv").then( function(data) {
    // Add X axis
    const x = d3.scaleLinear()
        .domain([-1, 1])
        .range([ 0, width ]);
    svgScatter.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([-1, 1])
        .range([ height, 0]);
    svgScatter.append("g")
        .call(d3.axisLeft(y));

    const highlightScatter = function(event, d){
      // console.log(svgScatter.selectAll(".dot"));
      d3.select("#scatter").selectAll(".dot")
        .transition()
        .duration(200)
        .style("fill", "lightgrey")
        .attr("r", 3)
      
      d3.select("#pcp").selectAll(".line")
        .transition().duration(200)
        .style("stroke", "lightgrey")
        .style("opacity", "0.5")

      d3.select(this)
        .transition()
        .duration(200)
        .style("fill", "green")
        .attr("r", 7)
      
      tooltipScatter.html("Objectives: " + d3.select(this).attr("objectives"))
        .transition()
        .duration(500)
        .style("opacity", 1)
        .style("left", (event.x) / 2 + "px")
        .style("top", (event.y) / 2 + "px")

      let idVal = d3.select(this).attr("value");

      svgPcp.selectAll(".line").
      filter(function() {
          return d3.select(this).attr("value") == idVal
      }).transition().duration(200)
        .style("stroke", "green")
        .style("opacity", "1")
        .style("stroke-width", "4");

      let parametersDesign = svgPcp.selectAll(".line").
      filter(function(){
        return d3.select(this).attr("value") == idVal;
      }).attr("design");

      tooltipPcp.html("Design Parameters: " + parametersDesign)
        .transition()
        .duration(500)
        .style("opacity", 1)
        .style("left", (event.x) / 2 + "px")
        .style("top", (event.y) / 2 + "px")
    }
        
    const doNotHighlightScatter = function(event, d){
      d3.select("#scatter").selectAll(".dot")
        .transition()
        .duration(200).delay(500)
        .style("fill", "lightblue")
        .attr("r", 5 )
      
      d3.select("#pcp").selectAll(".line")
        .transition().duration(200).delay(500)
        .style("stroke", function(d){ return("lightblue")} )
        .style("opacity", "1")
        .style("stroke-width", "2")
    }

    // Add dots
    svgScatter.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
        .attr("value", function (d) {return d.id;})
        .attr("class", function (d) { return "dot" } )
        .attr("objectives", function (d) {return [d.y1, d.y2]; })
        .attr("cx", function (d) { return x(d.y1); } )
        .attr("cy", function (d) { return y(d.y2); } )
        .attr("r", 5)
        .style("fill", "lightblue")
    .on("mouseover", highlightScatter)
    .on("mouseleave", doNotHighlightScatter)
})

const svgRegions = d3.select("#regions")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
  "translate(" + margin.left + "," + margin.top + ")");
  
const tooltipRegions = d3.select("#regions")
  .append("div")
  .style("opacity", 1)
  .attr("class", "tooltip")
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "1px")
  .style("border-radius", "5px")
  .style("padding", "10px")

d3.csv("../data/regions.csv").then( function(data) {

  // Here I set the list of dimension manually to control the order of axis:
  dimensions = ["x1", "x2", "x3", "x4", "x5"]
  
  // For each dimension, I build a linear scale. I store all in a y object
  const yPcp = {}
  for (i in dimensions) {
    name = dimensions[i]
    yPcp[name] = d3.scaleLinear()
      .domain( [0,1] ) // --> Same axis range for each group
      // --> different axis range for each group --> .domain( [d3.extent(data, function(d) { return +d[name]; })] )
      .range([height, 0])
  }

  // Build the X scale -> it find the best position for each Y axis
  x = d3.scalePoint()
    .range([0, width])
    .domain(dimensions);

  // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
  function pathRegion(d) {
    var regionPath = "M ";
    regionPath += 0 + " " + (1 - d.x1low)*height + " L ";
    regionPath += 100 + " " + (1 - d.x2low)*height + " L ";
    regionPath += 200 + " " + (1 - d.x3low)*height + " L ";
    regionPath += 300 + " " + (1 - d.x4low)*height + " L ";
    regionPath += 400 + " " + (1 - d.x5low)*height + " L ";
    regionPath += 400 + " " + (1 - d.x5up)*height + " L ";
    regionPath += 300 + " " + (1 - d.x4up)*height + " L ";
    regionPath += 200 + " " + (1 - d.x3up)*height + " L ";
    regionPath += 100 + " " + (1 - d.x2up)*height + " L ";
    regionPath += 0 + " " + (1 - d.x1up)*height;
    regionPath += " Z";
    return regionPath;
  }

  const highlightArea = function(event, d){
    // console.log(svgScatter.selectAll(".dot"));
    d3.select("#regions").selectAll(".area")
      .transition()
      .duration(200)
      .style("fill", "lightgrey")
      .style("opacity", 0.5)

    d3.select(this)
      .transition()
      .duration(200)
      .style("fill", "blue")
      .style("opacity", d3.select(this).attr("confidence") * 0.7 + 0.3)
    
    tooltipRegions.html("ID: " + d3.select(this).attr("value"))
      .transition()
      .duration(500)
      .style("opacity", 1)
      .style("left", (event.x) / 2 + "px")
      .style("top", (event.y) / 2 + "px")
  }

  const doNotHighlightArea = function(event, d){
    d3.select("#regions").selectAll(".area")
      .transition()
      .duration(200)
      .style("fill", "lightblue")
      .style("opacity", d => d.confidence * 0.7 + 0.3)
  }

  // Draw the areas
  svgRegions
  .selectAll("myPath")
  .data(data).enter()
  .append("path")
    .attr("class", "area")
    .attr("d", d => pathRegion(d))
    .attr("upper", function(d) {return [d.x1low, d.x2low, d.x3low, d.x4low, d.x5low]})
    .attr("lower", function(d) {return [d.x1up, d.x2up, d.x3up, d.x4up, d.x5up]})
    .attr("value", function (d) {return d.id; })
    .attr("confidence", function (d) {return d.confidence; })
    .style("fill", "lightblue" )
    .style("opacity", d => d.confidence * 0.7 + 0.3)
  .on("mouseover", highlightArea)
  .on("mouseout", doNotHighlightArea)

  // Draw the axis:
  svgRegions.selectAll("myAxis")
    .data(dimensionsPcp).enter()
    .append("g")
    .attr("class", "axis")
    .attr("transform", function(d) { return `translate(${xPcp(d)})`})
    .each(function(d) { d3.select(this).call(d3.axisLeft().ticks(5).scale(yPcp[d])); })
    .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d) { return d; })
      .style("fill", "black")

})

var slider = document.getElementById("confidenceslider");
var output = document.getElementById("confidenceslidervalue");

slider.oninput = function() {
  output.innerHTML = this.value;
}

// var forbiddenRegionList = document.getElementById("regionslist")

// function updateList() {
//   var regionsData = $.csv.toObjects("../data/regions.csv");
//   console.log(regionsData);
// }
  
// updateList();

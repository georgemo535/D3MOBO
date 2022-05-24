function readTextFile(file, callback) {
  var rawFile = new XMLHttpRequest();
  rawFile.overrideMimeType("application/json");
  rawFile.open("GET", file, true);
  rawFile.onreadystatechange = function() {
      if (rawFile.readyState === 4 && rawFile.status == "200") {
          callback(rawFile.responseText);
      }
  }
  rawFile.send(null);
}

var numParams;
var numObjs;
var parameterNames;
var objectiveNames;
var parameterBounds;
var objectiveBounds;

var renderRegionPlot;
var regionData;
var evaluatedDesigns;
var forbidRangeData;

var designLineData = [{id: "current", x1: 0.5, x2: 0.5, x3: 0.5, x4: 0.5, x5: 0.5}]

async function renderMoboInterface() {

  readTextFile("../configs/config.json", async function(text){
    config = JSON.parse(text);
    numParams = config["dimx"];
    numObjs = config["dimobj"];
    parameterNames = config["parameters"];
    objectiveNames = config["objectives"];
    parameterBounds = config["xbounds"];
    objectiveBounds = config["ybounds"];

    regionData = await parseRegions("../data/regions.csv");
    evaluatedDesigns = await parseDesigns("../data/data.csv")
    forbidRangeData = await parseRanges("../data/ranges.csv")

    drawPcp();
    drawScatter();
    renderRegionPlot = drawRegionPlot();
    renderRegionList();

    document.getElementById('confidence-slider').value = 0.5;
    document.getElementById('confidence-slider').disabled = true;
    document.getElementById('confidence-slider-value').value = "";

    document.getElementById('button-add-forbidden').addEventListener("click", addNewForbiddenRegion);
    document.getElementById('button-delete-forbidden').disabled = true;
    document.getElementById('button-delete-forbidden').addEventListener("click", deleteForbiddenRegion);

    parent.task.document.getElementById('evaluation-button').addEventListener("click", runFormalTest);
    parent.task.document.getElementById('test-button').addEventListener("click", runPilotTest);

    for (var i = 0; i < numParams; i++){
      parent.task.document.getElementById('param' + (i+1) + 'slider').addEventListener("input", drawGuidingLine);
    }

  });
}

const svgWidth = 500;
const svgHeight = 350;

// set the dimensions and margins of the graph
const margin = {top: 20, right: 50, bottom: 40, left: 50},
  width = svgWidth - margin.left - margin.right,
  height = svgHeight - margin.top - margin.bottom;

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
.html("Design Parameters:")

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
.html("Objectives:")

const svgRegions = d3.select("#regions")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
  "translate(" + margin.left + "," + margin.top + ")");

// Function to parse the csv files of the design parameters and objectives into a correct data format
async function parseDesigns(filepath) {
  var data = await d3.csv(filepath, (d) => {
      return {
        id: d.id,
        x1: d.x1,
        x2: d.x2, 
        x3: d.x3,
        x4: d.x4,
        x5: d.x5,
        y1: d.y1,
        y2: d.y2
      };
  });
  return data;
}

// Function to parse the csv files of forbidden regions into a correct data format
async function parseRegions(filepath) {
  var data = await d3.csv(filepath, (d) => {
      return {
        id: d.id,
        lowerBound: [d.x1low, d.x2low, d.x3low, d.x4low, d.x5low],
        upperBound: [d.x1up, d.x2up, d.x3up, d.x4up, d.x5up],
        confidence: d.confidence
      };
  });

  return data;
}

// Function to parse the csv files of forbidden ranges into a correct data format
async function parseRanges(filepath) {
  var data = await d3.csv(filepath, (d) => {
    return {
      id: d.id,
      dim: d.dim,
      low: d.low,
      up: d.up,
      confidence: d.confidence
    };
  });

  return data;
}

// Function to highlight PCP line when hovered over
const highlightPcp = function(event, d){
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
    return d3.select(this).attr("value") != "current";
    })
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
  
  d3.select(this).raise();
  
  let idVal = d3.select(this).attr("value");

  svgScatter.selectAll(".dot").
  filter(function() {
      return d3.select(this).attr("value") == idVal
  }).transition()
    .duration(200)
    .style("fill", "green")
    .attr("r", 7)

  tooltipPcp.html("Design Parameters: " + String(d3.select(this).attr("design")))
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

// Function to not highlight PCP line when not hovered over
const doNotHighlightPcp = function(event, d){
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
      return d3.select(this).attr("value") != "current";
    })
    .transition().duration(200).delay(100)
    .style("stroke", function(d){ return("lightblue")} )
    .style("opacity", "1")
    .style("stroke-width", "2")
  
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
      return d3.select(this).attr("value") == "current";
  }).raise();
  
  d3.select("#scatter").selectAll(".dot")
    .transition()
    .duration(200).delay(100)
    .style("fill", "lightblue")
    .attr("r", 5 )
}

// Function to update design sliders when clicked on a particular design
const onClickDesign = function(event, d){
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
      return d3.select(this).attr("value") != "current";
    })
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

  let parameterValues = JSON.parse("[" + d3.select(this).attr("design") + "]");
  
  // console.log(parameterValues);
  for (var i = 0; i < numParams; i++){
    // console.log(parameterValues[i]);
    parent.task.document.getElementById('param' + (i+1) + 'slider').value = parameterValues[i];
    parent.task.document.getElementById('param' + (i+1) + 'output').value = parameterValues[i];
  }

  drawGuidingLine();
}

// Function to parse data point in right way to input into the PCP
function pathPcp(d) {
  // const line = d3.line()(dimensionsPcp.map(function(p) { return [xPcp(p), yPcp[p](d[p])]; }));
  // return line;
  var lineData = [d.x1, d.x2, d.x3, d.x4, d.x5]
  var linePath = "M" + 0 + "," + (1- lineData[0]) * height;

  for (var i = 1; i < lineData.length; i++){
    linePath += "L" + (i) * 100 + "," + (1 - lineData[i])*height;
  }
  return linePath;
}

// Function to draw the PCP plots for the evaluated designs
function drawPcp() {
  // append the svg object to the body of the page
  dimensionsPcp = parameterNames;

  const yPcp = {}
  for (i in dimensionsPcp) {
    yPcp[dimensionsPcp[i]] = d3.scaleLinear()
      .domain( parameterBounds[i] )
      .range([height, 0])
  }
  xPcp = d3.scalePoint()
    .range([0, width])
    .domain(dimensionsPcp);

  svgPcp
    .selectAll("myPath")
    .data(evaluatedDesigns).enter()
    .append("path")
    // .join("path")
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
      .on("click", onClickDesign)

  svgPcp.selectAll("myAxis")
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
  
  svgPcp
  .selectAll("myPath")
  .data(designLineData).enter()
  .append("path")
  // .join("path")
    .attr("class", function (d) { return "line"; } ) // 2 class for each line: 'line' and the group name
    .attr("d", d => pathPcp(d))
    .attr("value", function (d) {return d.id; })
    .attr("design", function (d) {return [d.x1, d.x2, d.x3, d.x4, d.x5]; })
    .style("fill", "none" )
    .style("stroke", function(d){ return( "red")} )
    .style("opacity", 1.0)
    .style("stroke-width", "2")
}

// Function to draw the design line
function drawDesignLine() {
  // console.log(designLineData);
  svgPcp
  .selectAll("myPath")
  .data(designLineData).enter()
  .append("path")
  // .join("path")
    .attr("class", function (d) { return "line"; } ) // 2 class for each line: 'line' and the group name
    .attr("d", function(d) { return pathPcp(d);})
    .attr("value", function (d) {return d.id; })
    .attr("design", function (d) {return [d.x1, d.x2, d.x3, d.x4, d.x5]; })
    .style("fill", "none" )
    .style("stroke", function(d){ return( "red")} )
    .style("opacity", 1.0)
    .style("stroke-width", "2")
}

// Function to draw the guiding line that follows the 
const drawGuidingLine = function(event){
  // console.log(this.name.replace("param", ""));
  
  var paramSliders = []
  for (var i = 0; i < numParams; i++){
    var valueSlider = parent.task.document.getElementById('param' + (i+1) + 'slider').value;
    paramSliders.push(valueSlider);
  }

  for (var i = 0; i < numParams; i++){
    designLineData[0][parameterNames[i]] = paramSliders[i];
  }

  d3.selectAll(".line").filter(function(){
    return d3.select(this).attr("value") == "current";
  }).remove();

  drawDesignLine();
}

// Function to highlight scattered point when hovered over
const highlightScatter = function(event, d){
  d3.select("#scatter").selectAll(".dot")
    .transition()
    .duration(200)
    .style("fill", "lightgrey")
    .attr("r", 3)
  
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
      return d3.select(this).attr("value") != "current";
    })
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
  
  var correspondingLine = svgPcp.selectAll(".line").filter(function() {
      return d3.select(this).attr("value") == idVal
  })
  
  correspondingLine
    .transition().duration(200)
    .style("stroke", "green")
    .style("opacity", "1")
    .style("stroke-width", "4");
  
  correspondingLine.raise();
  
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

const onClickScatter = function(event, d){
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
      return d3.select(this).attr("value") != "current";
    })
    .transition().duration(200)
    .style("stroke", "lightgrey")
    .style("opacity", "0.5")
  
  d3.select("#scatter").selectAll(".dot")
    .transition()
    .duration(200)
    .style("fill", "lightgrey")
    .attr("r", 3)

  d3.select(this)
    .transition()
    .duration(200)
    .style("fill", "green")
    .attr("r", 7)

  let idVal = d3.select(this).attr("value");

  var lineDesign = svgPcp.selectAll(".line").filter(function() {
    return d3.select(this).attr("value") == idVal
  });

  console.log(lineDesign.attr("value"));

  lineDesign
    .transition().duration(200)
    .style("stroke", "green")
    .style("opacity", "1")
    .style("stroke-width", "4")

  let parameterValues = JSON.parse("[" + lineDesign.attr("design") + "]");
  
  // console.log(parameterValues);
  for (var i = 0; i < numParams; i++){
    // console.log(parameterValues[i]);
    parent.task.document.getElementById('param' + (i+1) + 'slider').value = parameterValues[i];
    parent.task.document.getElementById('param' + (i+1) + 'output').value = parameterValues[i];
  }

  drawGuidingLine();
}

// Function to not highlight scattered points when not hovered over
const doNotHighlightScatter = function(event, d){
  d3.select("#scatter").selectAll(".dot")
    .transition()
    .duration(200).delay(500)
    .style("fill", "lightblue")
    .attr("r", 5 )
  
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
      return d3.select(this).attr("value") != "current";
    })
    .transition().duration(200).delay(500)
    .style("stroke", function(d){ return("lightblue")} )
    .style("opacity", "1")
    .style("stroke-width", "2")
  
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
      return d3.select(this).attr("value") == "current";
  }).raise();
}

// Function to draw the scattered plots for the objective values of the evaluated designs
function drawScatter() {
  const x = d3.scaleLinear()
      .domain(objectiveBounds[0])
      .range([ 0, width ]);
  svgScatter.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  const y = d3.scaleLinear()
      .domain(objectiveBounds[1])
      .range([ height, 0]);
  svgScatter.append("g")
      .call(d3.axisLeft(y));

  svgScatter.append('g')
  .selectAll("dot")
  .data(evaluatedDesigns).enter()
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
  .on("click", onClickScatter)

  svgScatter.append("text")
    .attr("text-anchor", "end")
    .attr("x", width/2 + margin.left)
    .attr("y", height + margin.top + 20)
    .text(objectiveNames[0]);

  svgScatter.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top - height/2 + 20)
    .text(objectiveNames[1]);
}

// Function to highlight forbidden region area when hovered over
const highlightArea = function(event, d){
  // console.log(svgScatter.selectAll(".dot"));
  d3.select("#regions").selectAll(".area")
    .transition()
    .duration(200)
    .style("fill", "lightgrey")
    .style("opacity", d => d.confidence * 0.5 + 0.2)

  d3.select(this)
    .raise()
    .transition()
    .duration(200)
    .style("fill", "blue")
    .style("opacity", d3.select(this).attr("confidence") * 0.7 + 0.3)
}

// Function to not highlight forbidden region area when not hovered over
const doNotHighlightArea = function(event, d){
  d3.select("#regions").selectAll(".area")
    .transition()
    .duration(200)
    .style("fill", "lightgrey")
    .style("opacity", d => d.confidence * 0.5 + 0.2)
}

// Function to draw the forbidden region plot
function drawRegionPlot() {
  // regionData = await parseRegions("../data/regions.csv");
  console.log(regionData);

  svgRegions.selectAll("*").remove();

  dimensions = parameterNames;
  dimensionsPcp = parameterNames;

  xPcp = d3.scalePoint()
  .range([0, width])
  .domain(dimensionsPcp);
  
  const yPcp = {}
  for (i in dimensions) {
    name = dimensions[i]
    yPcp[name] = d3.scaleLinear()
      .domain( parameterBounds[i] ) 
      .range([height, 0])
  }

  x = d3.scalePoint()
    .range([0, width])
    .domain(dimensions);

  var y = d3.scaleLinear()
    .rangeRound([height, 0]);
    
  // The path function take a row of the csv as input, and return x and y coordinates of the area to draw for this raw.
  function pathRegion(d) {
    var regionPath = "M ";

    for (var i = 0; i < d.lowerBound.length; i++){
        regionPath += (i) * 100 + " " + (1 - d.lowerBound[i])*height + " L ";
    }
    for (var i = d.upperBound.length-1; i > 0; i--){
        regionPath += (i) * 100 + " " + (1 - d.upperBound[i])*height + " L ";
    }
    regionPath += 0 + " " + (1 - d.upperBound[0])*height;
    regionPath += " Z";
    console.log(regionPath);
    return regionPath;
  }
  
  function pathRange(d) {
    var rangePath = "M ";
    var halfWidth = 5;

    rangePath += ((d.dim - 1) * 100 - halfWidth) + " " + (1 - d.low)*height;
    rangePath += " L " + ((d.dim - 1) * 100 + halfWidth) + " " + (1 - d.low)*height;
    rangePath += "L" + ((d.dim - 1) * 100 + halfWidth) + " " + (1 - d.up)*height;
    rangePath += "L" + ((d.dim - 1) * 100 - halfWidth) + " " + (1 - d.up)*height;
    rangePath += " Z";

    return rangePath;
  }

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
  
  // Draw the forbidden region areas
  svgRegions
  .selectAll("myPath")
  .data(regionData).enter()
  .append("path")
    .attr("class", "area")
    .attr("type", "region")
    .attr("d", d => pathRegion(d))
    .attr("upper", d => d.upperBound)
    .attr("lower", d => d.lowerBound)
    .attr("value", function (d) {return d.id; })
    .attr("confidence", function (d) {return d.confidence; })
    .attr("selected", false)
    .style("fill", "lightgrey" )
    .style("opacity", d => d.confidence * 0.5 + 0.2)    
  .on("mouseover", highlightArea)
  .on("mouseout", doNotHighlightArea)
  .on("click", selectRegion)

  // Draw forbidden ranges
  svgRegions
  .selectAll("myPath")
  .data(forbidRangeData).enter()
  .append("path")
    .attr("class", "area")
    .attr("type", "range")
    .attr("d", d => pathRange(d))
    .attr("upper", d => d.up)
    .attr("lower", d => d.low)
    .attr("value", function (d) {return d.id; })
    .attr("confidence", function (d) {return d.confidence; })
    .attr("selected", false)
    .style("fill", "lightgrey" )
    .style("opacity", d => d.confidence * 0.5 + 0.2)    
  .on("mouseover", highlightArea)
  .on("mouseout", doNotHighlightArea)
  .on("click", selectRegion)

  // Draw the forbidden region draggable circles
  svgRegions
  .selectAll("myPath")
  .data(regionData)
  .enter()
  .append("g")
  .attr("class", "group-circles")
  .selectAll("circle")
  .data(function(d) {
      // console.log(d);
      var dPt = [
          { "id": d.id, "value": "lower", "x": 0, "y": d.lowerBound[0] },
          { "id": d.id, "value": "upper", "x": 0, "y": d.upperBound[0] },
          { "id": d.id, "value": "lower", "x": 100, "y": d.lowerBound[1] },
          { "id": d.id, "value": "upper", "x": 100, "y": d.upperBound[1] },
          { "id": d.id, "value": "lower", "x": 200, "y": d.lowerBound[2] },
          { "id": d.id, "value": "upper", "x": 200, "y": d.upperBound[2] },
          { "id": d.id, "value": "lower", "x": 300, "y": d.lowerBound[3] },
          { "id": d.id, "value": "upper", "x": 300, "y": d.upperBound[3] },
          { "id": d.id, "value": "lower", "x": 400, "y": d.lowerBound[4] },
          { "id": d.id, "value": "upper", "x": 400, "y": d.upperBound[4] },
      ]
      return dPt;
      })
  .enter()
  .append("circle")    
    .attr("cx", function (d) { return d.x; } )
    .attr("cy", function (d) { return (1 - d.y)*height; } )
    .attr("type", "region")
    .attr("class", function (d) { return "dot" } )
    .attr("regionid", function(d) {return d.id; })
    .attr("pointid", function(d) {return d.value + "dim" + d.x + "id" + d.id; })
    .style("fill", "lightblue" )
    .attr("r", 0)

  // Add interactions to the dragging points of forbidden region
  svgRegions
    .selectAll("circle").filter(function() {
      return d3.select(this).attr("type") == "region";
    })
    .call(d3.drag()
      .on('drag', function(event, d) {            
          var yVal = +d.y - (1 - y.invert(event.y));
          // console.log(pointID);
          if (d.value == "upper"){
            var lowerBound = svgRegions.selectAll(".dot")
            .filter(function() {
                return d3.select(this).attr("pointid") == "lower" + "dim" + d.x + "id" + d.id;
            }).attr("cy");
            var newY = Math.min((1 - yVal) * height, lowerBound - 0.05 * height);
            // console.log(newY);
            d3.select(this).attr('cy', function(d) {return Math.max(0, newY); })
          } else {
            var upperBound = svgRegions.selectAll(".dot")
            .filter(function() {
                return d3.select(this).attr("pointid") == "upper" + "dim" + d.x + "id" + d.id;
            }).attr("cy");
            // console.log(upperBound);
            var newY = Math.max((1 - yVal) * height, Number(upperBound) + 0.05 * Number(height));
            // console.log(newY);
            d3.select(this).attr('cy', function(d) {return Math.min(height, newY); })
          }

      })
      .on("end", function(event, d) {
          var yVal = +d.y - (1 - y.invert(event.y));
          d.y = +d.y - (1 - y.invert(event.y));
          // console.log(pointID);
          if (d.value == "upper"){
            var lowerBound = svgRegions.selectAll(".dot")
            .filter(function() {
                return d3.select(this).attr("pointid") == "lower" + "dim" + d.x + "id" + d.id;
            }).attr("cy");
            var lowerBoundConvert = 1 - lowerBound / height + 0.05;

            for (var i = 0; i < regionData.length; i++){
              if (regionData[i].id == d.id){
                regionData[i].upperBound[d.x/100] = Math.min(1, Math.max(yVal, lowerBoundConvert));
              }
            }

          } else {
            var upperBound = svgRegions.selectAll(".dot")
            .filter(function() {
                return d3.select(this).attr("pointid") == "upper" + "dim" + d.x + "id" + d.id;
            }).attr("cy");
            var upperBoundConvert = 1 - upperBound / height - 0.05;

            for (var i = 0; i < regionData.length; i++){
              if (regionData[i].id == d.id){
                regionData[i].lowerBound[d.x/100] = Math.max(0, Math.min(yVal, upperBoundConvert));
              }
            }
          }        
          
          svgRegions
            .selectAll("myPath")                
            .data(regionData)
            .enter()
            .selectAll(".area").filter(function() {
              return d3.select(this).attr("type") == "region";
            })
            .attr("d", pathRegion);
        })
    );
  
  // Draw Buttons to add forbidden ranges
  for (var i = 0; i < numParams; i++) {
    var wButton = 20;
    var hButton = 20;
    var xCenter = i*100;
    var yCenter = height + 20;

    var addForbiddenRangeButton = svgRegions.append("g")
      .attr("transform", "translate(" + xCenter + "," + yCenter + ")")
      //.attr("x", xTopLeft)
      //.attr("y", yTopLeft);

    addForbiddenRangeButton
      .append('rect')
           .attr("x", -wButton/2)
           .attr("y", -hButton/2)
           .attr("rx", 5)
           .attr("ry", 5)
           .attr("width", wButton)
           .attr("height", hButton)
           .attr("id", "button-range-dim-" + (i+1))
           .attr("dim", i+1)
           .style("stroke", '#5c5c5c')
           .attr('stroke-width', '2')
           .style("fill", 'white')
           .on("click", addForbiddenRange)

    addForbiddenRangeButton.append("text")
                           .style("text-anchor", "middle")
                           .style("alignment-baseline", "central")
                           .style("pointer-events", "none")
                           .attr("y", -1)
                           .text("+")
  }

  // Draw forbidden ranges draggable circles

  svgRegions
  .selectAll("myPath")
  .data(forbidRangeData)
  .enter()
  .append("g")
  .attr("class", "group-circles")
  .selectAll("circle")
  .data(function(d) {
      var dPt = [
          { "id": d.id, "value": "lower", "x": d.dim-1, "y": d.low },
          { "id": d.id, "value": "upper", "x": d.dim-1, "y": d.up },
      ]
      return dPt;
      })
  .enter()
  .append("circle")    
    .attr("cx", function (d) { return d.x * 100; } )
    .attr("cy", function (d) { return (1 - d.y)*height; } )
    .attr("type", "range")
    .attr("class", function (d) { return "dot" } )
    .attr("regionid", function(d) {return d.id; })
    .attr("pointid", function(d) {return d.value + "id" + d.id; })
    .style("fill", "lightblue" )
    .attr("r", 0)

  // Add interactions to the dragging points of forbidden range
  svgRegions
    .selectAll("circle").filter(function() {
      return d3.select(this).attr("type") == "range";
    })
    .call(d3.drag()
      .on('drag', function(event, d) {            
          var yVal = +d.y - (1 - y.invert(event.y));

          if (d.value == "upper"){
            var lowerBound = svgRegions.selectAll(".dot")
            .filter(function() {
                return d3.select(this).attr("pointid") == "lower" + "id" + d.id;
            }).attr("cy");
            var newY = Math.min((1 - yVal) * height, lowerBound - 0.05 * height);

            d3.select(this).attr('cy', function(d) {return Math.max(0, newY); })
          } else {
            var upperBound = svgRegions.selectAll(".dot")
            .filter(function() {
                return d3.select(this).attr("pointid") == "upper" +"id" + d.id;
            }).attr("cy");

            var newY = Math.max((1 - yVal) * height, Number(upperBound) + 0.05 * Number(height));

            d3.select(this).attr('cy', function(d) {return Math.min(height, newY); })
          }

      })
      .on("end", function(event, d) {
          var yVal = +d.y - (1 - y.invert(event.y));
          d.y = +d.y - (1 - y.invert(event.y));

          if (d.value == "upper"){
            var lowerBound = svgRegions.selectAll(".dot")
            .filter(function() {
                return d3.select(this).attr("pointid") == "lower" + "id" + d.id;
            }).attr("cy");
            var lowerBoundConvert = 1 - lowerBound / height + 0.05;

            for (var i = 0; i < forbidRangeData.length; i++){
              if (forbidRangeData[i].id == d.id){
                forbidRangeData[i].up = Math.min(1, Math.max(yVal, lowerBoundConvert));
              }
            }

          } else {
            var upperBound = svgRegions.selectAll(".dot")
            .filter(function() {
                return d3.select(this).attr("pointid") == "upper" + "id" + d.id;
            }).attr("cy");
            var upperBoundConvert = 1 - upperBound / height - 0.05;

            for (var i = 0; i < forbidRangeData.length; i++){
              if (forbidRangeData[i].id == d.id){
                forbidRangeData[i].low = Math.max(0, Math.min(yVal, upperBoundConvert));
              }
            }
          }        
          
          svgRegions
            .selectAll("myPath")                
            .data(forbidRangeData)
            .enter()
            .selectAll(".area").filter(function() {
              return d3.select(this).attr("type") == "range";
            })
            .attr("d", pathRange);
        })
  );
}

// Function to render the forbidden region list given global variable of regionData
function renderRegionList() {
  // console.log("Loading forbidden regions")
  // var regionData = await parseRegions("../data/regions.csv");
  var parentList = document.getElementById("forbidden-list");
  while (parentList.firstChild) {
    parentList.firstChild.remove();
  }

  var numberForbiddenRegions = regionData.length;
  
  for (var i = 0; i < numberForbiddenRegions; i++){
    var regionID = regionData[i].id;
    // console.log(regionID);
    var inputTxt = "<input type='radio' id='region-tick-" + regionID +  "' name='forbidden-tick' value=" + regionID + ">"
    var labelTxt = "<label for='forbidden" + regionID + "'>" + (i+1) + "</label><br>"

    $("#forbidden-region-list").append(inputTxt)
    $("#forbidden-region-list").append(labelTxt)
  }

  var numberForbiddenRanges = forbidRangeData.length;

  for (var i = 0; i < numberForbiddenRanges; i++){
    var rangeID = forbidRangeData[i].id;

    var inputTxt = "<input type='radio' id='range-tick-" + rangeID +  "' name='forbidden-tick' value=" + rangeID + ">"
    var labelTxt = "<label for='forbidden" + rangeID + "'>" + (i+1) + "</label><br>"

    $("#forbidden-range-list").append(inputTxt)
    $("#forbidden-range-list").append(labelTxt)
  }

  let radios = document.querySelectorAll('input[type=radio]');
  for (i=0; i < radios.length; i++){
    radios[i].onclick = function(e) {
      if (e.ctrlKey) {
        this.checked = false;
      }
    }
  }

  radios.forEach(function(elem) {
    elem.addEventListener("click", updateShownRegion);
    // elem.addEventListener("deselct", doNotShowRegion)
  })

  let slider = document.getElementById('confidence-slider');
  slider.addEventListener("mouseup", updateConfidenceSlider);

  let clearSelection = document.getElementById("clear-selection-button");
  clearSelection.addEventListener("click", clearAllSelection)
}

// Update the shown region on the forbidden regions chart with selected from the forbidden region list
function updateShownRegion() {
  // console.log(this.checked);
  // console.log(this);
  var selectedRegionID = this.value;
  var selectedRegionName = this.id;

  var isRegion = selectedRegionName.startsWith("region");

  var correspondingRegion;
  var dragPoints;

  if (isRegion){
    correspondingRegion = svgRegions.selectAll(".area")
      .filter(function() {
          return (d3.select(this).attr("value") == selectedRegionID && d3.select(this).attr("type") == "region");
      })
    dragPoints = svgRegions.selectAll(".dot")
      .filter(function() {
          return (d3.select(this).attr("regionid") == selectedRegionID && d3.select(this).attr("type") == "region");
    });
  }
  else {
    correspondingRegion = svgRegions.selectAll(".area")
      .filter(function() {
          return (d3.select(this).attr("value") == selectedRegionID && d3.select(this).attr("type") == "range");
      })
    dragPoints = svgRegions.selectAll(".dot")
      .filter(function() {
          return (d3.select(this).attr("regionid") == selectedRegionID && d3.select(this).attr("type") == "range");
    });
  }

  if (this.checked) {
    // console.log(correspondingRegion.attr("confidence"));
    svgRegions.selectAll(".area").transition()
    .duration(200)
    .style("fill", "lightgrey")
    .style("opacity", d => d.confidence * 0.5 + 0.2);

    correspondingRegion.transition()
      .duration(200)
      .style("fill", "blue")
      .style("opacity", correspondingRegion.attr("confidence") * 0.7 + 0.3);
    
    svgRegions.selectAll(".dot").attr("r", 0);
    dragPoints.attr("r", 5);

    svgRegions.selectAll(".area").on("mouseover", null);
    svgRegions.selectAll(".area").on("mouseout", null);

    document.getElementById('confidence-slider').disabled = false;
    document.getElementById('confidence-slider').value = correspondingRegion.attr("confidence");
    document.getElementById('confidence-slider-value').value = correspondingRegion.attr("confidence");

    document.getElementById('button-delete-forbidden').disabled = false;

    // console.log(regionData);
    // regionData[selectedRegionID-1].confidence = document.getElementById('confidence-slider').value;

  } else {
    svgRegions.selectAll(".area").transition()
    .duration(200)
    .style("fill", "lightgrey")
    .style("opacity", d => d.confidence * 0.5 + 0.2);

    svgRegions.selectAll(".dot").attr("r", 0);

    svgRegions.selectAll(".area").on("mouseover", highlightArea);
    svgRegions.selectAll(".area").on("mouseout", doNotHighlightArea);

    document.getElementById('confidence-slider').value = 0.5;
    document.getElementById('confidence-slider').disabled = true;
    document.getElementById('confidence-slider-value').value = "";

    document.getElementById('button-delete-forbidden').disabled = true;
  }

}

// Update the confidence value of the selected forbidden region when mouse released from confidence slider
function updateConfidenceSlider() {
  let radios = document.querySelectorAll('input[type=radio]');
  var selectedID;
  var selectedName;
  for (i=0; i < radios.length; i++){
    if (radios[i].checked){
      selectedID = radios[i].value;
      selectedName = radios[i].id;
    }
  }
  // console.log(selectedID);

  var isRegion = selectedName.startsWith("region");
  var correspondingRegion;

  if (isRegion) {
    correspondingRegion = svgRegions.selectAll(".area")
    .filter(function() {
        console.log(d3.select(this).attr("value"));
        return (d3.select(this).attr("value") == selectedID && d3.select(this).attr("type") == "region");
    })
  }
  else {
    correspondingRegion = svgRegions.selectAll(".area")
    .filter(function() {
        console.log(d3.select(this).attr("value"));
        return (d3.select(this).attr("value") == selectedID && d3.select(this).attr("type") == "range");
    })
  }
  
  console.log(correspondingRegion);
  
  if (isRegion){
    for (var i = 0; i < regionData.length; i++){
      if (regionData[i].id == selectedID){
        regionData[i].confidence = this.value;
      }
    }
  } 
  else {
    for (var i = 0; i < forbidRangeData.length; i++){
      if (forbidRangeData[i].id == selectedID){
        forbidRangeData[i].confidence = this.value;
      }
    }
  }
  // regionData[selectedID].confidence = this.value;
  correspondingRegion.attr("confidence", this.value);
  correspondingRegion.transition()
    .duration(200)
    .style("fill", "blue")
    .style("opacity", correspondingRegion.attr("confidence") * 0.7 + 0.3);

  // console.log(regionData);
}

// Update the shown region on forbidden regions chart when selected from the chart (clicked on area)
const selectRegion = function(event, d){
  var regionID = d3.select(this).attr("value");
  var regionType = d3.select(this).attr("type");

  console.log(regionType);

  d3.select("#regions").selectAll(".area")
    .style("fill", "lightgrey")
    .style("opacity", d => d.confidence * 0.5 + 0.2)

  d3.select(this).raise()

  d3.select(this)
    .style("fill", "blue")
    .style("opacity", d3.select(this).attr("confidence") * 0.7 + 0.3)

  svgRegions.selectAll(".area").on("mouseover", null);
  svgRegions.selectAll(".area").on("mouseout", null);

  svgRegions.selectAll(".dot").attr("r", 0);

  var dragPoints = svgRegions.selectAll(".dot")
  .filter(function() {
      return (d3.select(this).attr("regionid") == regionID && d3.select(this).attr("type") == regionType);
  });

  dragPoints.attr("r", 5);
  
  svgRegions.selectAll(".group-circles").each( function() {d3.select(this).raise(); })

  // console.log(groupPoints);
  
  let radios = document.querySelectorAll('input[type=radio]');
  for (i=0; i < radios.length; i++){
    if (radios[i].value == regionID && radios[i].id.startsWith(regionType)){
      radios[i].checked = true;
    }
  }

  document.getElementById('confidence-slider').disabled = false;
  document.getElementById('confidence-slider').value = d3.select(this).attr("confidence");
  document.getElementById('confidence-slider-value').value = d3.select(this).attr("confidence");

  document.getElementById('button-delete-forbidden').disabled = false;
}

// Update to not select any forbidden region after clicking the clear button
function clearAllSelection(){
  let radios = document.querySelectorAll('input[type=radio]');
  for (i=0; i < radios.length; i++){
    radios[i].checked = false;
  }

  svgRegions.selectAll(".area").transition()
    .duration(200)
    .style("fill", "lightgrey")
    .style("opacity", d => d.confidence * 0.5 + 0.2);

  svgRegions.selectAll(".dot").attr("r", 0);

  svgRegions.selectAll(".area").on("mouseover", highlightArea);
  svgRegions.selectAll(".area").on("mouseout", doNotHighlightArea);

  document.getElementById('confidence-slider').value = 0.5;
  document.getElementById('confidence-slider').disabled = true;
  document.getElementById('confidence-slider-value').value = "";

  document.getElementById('button-delete-forbidden').disabled = true;
}

// Update to add a new forbidden region when clicked on the add forbidden region button
function addNewForbiddenRegion() {
  var defaultWidth = 0.05;
  var upperBounds = [];
  var lowerBounds = [];
  var defaultConfidence = 0.8;
  for (var i = 0; i < numParams; i++){
    // console.log(parameterValues[i]);
    dataEntered = Number(parent.task.document.getElementById('param' + (i+1) + 'slider').value);
    upperBounds.push(Math.min(dataEntered + defaultWidth, 1.0));
    lowerBounds.push(Math.max(dataEntered - defaultWidth, 0.0));
  }
  
  var takenMaxID = 0;
  for (var i = 0; i < regionData.length; i++){
    if (regionData[i].id > takenMaxID){
      takenMaxID = regionData[i].id;
    }
  }
  console.log(takenMaxID);

  var newID = Number(takenMaxID) + 1;
  var newRegionData = {
    id: String(newID), 
    lowerBound: lowerBounds, 
    upperBound: upperBounds, 
    confidence: String(defaultConfidence)};
  regionData.push(newRegionData);

  drawRegionPlot();
  renderRegionList();

  d3.select("#regions").selectAll(".area")
    .style("fill", "lightgrey")
    .style("opacity", d => d.confidence * 0.5 + 0.2)
  
  var selectedNewRegion = d3.select("#regions").selectAll(".area")
  .filter(function() {
    return d3.select(this).attr("value") == String(newID);
  })

  selectedNewRegion
    .style("fill", "blue")
    .style("opacity", defaultConfidence * 0.7 + 0.3)
  
  svgRegions.selectAll(".area").on("mouseover", null);
  svgRegions.selectAll(".area").on("mouseout", null);

  svgRegions.selectAll(".dot").attr("r", 0);

  var dragPoints = svgRegions.selectAll(".dot")
  .filter(function() {
      return d3.select(this).attr("regionid") == String(newID);
  });

  dragPoints.attr("r", 5);
  
  let radios = document.querySelectorAll('input[type=radio]');
  for (i=0; i < radios.length; i++){
    if (radios[i].value == newID){
      radios[i].checked = true;
    }
  }

  document.getElementById('confidence-slider').disabled = false;
  document.getElementById('confidence-slider').value = selectedNewRegion.attr("confidence");
  document.getElementById('confidence-slider-value').value = selectedNewRegion.attr("confidence");

  document.getElementById('button-delete-forbidden').disabled = false;
}

// Update to delete a selected forbidden region
function deleteForbiddenRegion() {
  console.log("Hello");

  var idSelected;
  var isRegion;
  var radiosList = document.querySelectorAll('input[type=radio]');
  
  for (var i = 0; i < radiosList.length; i++){
    if (radiosList[i].checked == true) {
      idSelected = radiosList[i].value;
      isRegion = radiosList[i].id.startsWith("region");
    }
  }

  // Find id in regionsData
  if (isRegion){
    for (var i = 0; i < regionData.length; i++){
      if (regionData[i].id == idSelected){
        regionData.splice(i, 1);
      }
    }
  }
  else {
    for (var i = 0; i < forbidRangeData.length; i++){
      if (forbidRangeData[i].id == idSelected){
        forbidRangeData.splice(i, 1);
      }
    }
  }

  console.log(regionData);
  console.log(forbidRangeData);

  drawRegionPlot();
  renderRegionList();

  document.getElementById('confidence-slider').disabled = true;
  document.getElementById('confidence-slider').value = 0.5;
  document.getElementById('confidence-slider-value').value = "";

  document.getElementById('button-delete-forbidden').disabled = true;
}

// Function to add a custom forbidden range depending on slider value
const addForbiddenRange = function(event) {
  var dimensionSelected = d3.select(this).attr("dim");
  var defaultWidth = 0.05;
  var defaultConfidence = 0.8;

  var dataEntered = Number(parent.task.document.getElementById('param' + (dimensionSelected) + 'slider').value);
  var upperBound = Math.min(dataEntered + defaultWidth, 1.0)
  var lowerBound = Math.max(dataEntered - defaultWidth, 0.0)

  var takenMaxID = 0;
  for (var i = 0; i < forbidRangeData.length; i++){
    if (forbidRangeData[i].id > takenMaxID){
      takenMaxID = forbidRangeData[i].id;
    }
  }
  var newID = Number(takenMaxID) + 1;

  var newRegionData = {
    id: String(newID), 
    dim: dimensionSelected,
    low: lowerBound, 
    up: upperBound, 
    confidence: String(defaultConfidence)};
  forbidRangeData.push(newRegionData);

  drawRegionPlot();
  renderRegionList();

  d3.select("#regions").selectAll(".area")
    .style("fill", "lightgrey")
    .style("opacity", d => d.confidence * 0.5 + 0.2)
  
  var selectedNewRange = d3.select("#regions").selectAll(".area")
  .filter(function() {
    return (d3.select(this).attr("value") == String(newID) && d3.select(this).attr("type") == "range");
  })

  selectedNewRange
    .style("fill", "blue")
    .style("opacity", defaultConfidence * 0.7 + 0.3)
  
  svgRegions.selectAll(".area").on("mouseover", null);
  svgRegions.selectAll(".area").on("mouseout", null);
  
  svgRegions.selectAll(".dot").attr("r", 0);

  var dragPoints = svgRegions.selectAll(".dot")
  .filter(function() {
      return (d3.select(this).attr("regionid") == String(newID) && d3.select(this).attr("type") == "range");
  });

  dragPoints.attr("r", 5);

  let radios = document.querySelectorAll('input[type=radio]');
  for (i=0; i < radios.length; i++){
    if (radios[i].value == newID && radios[i].id.startsWith("range")){
      radios[i].checked = true;
    }
  }

  document.getElementById('confidence-slider').disabled = false;
  document.getElementById('confidence-slider').value = selectedNewRange.attr("confidence");
  document.getElementById('confidence-slider-value').value = selectedNewRange.attr("confidence");

  document.getElementById('button-delete-forbidden').disabled = false;
}

const TestType = {            
  FORMAL: 0,
  PILOT: 1,
};

function runPilotTest() {
  console.log("runPilotTest");

  parent.task.document.getElementById("test-result").textContent = ""
  var progressBarHtml = "<progress id='test-progress' value='0' max='100'></progress>";
  parent.task.document.getElementById("test-result").innerHTML += progressBarHtml;
  $('.button').prop('disabled', true);
  parent.task.document.getElementById("test-button").disabled = true;
  parent.task.document.getElementById("evaluation-button").disabled = true;

  var paramVals = [];
  var inputSliders = parent.task.document.querySelectorAll(".slider");
  
  console.log(inputSliders);

  for (var i = 0; i < inputSliders.length; i++){
    var name = inputSliders[i].id;
    var val = inputSliders[i].value;
    console.log(name + ": " + val);
    paramVals.push(val);
  }

  getTestResult(paramVals, TestType.PILOT);

  var waitTime = 1; //s, this should be the same as in the python script
  var progressStep = 1 / waitTime * 10;
  var progressVal = 0;
  const progressInterval = setInterval(function () {
      parent.task.document.getElementById("test-progress").value = progressVal;
      progressVal += progressStep; 
      if (progressVal > 100) {
          clearInterval(progressInterval);
      }
  }, 100);
}

function runFormalTest() {
  console.log("runFormalTest");

  parent.task.document.getElementById("test-result").textContent = ""
  var progressBarHtml = "<progress id='test-progress' value='0' max='100'></progress>";
  parent.task.document.getElementById("test-result").innerHTML += progressBarHtml;
  $('.button').prop('disabled', true);
  parent.task.document.getElementById("test-button").disabled = true;
  parent.task.document.getElementById("evaluation-button").disabled = true;

  var paramVals = [];
  var inputSliders = parent.task.document.querySelectorAll(".slider");
  
  console.log(inputSliders);

  for (var i = 0; i < inputSliders.length; i++){
    var name = inputSliders[i].id;
    var val = inputSliders[i].value;
    console.log(name + ": " + val);
    paramVals.push(val);
  }

  getTestResult(paramVals, TestType.FORMAL);

  var waitTime = 5; //s, this should be the same as in the python script
  var progressStep = 1 / waitTime * 10;
  var progressVal = 0;
  const progressInterval = setInterval(function () {
      parent.task.document.getElementById("test-progress").value = progressVal;
      progressVal += progressStep; 
      if (progressVal > 100) {
          clearInterval(progressInterval);
      }
  }, 100);

}

function getTestResult(paramVals, testType) {
  var paramValsJson = JSON.stringify(paramVals);
  var objVals;

  $.ajax({
      url: "/cgi/dummy_task_model.py",
      type: "post",
      datatype:"json",                    
      data: { 'param_vals'        :paramValsJson,
              'test_type'         :testType },                    
      success: function(result) {
        submitReturned = true;
        // console.log(result.message);
        objVals = JSON.parse(result.message).obj_vals

        // TODO handle returned objVals
        parent.task.document.getElementById("test-result").innerHTML += "<br>" + (objVals[0] + " , " + objVals[1]);
        parent.task.document.querySelectorAll(".button").disabled = false;

        $('.button').prop('disabled', false);
        parent.task.document.getElementById("test-button").disabled = false;
        parent.task.document.getElementById("evaluation-button").disabled = false;
        
        if (testType == TestType.FORMAL){
          var maxID = evaluatedDesigns.length;
          var newDesignData = {id: maxID+1,
                              x1: paramVals[0],
                              x2: paramVals[1],
                              x3: paramVals[2],
                              x4: paramVals[3],
                              x5: paramVals[4],
                              y1: objVals[0],
                              y2: objVals[1]}
          evaluatedDesigns.push(newDesignData);
        }

        drawPcp();
        drawScatter();
      },
      error: function(result){
          console.log("Error in getTestResult: " + result.message);
      }
  });
}


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

function renderMoboInterface() {

  readTextFile("../configs/config.json", function(text){
    config = JSON.parse(text);
    numParams = config["dimx"];
    numObjs = config["dimobj"];
    parameterNames = config["parameters"];
    objectiveNames = config["objectives"];
    parameterBounds = config["xbounds"];
    objectiveBounds = config["ybounds"];

    drawPcp();
    drawScatter();
    drawRegionPlot();
  });
}

const svgWidth = 500;
const svgHeight = 350;

// set the dimensions and margins of the graph
const margin = {top: 20, right: 50, bottom: 20, left: 50},
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

function drawPcp() {
  // append the svg object to the body of the page
      
  d3.csv("../data/data.csv").then( function(data) {
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

    const highlightPcp = function(event, d){
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

    const onClickDesign = function(event, d){
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

      let parameterValues = JSON.parse("[" + d3.select(this).attr("design") + "]");
      
      // console.log(parameterValues);
      for (var i = 0; i < numParams; i++){
        // console.log(parameterValues[i]);
        parent.task.document.getElementById('param' + (i+1) + 'slider').value = parameterValues[i];
        parent.task.document.getElementById('param' + (i+1) + 'output').value = parameterValues[i];
      }
      
    }

    function pathPcp(d) {
      const line = d3.line()(dimensionsPcp.map(function(p) { return [xPcp(p), yPcp[p](d[p])]; }));
      return line;
    }

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

  })
}

function drawScatter() {
  d3.csv("../data/data.csv").then( function(data) {
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

    const highlightScatter = function(event, d){
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
  })
}

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

async function drawRegionPlot() {
  var regionData = await parseRegions("../data/regions.csv");
  console.log(regionData);

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
    
  // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
  function pathRegion(d) {
          
    var regionPath = "M ";
    // for (let i = 1; i < numParams + 1; i++){
    //   regionPath += (i-1) * 100 + " " + (1 - d["x" + i + "low"])*height + " L ";
    // }
    // for (let i = numParams; i > 1; i--){
    //   regionPath += (i-1) * 100 + " " + (1 - d["x" + i + "up"])*height + " L ";
    // }
    for (var i = 0; i < d.lowerBound.length; i++){
        regionPath += (i) * 100 + " " + (1 - d.lowerBound[i])*height + " L ";
    }
    for (var i = d.upperBound.length-1; i > 0; i--){
        regionPath += (i) * 100 + " " + (1 - d.upperBound[i])*height + " L ";
    }
    // regionPath += 0 + " " + (1 - d.x1low)*height + " L ";
    // regionPath += 100 + " " + (1 - d.x2low)*height + " L ";
    // regionPath += 200 + " " + (1 - d.x3low)*height + " L ";
    // regionPath += 300 + " " + (1 - d.x4low)*height + " L ";
    // regionPath += 400 + " " + (1 - d.x5low)*height + " L ";
    // regionPath += 400 + " " + (1 - d.x5up)*height + " L ";
    // regionPath += 300 + " " + (1 - d.x4up)*height + " L ";
    // regionPath += 200 + " " + (1 - d.x3up)*height + " L ";
    // regionPath += 100 + " " + (1 - d.x2up)*height + " L ";
    regionPath += 0 + " " + (1 - d.upperBound[0])*height;
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
  .data(regionData).enter()
  .append("path")
    .attr("class", "area")
    .attr("d", d => pathRegion(d))
    .attr("upper", d => d.upperBound)
    .attr("lower", d => d.lowerBound)
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

  svgRegions
  .selectAll("myPath")
  .data(regionData)
  .enter()
  .append("g")
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
    .attr("class", function (d) { return "dot" } )
    .attr("regionid", function(d) {return d.id; })
    .attr("pointid", function(d) {return d.value + "dim" + d.x + "id" + d.id; })
    .style("fill", "lightblue" )
    .attr("r", 5)
    
  svgRegions
    .selectAll("circle")
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
        // d3.select(this).attr('cy', function (d) { return (1 - yVal)*height; })

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
          regionData[d.id-1].upperBound[d.x/100] = Math.min(1, Math.max(yVal, lowerBoundConvert));
          // d3.select(this).attr('cy', function(d) {return Math.max(0, Math.min((1 - yVal) * height, lowerBound)); })
        } else {
          var upperBound = svgRegions.selectAll(".dot")
          .filter(function() {
              return d3.select(this).attr("pointid") == "upper" + "dim" + d.x + "id" + d.id;
          }).attr("cy");
          var upperBoundConvert = 1 - upperBound / height - 0.05;
          regionData[d.id-1].lowerBound[d.x/100] = Math.max(0, Math.min(yVal, upperBoundConvert));
        }        
        
        svgRegions
            .selectAll("myPath")                
            .data(regionData)
            .enter()
            .selectAll(".area")
            .attr("d", pathRegion);
      })
    );
}

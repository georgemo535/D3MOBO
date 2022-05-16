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
  }

  const doNotHighlightPcp = function(event, d){
    d3.select("#pcp").selectAll(".line")
      .transition().duration(200).delay(500)
      .style("stroke", function(d){ return("lightblue")} )
      .style("opacity", "1")
      .style("stroke-width", "2")
    
    d3.select("#scatter").selectAll(".dot")
      .transition()
      .duration(200).delay(500)
      .style("fill", "green")
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

    const highlightScatter = function(d){
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

      let idVal = d3.select(this).attr("value");
      svgPcp.selectAll(".line").
      filter(function() {
          return d3.select(this).attr("value") == idVal
      }).transition().duration(200)
        .style("stroke", "green")
        .style("opacity", "1")
        .style("stroke-width", "4");
    }
        
    const doNotHighlightScatter = function(){
        d3.select("#scatter").selectAll(".dot")
            .transition()
            .duration(200).delay(500)
            .style("fill", "green")
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
        .attr("cx", function (d) { return x(d.y1); } )
        .attr("cy", function (d) { return y(d.y2); } )
        .attr("r", 5)
        .style("fill", "green")
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

d3.csv("../data/regions.csv").then( function(data) {

  // Here I set the list of dimension manually to control the order of axis:
  dimensions = ["x1", "x2", "x3", "x4", "x5"]
  dimensionsLower = ["x1low", "x2low", "x3low", "x4low", "x5low"]
  dimensionsUpper = ["x1up", "x2up", "x3up", "x4up", "x5up"]

  dimLowerConvert = {"x1low": "x1", "x2low": "x2", "x3low": "x3", "x4low": "x4", "x5low": "x5"};
  dimUpperConvert = {"x1up": "x1", "x2up": "x2", "x3up": "x3", "x4up": "x4", "x5up": "x5"};
  
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
  x = d3.scalePoint()
    .range([0, width])
    .domain(dimensions);

  // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
  function pathRegion(d) {
    console.log(d);
    console.log(dimensions.map(function(p) {return x(p); }));
    console.log(dimensionsLower.map(function(p) {return yPcp[dimLowerConvert[p]](d[p]); }));
    console.log(dimensionsUpper.map(function(p) {return yPcp[dimUpperConvert[p]](d[p]); }));
    // console.log(d);
    // const area = d3.area().x(dimensions.map(function(p) {return x(p); }))
    //       .y0(dimensionsLower.map(function(p) {return yPcp[dimLowerConvert[p]](d[p]); }))
    //       .y1(dimensionsUpper.map(function(p) {return yPcp[dimUpperConvert[p]](d[p]); }));
    // console.log(area);
    d3.area().x(dimensions.map(function(p) {return x(p); }))
            .y0(dimensionsLower.map(function(p) {return yPcp[dimLowerConvert[p]](d[p]); }))
            .y1(dimensionsUpper.map(function(p) {return yPcp[dimUpperConvert[p]](d[p]); }));
    // d3.area([[0, 368, 322], [100, 322, 276], [200, 368, 322], [300, 322, 276], [400, 368, 322]]);
    // d3.area().x(d => x(0)) .y0(d=>y(d.x1low)) .y1(d => y(d.x1up)); 
    // d3.area().x(d => x(100)) .y0(d=>y(d.x2low)) .y1(d => y(d.x2up)); 
    // d3.area().x(d => x(200)) .y0(d=>y(d.x3low)) .y1(d => y(d.x3up)); 
    // d3.area().x(d => x(300)) .y0(d=>y(d.x4low)) .y1(d => y(d.x4up)); 
    // d3.area().x(d => x(400)) .y0(d=>y(d.x5low)) .y1(d => y(d.x5up)); 
  }

  // Draw the areas
  svgRegions
  .selectAll("myPath")
  .data(data).enter()
  .append("path")
    .attr("class", "area")
    .attr("d", pathRegion)
    // .attr("d", function(d) {return pathRegion(d);} )
    // .attr("d","M0,0L0.2,0L0.4,100L0.3,100L0.4,100Z")
    // .attr("d", d3.area().x(dimensions.map(function(p) {return x(p); }))
    // .y0(dimensionsLower.map(function(p) {return yPcp[dimLowerConvert[p]](d[p]); }))
    // .y1(dimensionsUpper.map(function(p) {return yPcp[dimUpperConvert[p]](d[p]); })))
    // .attr("d", d3.area([[0, 368, 322], [100, 322, 276], [200, 368, 322], [300, 322, 276], [400, 368, 322]]))
    .attr("value", function (d) {return d.id; })
    .style("fill", "blue" )
    .style("opacity", 0.5)
      // .on("mouseover", highlightPcp)
      // .on("mouseout", doNotHighlightPcp)

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
        

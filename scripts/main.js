var numParams = 5;
var numObjs = 2;
var parameterNames;
var objectiveNames;
var parameterBounds;
var objectiveBounds;
var numSubdivisions = 2;

var renderRegionPlot;
var regionData;
var evaluatedDesigns;
var heuristicDesigns;
var forbidRangeData;
var pilotTestResults;

// Global Condition Type
var participantID;
var conditionID;
var applicationID;

// Most recent query
var mostRecentType;
var mostRecentDesign;
var mostRecentObjectives;

var designLineData;

var moboUsed = false;
var progressBarFinished = false;
var numberMOBOUsed = 0;

// Time variables
var timeFinishDisabled = 15;
var timeFinishTask = 20;

const ConditionType = {
  HYBRID: 0,
  DESIGNER: 1,
  MOBO: 2
}

const ApplicationType = {
  TWITTER: 0,
  STACKOVERFLOW: 1,
  GOOGLEMAPS: 2
}

const ApplicationParams = {
  0: {parameters: ["Ads", "Notification", "Personalization", "Moderation", "Refresh"],
            xbounds: [[0, 1], [0, 2], [0, 1], [0, 1], [0, 20]],
            objectives: ["Revenue", "User Rating"],
            ybounds: [[0, 20], [0, 5]]},
  1: {parameters: ["Categories", "Refresh", "Preview", "Tags", "Activity Rating"],
            xbounds: [[5, 50], [0, 1000], [0, 500], [1, 10], [0, 5]],
            objectives: ["Answering Rate", "Percentage Answered"],
            ybounds: [[0, 2], [0, 100]]},
  2: {parameters: ["Transparency", "Distance", "Icon Size", "Box Size", "Text Size"],
            xbounds: [[0.5, 1], [5, 50], [1, 10], [10, 50], [10, 30]],
            objectives: ["Speed", "Accuracy"],
            ybounds: [[0, 100], [0, 100]]}
}

async function renderMoboInterface() {
  participantID = localStorage.getItem("id");
  conditionID = localStorage.getItem("exp-condition");
  applicationID = localStorage.getItem("app");

  // numParams = config["dimx"];
  // numObjs = config["dimobj"];
  // console.log(ApplicationParams[applicationID].parameters)
  parameterNames = ApplicationParams[applicationID].parameters;
  objectiveNames = ApplicationParams[applicationID].objectives;
  parameterBounds = ApplicationParams[applicationID].xbounds;
  objectiveBounds = ApplicationParams[applicationID].ybounds;

  console.log(parameterNames);

  var midPoints = [];
  for (var i = 0; i < numParams; i++){
    midPoints.push((parameterBounds[i][0]));
  }
  var midPointsScaled = normalizeParameters(midPoints, parameterBounds);
  designLineData = [{id: "current", x1: midPointsScaled[0], x2: midPointsScaled[1], x3: midPointsScaled[2], x4: midPointsScaled[3], x5: midPointsScaled[4]}];

  // regionData = await parseRegions("../data/regions.csv");
  // evaluatedDesigns = await parseDesigns("../data/data.csv");
  // forbidRangeData = await parseRanges("../data/ranges.csv");

  regionData = [];
  evaluatedDesigns = [];
  heuristicDesigns = [];
  forbidRangeData = [];

  constructParameterSlider();
  drawPcp();
  drawScatter();

  document.getElementById("finish-button").addEventListener("click", finishExperiment);
  document.getElementById("heuristic-checkbox").addEventListener("click", plotHeuristicData);

  document.getElementById("finish-button").disabled = true;
  setTimeout(() => {
    document.getElementById("finish-button").disabled = false;}
    , 1000 * 60 * timeFinishDisabled);
  

  setTimeout(
    function(){
      alert("20 minutes have passed, please finish the task.");
      }
    , 1000 * 60 * timeFinishTask /// milliseconds = 10 seconds
  );

  // $("#add-record-button", window.parent.task.document).click(addRecentTable);
  // $(window.parent.task.document).on('click', ".record-delete", deleteRowRecentTable);
  // $(window.parent.task.document).on('click', ".record-show", showPointTable);
  // $(window.parent.task.document).on('click', ".record-up", moveRowTableUp);
  // $(window.parent.task.document).on('click', ".record-down", moveRowTableDown);
  // $("#clear-show-button", window.parent.task.document).click(clearTableShow);

  if (conditionID == ConditionType.HYBRID){
    renderRegionPlot = drawRegionPlot();
    renderRegionList();

    document.getElementById('confidence-slider').value = 0.5;
    document.getElementById('confidence-slider').disabled = true;
    document.getElementById('confidence-slider-value').value = "";

    document.getElementById('button-add-forbidden').addEventListener("click", addNewForbiddenRegion);
    document.getElementById('button-delete-forbidden').disabled = true;
    document.getElementById('button-delete-forbidden').addEventListener("click", deleteForbiddenRegion);

    document.getElementById('evaluation-button').addEventListener("click", runFormalTest);
    document.getElementById('test-button').addEventListener("click", runPilotTest);

    document.getElementById('button-mobo').addEventListener("click", runMOBO);

    let coverageBar = progbar(document.getElementById("progress-coverage"));
    coverageBar.set(0);

    let moboBar = progbar(document.getElementById("use-of-mobo"));
    moboBar.set(0);
  }

  if (conditionID == ConditionType.DESIGNER){
    document.getElementById('confidence-slider').style.display = 'none';
    document.getElementById('confidence-value-heading').style.display = 'none';
    document.getElementById('confidence-slider-value').style.display = 'none';

    document.getElementById('forbidden-region-heading').style.display = 'none';
    document.getElementById('forbidden-range-heading').style.display = 'none';

    document.getElementById('button-add-forbidden').style.display = 'none';
    document.getElementById('button-delete-forbidden').style.display = 'none';
    document.getElementById('clear-selection-button').style.display = 'none';

    document.getElementById('button-mobo').style.display = 'none';

    document.getElementById('coverage-percent-heading').style.display = 'none';
    document.getElementById('progress-coverage').style.display = 'none';

    document.getElementById('use-of-mobo-percent-heading').style.display = 'none';
    document.getElementById('use-of-mobo').style.display = 'none';

    document.getElementById('evaluation-button').addEventListener("click", runFormalTest);
    document.getElementById('test-button').addEventListener("click", runPilotTest);
  }

  if (conditionID == ConditionType.MOBO){
    document.getElementById('confidence-slider').style.display = 'none';
    document.getElementById('confidence-value-heading').style.display = 'none';
    document.getElementById('confidence-slider-value').style.display = 'none';

    document.getElementById('forbidden-region-heading').style.display = 'none';
    document.getElementById('forbidden-range-heading').style.display = 'none';

    document.getElementById('button-add-forbidden').style.display = 'none';
    document.getElementById('button-delete-forbidden').style.display = 'none';
    document.getElementById('clear-selection-button').style.display = 'none';

    document.getElementById('coverage-percent-heading').style.display = 'none';
    document.getElementById('progress-coverage').style.display = 'none';

    document.getElementById('use-of-mobo-percent-heading').style.display = 'none';
    document.getElementById('use-of-mobo').style.display = 'none';

    document.getElementById('evaluation-button').addEventListener("click", runFormalTest);
    document.getElementById('button-mobo').addEventListener("click", runMOBO);

    document.getElementById('test-button').style.display = 'none';
    document.getElementById("evaluation-button").disabled = true;

    for (var i = 0; i < numParams; i++){
      // console.log(parameterValues[i]);
      document.getElementById('param' + (i+1) + 'slider').disabled = true;
    }
  }

  // Application Type
  if (applicationID == ApplicationType.TWITTER){
    parent.task.document.getElementById('task-window').innerHTML = "<iframe src='twitter-clone.html' class='design-window' name='design'></iframe>";
  }
  if (applicationID == ApplicationType.STACKOVERFLOW){
    parent.task.document.getElementById('task-window').innerHTML = "<iframe src='stack-overflow-clone.html' class='design-window' name='design'></iframe>";
  }
  if (applicationID == ApplicationType.GOOGLEMAPS){
    parent.task.document.getElementById('task-window').innerHTML = "<iframe src='maps-clone.html' class='design-window' name='design'></iframe>";
  }
}

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

function renderTaskInterface() {
  readTextFile("../configs/config.json", function(text){
      config = JSON.parse(text);
      numParams = config["dimx"];
      xBounds = config["xbounds"];

      constructParameterSlider();
  });
}

function constructParameterSlider() {
  console.log("Loading sliders")

  for (var i = 0; i < numParams; i++){
      var divStart = "<div id='slider-container>"
      var labelTxt = "<label for='param" + (i+1) + "slider'>" + parameterNames[i] + "</label>"
      var inputTxt = "<input type='range' min=" + parameterBounds[i][0] + " max=" + parameterBounds[i][1] + " value='" + parameterBounds[i][0] + "' step='0.01' class='slider'"
      + " id=" + "'param" + (i+1) + "slider'" + " name=" + "'param" + (i+1) + "'" + " oninput='this.nextElementSibling.value = this.value'>";
      var outputTxt = "<output id='param"+ (i+1) + "output'>" + " " + parameterBounds[i][0] + "</output>"
      // var breakTxt = "<br><br>"
      var divEnd = "</div>"
      
      // console.log(inputTxt);
      var paramSlidersDiv = document.getElementById("param-sliders");
      paramSlidersDiv.innerHTML += divStart;
      paramSlidersDiv.innerHTML += labelTxt;
      paramSlidersDiv.innerHTML += inputTxt;
      paramSlidersDiv.innerHTML += outputTxt;
      // paramSlidersDiv.innerHTML += breakTxt;
      paramSlidersDiv.innerHTML += divEnd;

      // parent.task.document.getElementById("param-sliders").appendChild(inputTxt)
      // parent.task.document.getElementById("param-sliders").appendChild(outputTxt)
      // parent.task.document.getElementById("param-sliders").appendChild(breakTxt)
  }

  for (var i = 0; i < numParams; i++){
    document.getElementById('param' + (i+1) + 'slider').addEventListener("input", drawGuidingLine);
  }
}

function normalizeParameters(parameters, bounds){
  var normalizedParams = [];
  for (var i = 0; i < numParams; i++){
    var upperBound = Number(bounds[i][1]);
    var lowerBound = Number(bounds[i][0]);
    var normParam = (Number(parameters[i]) - lowerBound) / (upperBound - lowerBound);
    normalizedParams.push(normParam);
  }
  return normalizedParams;
}

function unnormalizeParameters(parameters, bounds){
  var unnormalizedParams = [];
  for (var i = 0;i < numParams; i++){
    var upperBound = Number(bounds[i][1]);
    var lowerBound = Number(bounds[i][0]);
    var unnormParam = lowerBound + Number(parameters[i]) * (upperBound - lowerBound);
    unnormalizedParams.push(unnormParam.toFixed(2));
  }
  return unnormalizedParams;
}

function normalizeObjectives(objectives, bounds){
  var normalizedObjs = [];
  for (var i = 0; i < numObjs; i++){
    var upperBound = Number(bounds[i][1]);
    var lowerBound = Number(bounds[i][0]);
    var normObj = 2 * (Number(objectives[i]) - lowerBound) / (upperBound - lowerBound) - 1;
    normalizedObjs.push(normObj);
  }
  return normalizedObjs;
}

function unnormalizeObjectives(objectives, bounds){
  var unnormalizedObjs = [];
  console.log(objectives);
  console.log(bounds);
  for (var i = 0; i < numObjs; i++){
    var upperBound = Number(bounds[i][1]);
    var lowerBound = Number(bounds[i][0]);
    var unnormObj = lowerBound + 0.5 * (Number(objectives[i]) + 1) * (upperBound - lowerBound);
    unnormalizedObjs.push(unnormObj.toFixed(2));
  }
  return unnormalizedObjs;
}

const svgWidth = 450;
const svgHeight = 370;

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
.style("padding", "5px")
.style("font-size", "10px")
.html("Design Parameters:")
.style("visibility", "hidden")

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
.style("padding", "5px")
.style("font-size", "10px")
.html("Objectives:")
.style("visibility", "hidden")

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
    .style("opacity", "0.2")
    .style("stroke-width", "2")
  
  d3.select("#scatter").selectAll(".dot")
    .transition()
    .duration(200)
    .style("opacity", "0.2")
    .attr("r", 3)

  d3.select(this)
    .transition().duration(200)
    .style("opacity", "0.8")
    .style("stroke-width", "4")
  
  d3.select(this).raise();
  
  let idVal = d3.select(this).attr("value");

  svgScatter.selectAll(".dot").
  filter(function() {
      return d3.select(this).attr("value") == idVal
  }).transition()
    .duration(200)
    .style("opacity", "0.8")
    .attr("r", 7)

  tooltipPcp.html(String(unnormalizeParameters(("[" + d3.select(this).attr("design") + "]").match(/\d+(?:\.\d+)?/g).map(Number), parameterBounds)).split(',').join(', '))
    .style("opacity", 1)
    .style("left", 25 + "px")
    .style("top", -25 + "px")
    .style("visibility", "visible")
  
  // console.log(event.x);
  // console.log(event.y);

  let objectivesDesignY1 = svgScatter.selectAll(".dot").
  filter(function(){
    return d3.select(this).attr("value") == idVal;
  }).attr("y1");

  let objectivesDesignY2 = svgScatter.selectAll(".dot").
  filter(function(){
    return d3.select(this).attr("value") == idVal;
  }).attr("y2");

  let cxObjective = svgScatter.selectAll(".dot").
  filter(function(){
    return d3.select(this).attr("value") == idVal;
  }).attr("cx");

  let cyObjective = svgScatter.selectAll(".dot").
  filter(function(){
    return d3.select(this).attr("value") == idVal;
  }).attr("cy");

  tooltipScatter.html(String(unnormalizeObjectives([Number(objectivesDesignY1), Number(objectivesDesignY2)], objectiveBounds)).split(',').join(', '))
  .style("opacity", 1)
  .style("left", cxObjective + "px")
  .style("top", cyObjective - svgHeight + 40 + "px")
  .style("visibility", "visible")
}

// Function to not highlight PCP line when not hovered over
const doNotHighlightPcp = function(event, d){
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
      return d3.select(this).attr("value") != "current";
    })
    .transition().duration(200).delay(100)
    // .style("stroke", function(d){ return("lightblue")} )
    .style("opacity", 0.8)
    .style("stroke-width", "2")
  
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
      return d3.select(this).attr("value") == "current";
  }).raise();
  
  d3.select("#scatter").selectAll(".dot")
    .transition()
    .duration(200).delay(100)
    .style("opacity", 0.8)
    .attr("r", 5)
  
  tooltipPcp.style("visibility", "hidden");
  tooltipScatter.style("visibility", "hidden");
}

// Function to update design sliders when clicked on a particular design
const onClickDesign = function(event, d){
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
      return d3.select(this).attr("value") != "current";
    })
    .transition().duration(200)
    // .style("stroke", "lightgrey")
    .style("opacity", "0.2")
  
  d3.select("#scatter").selectAll(".dot")
    .transition()
    .duration(200)
    .attr("opacity", "0.2")
    // .style("fill", "lightgrey")
    .attr("r", 3)

  d3.select(this)
    .transition().duration(200)
    // .style("stroke", "green")
    .style("opacity", 0.8)
    .style("stroke-width", "4")

  let idVal = d3.select(this).attr("value");

  svgScatter.selectAll(".dot").
  filter(function() {
      return d3.select(this).attr("value") == idVal
  }).transition()
    .duration(200)
    .style("opacity", "0.8")
    .attr("r", 5)

  let parameterValues = JSON.parse("[" + d3.select(this).attr("design") + "]");
  var unnormalizedParamVals = unnormalizeParameters(parameterValues, parameterBounds);

  // console.log(parameterValues);
  for (var i = 0; i < numParams; i++){
    // console.log(parameterValues[i]);
    document.getElementById('param' + (i+1) + 'slider').value = unnormalizedParamVals[i];
    document.getElementById('param' + (i+1) + 'output').value = unnormalizedParamVals[i];
  }

  drawGuidingLine();

  for (var i = 0; i < numParams; i++){
    document.getElementById('param' + (i+1) + 'slider').dispatchEvent(new Event('input'));
    console.log("Hello");
  }
}

// Function to parse data point in right way to input into the PCP
function pathPcp(d) {
  // const line = d3.line()(dimensionsPcp.map(function(p) { return [xPcp(p), yPcp[p](d[p])]; }));
  // return line;
  var lineData = [d.x1, d.x2, d.x3, d.x4, d.x5]
  var linePath = "M" + 0 + "," + (1- lineData[0]) * height;

  for (var i = 1; i < lineData.length; i++){
    linePath += "L" + (i) * (width / (numParams-1)) + "," + (1 - lineData[i])*height;
  }
  return linePath;
}

// Function to draw the PCP plots for the evaluated designs
function drawPcp() {
  // append the svg object to the body of the page
  svgPcp.selectAll("*").remove();

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

  svgPcp.selectAll("myPath")
    .data(evaluatedDesigns).enter()
    .append("path")
    // .join("path")
      .attr("class", function (d) { return "line"; } ) // 2 class for each line: 'line' and the group name
      .attr("d", pathPcp)
      .attr("value", function (d) {return d.id; })
      .attr("design", function (d) {return [d.x1, d.x2, d.x3, d.x4, d.x5]; })
      .style("fill", "none" )
      .style("stroke", function(d){ return( "blue")} )
      .style("opacity", 0.8)
      .style("stroke-width", "2")
      .on("mouseover", highlightPcp)
      .on("mouseout", doNotHighlightPcp)
      .on("click", onClickDesign)
  
  var maxPointID = evaluatedDesigns.length;
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
      return d3.select(this).attr("value") == String(maxPointID);
    })
    .style("stroke", "orange")

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
  

  if (document.getElementById("heuristic-checkbox").checked){
    svgPcp.selectAll("myPath")
      .data(heuristicDesigns).enter()
      .append("path")
        .attr("class", function(d){ return "line"; })
        .attr("d", d => pathPcp(d))
        .attr("value", function (d) {return d.id; })
        .attr("design", function (d) {return [d.x1, d.x2, d.x3, d.x4, d.x5]; })
        .style("fill", "none" )
        .style("stroke", function(d){ return( "green")} )
        .style("opacity", 0.8)
        .style("stroke-width", "2")
        .style("stroke-dasharray", ("3, 3"))
        .on("mouseover", highlightPcp)
        .on("mouseout", doNotHighlightPcp)
        .on("click", onClickDesign)

    var maxID = heuristicDesigns.length;
    d3.select("#pcp").selectAll(".line")
      .filter(function(){
        return d3.select(this).attr("value") == String(-maxID);
      })
      .style("stroke", "purple")
  }

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

// Function to draw the guiding line that follows the sliders
const drawGuidingLine = function(event){
  // console.log(this.name.replace("param", ""));
  
  var paramSliders = []
  for (var i = 0; i < numParams; i++){
    var valueSlider = document.getElementById('param' + (i+1) + 'slider').value;
    paramSliders.push(valueSlider);
  }
  var paramNormSliders = normalizeParameters(paramSliders, parameterBounds);

  for (var i = 0; i < numParams; i++){
    designLineData[0]["x" + (i+1)] = paramNormSliders[i];
  }

  d3.selectAll(".line").filter(function(){
    return d3.select(this).attr("value") == "current";
  }).remove();

  drawDesignLine();

  for (var i = 0; i < numParams; i++){
    document.getElementById('param' + (i+1) + 'output').innerHTML = document.getElementById('param' + (i+1) + 'slider').value;
  }

  document.getElementById("evaluation-button").disabled = false;
}

// Function to highlight scattered point when hovered over
const highlightScatter = function(event, d){
  d3.select("#scatter").selectAll(".dot")
    .transition()
    .duration(200)
    .style("opacity", 0.2)
    .attr("r", 3)
  
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
      return d3.select(this).attr("value") != "current";
    })
    .transition().duration(200)
    // .style("stroke", "lightgrey")
    .style("opacity", "0.2")
  
  d3.select(this)
    .transition()
    .duration(200)
    .style("opacity", 0.8)
    .attr("r", 7)

  // if (d3.select(this).attr("id") == "pilot-point" && document.getElementById("heuristic-checkbox").checked){
  //   var maxID = heuristicDesigns.length;
  //   var pilotPointCorresponding = svgScatter.selectAll(".dot").filter(function() {
  //     return d3.select(this).attr("value") == -maxID;
  //   })
  //   pilotPointCorresponding
  //     .transition()
  //     .duration(200)
  //     .style("opacity", 0.8)
  //     .attr("r", 7)

  //   var correspondingLine = svgPcp.selectAll(".line").filter(function() {
  //     return d3.select(this).attr("value") == maxID;
  //   })
  
  //   correspondingLine
  //     .transition().duration(200)
  //     // .style("stroke", "green")
  //     .style("opacity", 0.8)
  //     .style("stroke-width", "4");
    
  //   correspondingLine.raise();

  //   tooltipPcp.html(String(unnormalizeParameters(("[" + correspondingLine.attr("design") + "]").match(/\d+(?:\.\d+)?/g).map(Number), parameterBounds)).split(',').join(', '))
  //   // .transition()
  //   // .duration(500)
  //   .style("opacity", 1)
  //   .style("left", 25 + "px")
  //   .style("top", -25 + "px")
  //   .style("visibility", "visible")
  // }

  let objectivesDesignY1 = d3.select(this).attr("y1");

  let objectivesDesignY2 = d3.select(this).attr("y2");

  let cxObjective = d3.select(this).attr("cx");

  let cyObjective = d3.select(this).attr("cy");
  
  tooltipScatter.html(String(unnormalizeObjectives([Number(objectivesDesignY1), Number(objectivesDesignY2)], objectiveBounds)).split(',').join(', '))
    // .transition()
    // .duration(500)
    .style("opacity", 1)
    .style("left", cxObjective + "px")
    .style("top", cyObjective - svgHeight + 40 + "px")
    .style("visibility", "visible")

  let idVal = d3.select(this).attr("value");
  
  var correspondingLine = svgPcp.selectAll(".line").filter(function() {
    return d3.select(this).attr("value") == idVal
  })

  correspondingLine
    .transition().duration(200)
    // .style("stroke", "green")
    .style("opacity", 0.8)
    .style("stroke-width", "4");
  
  correspondingLine.raise();

  tooltipPcp.html(String(unnormalizeParameters(("[" + correspondingLine.attr("design") + "]").match(/\d+(?:\.\d+)?/g).map(Number), parameterBounds)).split(',').join(', '))
  // .transition()
  // .duration(500)
  .style("opacity", 1)
  .style("left", 25 + "px")
  .style("top", -25 + "px")
  .style("visibility", "visible")
  
  // else {
  //   tooltipPcp.html("Design Parameters: ")
  //   .transition()
  //   .duration(500)
  //   .style("opacity", 1)
  //   .style("left", (event.x) / 2 + "px")
  //   .style("top", (event.y) / 2 + "px")
  // }
}

const onClickScatter = function(event, d){
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
      return d3.select(this).attr("value") != "current";
    })
    .transition().duration(200)
    // .style("stroke", "lightgrey")
    .style("opacity", "0.2")
    .style("stroke-width", "2")
  
  d3.select("#scatter").selectAll(".dot")
    .transition()
    .duration(200)
    // .style("fill", "lightgrey")
    .attr("opacity", "0.2")
    .attr("r", 3)

  d3.select(this)
    .transition()
    .duration(200)
    // .style("fill", "green")
    .attr("opacity", 0.8)
    .attr("r", 7)

  let idVal = d3.select(this).attr("value");

  var lineDesign = svgPcp.selectAll(".line").filter(function() {
    return d3.select(this).attr("value") == idVal
  });

  console.log(lineDesign.attr("value"));

  lineDesign.transition().duration(200)
    // .style("stroke", "green")
    .style("opacity", "0.8")
    .style("stroke-width", "4")

  let parameterValues = JSON.parse("[" + lineDesign.attr("design") + "]");
  var unnormalizedParamVals = unnormalizeParameters(parameterValues, parameterBounds);

  // console.log(parameterValues);
  for (var i = 0; i < numParams; i++){
    // console.log(parameterValues[i]);
    document.getElementById('param' + (i+1) + 'slider').value = unnormalizedParamVals[i];
    document.getElementById('param' + (i+1) + 'output').value = unnormalizedParamVals[i];
  }

  drawGuidingLine();

  for (var i = 0; i < numParams; i++){
    document.getElementById('param' + (i+1) + 'slider').dispatchEvent(new Event('input'));
    // console.log("Hello");
  }
}

// Function to not highlight scattered points when not hovered over
const doNotHighlightScatter = function(event, d){
  d3.select("#scatter").selectAll(".dot")
    .transition()
    .duration(200).delay(500)
    .style("opacity", 0.8)
    .attr("r", 5 )
  
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
      return d3.select(this).attr("value") != "current";
    })
    .transition().duration(200).delay(500)
    // .style("stroke", function(d){ return("lightblue")} )
    .style("opacity", 0.8)
    .style("stroke-width", "2")
  
  d3.select("#pcp").selectAll(".line")
    .filter(function(){
      return d3.select(this).attr("value") == "current";
  }).raise();

  tooltipPcp.style("visibility", "hidden");
  tooltipScatter.style("visibility", "hidden");
}

// Function to draw the scattered plots for the objective values of the evaluated designs
function drawScatter() {
  svgScatter.selectAll("*").remove();

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
        .attr("y1", function(d) {return d.y1; })
        .attr("y2", function(d) {return d.y2; })
        .attr("cx", function (d) { return x(0.5 * (Number(d.y1) + 1) * (objectiveBounds[0][1] - objectiveBounds[0][0]) + objectiveBounds[0][0]); } )
        .attr("cy", function (d) { return y(0.5 * (Number(d.y2) + 1) * (objectiveBounds[1][1] - objectiveBounds[1][0]) + objectiveBounds[1][0]); } )
        .attr("r", 5)
        .style("fill", "blue")
        .style("opacity", 0.8)
    .on("mouseover", highlightScatter)
    .on("mouseleave", doNotHighlightScatter)
    .on("click", onClickScatter)
  
  var maxPointID = evaluatedDesigns.length;
  d3.select("#scatter").selectAll(".dot")
    .filter(function(){
      return d3.select(this).attr("value") == String(maxPointID);
    })
    .style("fill", "orange")

  svgScatter.append("text")
    .attr("text-anchor", "end")
    .attr("x", width/2 + margin.left)
    .attr("y", height + margin.top + 20)
    .text(objectiveNames[0])
    .style("font-size", "10px");

  svgScatter.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top - height/2 + 20)
    .text(objectiveNames[1])
    .style("font-size", "10px");
  
  if (document.getElementById("heuristic-checkbox").checked){
    svgScatter.append('g')
      .selectAll("dot")
      .data(heuristicDesigns).enter()
      .append("circle")
          .attr("value", function (d) {return d.id;})
          .attr("class", function (d) { return "dot" } )
          .attr("objectives", function (d) {return [d.y1, d.y2]; })
          .attr("y1", function(d) {return d.y1; })
          .attr("y2", function(d) {return d.y2; })
          .attr("cx", function (d) { return x(0.5 * (Number(d.y1) + 1) * (objectiveBounds[0][1] - objectiveBounds[0][0]) + objectiveBounds[0][0]); } )
          .attr("cy", function (d) { return y(0.5 * (Number(d.y2) + 1) * (objectiveBounds[1][1] - objectiveBounds[1][0]) + objectiveBounds[1][0]); } )
          .attr("r", 5)
          .style("fill", "#d3d3d3")
          .style("stroke", "green")
          .style("opacity", 0.8)
      .on("mouseover", highlightScatter)
      .on("mouseleave", doNotHighlightScatter)
      .on("click", onClickScatter)

    var maxID = heuristicDesigns.length;
    d3.select("#scatter").selectAll(".dot")
      .filter(function(){
        return d3.select(this).attr("value") == String(-maxID);
      })
      .style("stroke", "purple")
  }

  // Function to draw the Pareto front
  var dominatingSet = getDominatingSet(evaluatedDesigns);
  var dominatingSetSortX = dominatingSet.sort(compareObjectivesFirst);
  // console.log(dominatingSetSortX);

  var paretoLineData = [];
  for (var i = 0; i < dominatingSetSortX.length - 1; i++){
    var data = [(Number(dominatingSetSortX[i].y1) + 1) / 2,
                (Number(dominatingSetSortX[i].y2) + 1) / 2, 
                (Number(dominatingSetSortX[i+1].y1) + 1) / 2, 
                (Number(dominatingSetSortX[i+1].y2) + 1) / 2];
    paretoLineData.push(data);
  }

  // console.log(paretoLineData);

  if (paretoLineData.length > 0){
    svgScatter
    .selectAll("myPath")
    .data(paretoLineData).enter()
    .append("path")
      .attr("class", function (d) { return "line"; } ) // 2 class for each line: 'line' and the group name
      .attr("d", function(d) { return drawParetoFront(d);})
      .style("fill", "none" )
      .style("stroke", function(d){ return( "#0492C2")} )
      .style("opacity", 1.0)
      .style("stroke-width", "2")
  }
}

// Draw the Pareto front
function drawParetoFront(d){
  var linePath = "";
  linePath += "M" + (d[0] * width) + "," + (1 - d[1]) * height;
  linePath += "L" + (d[2] * width) + "," + (1 - d[3]) * height;
  return linePath;
}

// Draw the most recent pilot point
function drawHeuristicPoint(){
  svgScatter.selectAll("#pilot-point").remove();

  const x = d3.scaleLinear()
    .domain(objectiveBounds[0])
    .range([ 0, width ]);
  
  const y = d3.scaleLinear()
    .domain(objectiveBounds[1])
    .range([ height, 0]);

  // console.log(pilotTestResults);

  svgScatter.append('g')
    .selectAll("dot")
    .data(pilotTestResults).enter()
    .append("circle")
        .attr("id", "pilot-point")
        .attr("objectives", function (d) {return [d.y1, d.y2]; })
        .attr("design", function (d) {return [d.x1, d.x2, d.x3, d.x4, d.x5]; })
        .attr("y1", function(d) {return d.y1; })
        .attr("y2", function(d) {return d.y2; })
        .attr("cx", function (d) { return x(0.5 * (Number(d.y1) + 1) * (objectiveBounds[0][1] - objectiveBounds[0][0]) + objectiveBounds[0][0]); } )
        .attr("cy", function (d) { return y(0.5 * (Number(d.y2) + 1) * (objectiveBounds[1][1] - objectiveBounds[1][0]) + objectiveBounds[1][0]); } )
        .attr("r", 3)
        .style("fill", "purple")
        .on("mouseover", highlightScatter)
        .on("mouseleave", doNotHighlightScatter)
}

// Comparing objectives by y1 to yield set of dominating points
function compareObjectivesFirst(a, b){
  if (Number(a.y1) < Number(b.y1)){
    return -1;
  }
  if (Number(a.y1) > Number(b.y1)){
    return 1;
  }
  return 0;
}

// Comparing objectives by y2 to yield set of dominating points
function compareObjectivesSecond(a, b){
  if (Number(a.y2) < Number(b.y2)){
    return -1;
  }
  if (Number(a.y2) > Number(b.y2)){
    return 1;
  }
  return 0;
}

// Function to get set of dominating points
function getDominatingSet(evaluatedDesigns){
  var dominatingSet = [];
  var sortedObjectiveSecond = evaluatedDesigns.sort(compareObjectivesSecond).reverse();
  // console.log(sortedObjectiveSecond);
  var maxFirst = -1;
  
  for (var i = 0; i < sortedObjectiveSecond.length; i++){
    if (Number(sortedObjectiveSecond[i].y1) >= Number(maxFirst)){
      maxFirst = Number(sortedObjectiveSecond[i].y1);
      // console.log(maxFirst);
      dominatingSet.push(sortedObjectiveSecond[i]);
    }
  }
  return dominatingSet;
}

function plotHeuristicData(){
  drawPcp();
  drawScatter();
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
    // console.log(d);
    var regionPath = "M ";

    for (var i = 0; i < d.lowerBound.length; i++){
        regionPath += (i) * width / (numParams-1) + " " + (1 - d.lowerBound[i])*height + " L ";
    }
    for (var i = d.upperBound.length-1; i > 0; i--){
        regionPath += (i) * width / (numParams-1) + " " + (1 - d.upperBound[i])*height + " L ";
    }
    regionPath += 0 + " " + (1 - d.upperBound[0])*height;
    regionPath += " Z";
    console.log(regionPath);
    return regionPath;
  }
  
  function pathRange(d) {
    var rangePath = "M ";
    var halfWidth = 5;

    rangePath += ((d.dim - 1) * width / (numParams-1) - halfWidth) + " " + (1 - d.low)*height;
    rangePath += " L " + ((d.dim - 1) * width / (numParams-1) + halfWidth) + " " + (1 - d.low)*height;
    rangePath += "L" + ((d.dim - 1) * width / (numParams-1) + halfWidth) + " " + (1 - d.up)*height;
    rangePath += "L" + ((d.dim - 1) * width / (numParams-1) - halfWidth) + " " + (1 - d.up)*height;
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
          { "id": d.id, "value": "lower", "x": width * 1 / (numParams - 1), "y": d.lowerBound[1] },
          { "id": d.id, "value": "upper", "x": width * 1 / (numParams - 1), "y": d.upperBound[1] },
          { "id": d.id, "value": "lower", "x": width * 2 / (numParams - 1), "y": d.lowerBound[2] },
          { "id": d.id, "value": "upper", "x": width * 2 / (numParams - 1), "y": d.upperBound[2] },
          { "id": d.id, "value": "lower", "x": width * 3 / (numParams - 1), "y": d.lowerBound[3] },
          { "id": d.id, "value": "upper", "x": width * 3 / (numParams - 1), "y": d.upperBound[3] },
          { "id": d.id, "value": "lower", "x": width * 4 / (numParams - 1), "y": d.lowerBound[4] },
          { "id": d.id, "value": "upper", "x": width * 4 / (numParams - 1), "y": d.upperBound[4] },
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
                regionData[i].upperBound[d.x/(width / (numParams-1))] = Math.min(1, Math.max(yVal, lowerBoundConvert));
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
                regionData[i].lowerBound[d.x/(width / (numParams-1))] = Math.max(0, Math.min(yVal, upperBoundConvert));
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
    var xCenter = i*(width / (numParams-1));
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
    .attr("cx", function (d) { return d.x * width / (numParams-1); } )
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
  var parentList = document.getElementById("forbidden-region-list");
  while (parentList.firstChild) {
    parentList.firstChild.remove();
  }

  var rangeList = document.getElementById("forbidden-range-list");
  while (rangeList.firstChild) {
    rangeList.firstChild.remove();
  }

  var numberForbiddenRegions = regionData.length;
  
  for (var i = 0; i < numberForbiddenRegions; i++){
    var regionID = regionData[i].id;
    // console.log(regionID);
    var inputTxt = "<input type='radio' id='region-tick-" + regionID +  "' name='forbidden-tick' value=" + regionID + ">"
    var labelTxt = "<label id='region-tick-label' for='forbidden" + regionID + "'>" + (i+1) + "</label><br>"

    $("#forbidden-region-list").append(inputTxt)
    $("#forbidden-region-list").append(labelTxt)
  }

  var numberForbiddenRanges = forbidRangeData.length;

  for (var i = 0; i < numberForbiddenRanges; i++){
    var rangeID = forbidRangeData[i].id;

    var inputTxt = "<input type='radio' id='range-tick-" + rangeID +  "' name='forbidden-tick' value=" + rangeID + ">"
    var labelTxt = "<label id='range-tick-label' for='forbidden" + rangeID + "'>" + (i+1) + "</label><br>"

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

  var slidersValues = [];
  for (var i = 0; i < numParams; i++){
    slidersValues.push(Number(document.getElementById('param' + (i+1) + 'slider').value));
  }

  var normalizedSlidersValues = normalizeParameters(slidersValues, parameterBounds);

  for (var i = 0; i < numParams; i++){
    // console.log(parameterValues[i]);
    dataEntered = normalizedSlidersValues[i];
    upperBounds.push(Math.min(dataEntered + defaultWidth, 1.0));
    lowerBounds.push(Math.max(dataEntered - defaultWidth, 0.0));
  }
  
  var takenMaxID = 0;
  for (var i = 0; i < regionData.length; i++){
    if (regionData[i].id > takenMaxID){
      takenMaxID = regionData[i].id;
    }
  }
  // console.log(takenMaxID);

  var newID = Number(takenMaxID) + 1;
  var newRegionData = {
    id: String(newID), 
    lowerBound: lowerBounds, 
    upperBound: upperBounds, 
    confidence: String(defaultConfidence)};
  regionData.push(newRegionData);

  console.log(regionData);

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
    if (radios[i].value == newID && radios[i].id.startsWith("region")){
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
  var dimensionSelected = Number(d3.select(this).attr("dim"));
  var defaultWidth = 0.05;
  var defaultConfidence = 0.8;

  var upperBoundParam = parameterBounds[dimensionSelected-1][1];
  var lowerBoundParam = parameterBounds[dimensionSelected-1][0];


  var dataEntered = Number(document.getElementById('param' + (dimensionSelected) + 'slider').value);
  var dataEnteredNorm = (dataEntered - lowerBoundParam) / (upperBoundParam - lowerBoundParam);

  var upperBound = Math.min(dataEnteredNorm + defaultWidth, 1.0)
  var lowerBound = Math.max(dataEnteredNorm - defaultWidth, 0.0)

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

  console.log(forbidRangeData);

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

// Test type - 0 for formal evaluation, 1 for pilot
const TestType = {            
  FORMAL: 0,
  PILOT: 1,
};

// Run pilot test function
function runPilotTest() {
  console.log("runPilotTest");

  document.getElementById("test-result").textContent = ""
  var progressBarHtml = "<progress id='test-progress' value='0' max='100'></progress>";
  document.getElementById("test-result").innerHTML += progressBarHtml;
  $('.button').prop('disabled', true);
  document.getElementById("test-button").disabled = true;
  document.getElementById("evaluation-button").disabled = true;
  document.querySelectorAll("slider").disabled = true;

  var paramVals = [];
  var inputSliders = document.querySelectorAll(".slider:not(#confidence-slider)");
  
  console.log(inputSliders);

  for (var i = 0; i < inputSliders.length; i++){
    inputSliders[i].disabled = true;
    var name = inputSliders[i].id;
    var val = inputSliders[i].value;
    console.log(name + ": " + val);
    paramVals.push(val);
  }

  getTestResult(paramVals, TestType.PILOT);

  var waitTime = 3; //s, this should be the same as in the python script
  var progressStep = 1 / waitTime * 10;
  var progressVal = 0;
  const progressInterval = setInterval(function () {
      document.getElementById("test-progress").value = progressVal;
      progressVal += progressStep; 
      if (progressVal > 100) {
          clearInterval(progressInterval);
      }
  }, 100);
}

// Run formal evaluation function
function runFormalTest() {
  console.log("runFormalTest");

  document.getElementById("test-result").textContent = ""
  var progressBarHtml = "<progress id='test-progress' value='0' max='100'></progress>";
  document.getElementById("test-result").innerHTML += progressBarHtml;
  $('.button').prop('disabled', true);
  document.getElementById("test-button").disabled = true;
  document.getElementById("evaluation-button").disabled = true;

  var paramVals = [];
  var inputSliders = document.querySelectorAll(".slider:not(#confidence-slider)");

  for (var i = 0; i < inputSliders.length; i++){
    inputSliders[i].disabled = true;
    var name = inputSliders[i].id;
    var val = inputSliders[i].value;
    // console.log(name + ": " + val);
    paramVals.push(val);
  }

  getTestResult(paramVals, TestType.FORMAL);

  var waitTime = 20; //s, this should be the same as in the python script
  var progressStep = 1 / waitTime * 10;
  var progressVal = 0;
  const progressInterval = setInterval(function () {
      document.getElementById("test-progress").value = progressVal;
      progressVal += progressStep; 
      if (progressVal > 100) {
          clearInterval(progressInterval);
      }
  }, 100);

}

// Get test result from formal evaluation or pilot test
function getTestResult(paramVals, testType) {
  var paramValsNorm = normalizeParameters(paramVals, parameterBounds);
  var paramValsJson = JSON.stringify(paramValsNorm);

  $.ajax({
      url: "./cgi/query_function.py",
      type: "post",
      datatype:"json",                    
      data: { 'param_vals'        :paramValsJson,
              'test_type'         :testType,
              'participant_id'    :String(participantID),
              'application_id'    :String(applicationID),
              'condition_id'      :String(conditionID) },                    
      success: function(result) {
        submitReturned = true;
        // console.log(result.message);
        var objValsNorm = JSON.parse(result.message).obj_vals;

        var objVals = unnormalizeObjectives(objValsNorm, objectiveBounds);

        // TODO handle returned objVals
        document.getElementById("test-result").innerHTML += "<br>" + (parseFloat(objVals[0]).toFixed(2) + " , " + parseFloat(objVals[1]).toFixed(2));
        document.querySelectorAll(".button").disabled = false;

        $('.button').prop('disabled', false);
        document.getElementById("test-button").disabled = false;
        document.getElementById("evaluation-button").disabled = false;
        
        if (testType == TestType.FORMAL){
          var maxID = evaluatedDesigns.length;
          var newDesignData = {id: maxID+1,
                              x1: parseFloat(paramValsNorm[0]).toFixed(2),
                              x2: parseFloat(paramValsNorm[1]).toFixed(2),
                              x3: parseFloat(paramValsNorm[2]).toFixed(2),
                              x4: parseFloat(paramValsNorm[3]).toFixed(2),
                              x5: parseFloat(paramValsNorm[4]).toFixed(2),
                              y1: parseFloat(objValsNorm[0]).toFixed(2),
                              y2: parseFloat(objValsNorm[1]).toFixed(2)}
          evaluatedDesigns.push(newDesignData);

          var coverageResult = getCoverageResult(evaluatedDesigns, numSubdivisions, numParams);
          let coverageBar = progbar(document.getElementById("progress-coverage"));
          coverageBar.set(Math.floor(100 * coverageResult));

          if (moboUsed){
            numberMOBOUsed += 1;
          }
          var moboUsedResult = Math.floor(100 * (numberMOBOUsed / evaluatedDesigns.length));
          let moboBar = progbar(document.getElementById("use-of-mobo"));
          moboBar.set(moboUsedResult);

          moboUsed = false;

          document.getElementById("evaluation-button").disabled = true;
        }

        console.log(evaluatedDesigns);

        var inputSliders = document.querySelectorAll(".slider");

        if (conditionID != ConditionType.MOBO){
          for (var i = 0; i < inputSliders.length; i++){
            inputSliders[i].disabled = false;
          }
        }

        if (testType == TestType.PILOT){
          pilotTestResults = [{id: "pilot-point",
                              x1: parseFloat(paramValsNorm[0]).toFixed(2),
                              x2: parseFloat(paramValsNorm[1]).toFixed(2),
                              x3: parseFloat(paramValsNorm[2]).toFixed(2),
                              x4: parseFloat(paramValsNorm[3]).toFixed(2),
                              x5: parseFloat(paramValsNorm[4]).toFixed(2),
                              y1: parseFloat(objValsNorm[0]).toFixed(2),
                              y2: parseFloat(objValsNorm[1]).toFixed(2)}];
          // drawHeuristicPoint();

          var maxID = heuristicDesigns.length;
          var newDesignData = {id: -maxID-1,
                              x1: parseFloat(paramValsNorm[0]).toFixed(2),
                              x2: parseFloat(paramValsNorm[1]).toFixed(2),
                              x3: parseFloat(paramValsNorm[2]).toFixed(2),
                              x4: parseFloat(paramValsNorm[3]).toFixed(2),
                              x5: parseFloat(paramValsNorm[4]).toFixed(2),
                              y1: parseFloat(objValsNorm[0]).toFixed(2),
                              y2: parseFloat(objValsNorm[1]).toFixed(2)}
          heuristicDesigns.push(newDesignData);

          console.log(heuristicDesigns);
        }
        drawPcp();
        drawScatter();

        mostRecentDesign = paramVals;
        mostRecentObjectives = objVals;

        if (testType == TestType.PILOT){
          mostRecentType = 'pilot';
        }
        else {
          mostRecentType = 'formal';
        }
      },
      error: function(result){
          console.log("Error in getTestResult: " + result.message);
      }
  });
}

// Function to get hypercube coverage - design coverage metric
function getCoverageResult(evaluatedDesigns, numSubdivisions, numParams){
  var hyperCubesCovered = new Set();
  for (var i = 0; i < evaluatedDesigns.length; i++){
    var design = [evaluatedDesigns[i].x1, evaluatedDesigns[i].x2, evaluatedDesigns[i].x3, evaluatedDesigns[i].x4, evaluatedDesigns[i].x5];
    var indexHypercube = whichHypercube(design, numSubdivisions);
    if (!hyperCubesCovered.has(indexHypercube)){
      hyperCubesCovered.add(whichHypercube(design, numSubdivisions));
    }
  }

  console.log(hyperCubesCovered);
  return hyperCubesCovered.size / (numSubdivisions ** numParams);
}

// Function to get which hypercube a design lies in
function whichHypercube(evaluatedDesign, numSubdivisions){
  var hyperCube = "";
  for (var i = 0; i < numParams; i++){
    var index = Math.min(numSubdivisions-1, Math.floor(numSubdivisions * evaluatedDesign[i]));
    hyperCube += String(index);
  }
  return hyperCube;
}

function progbar (instance) {
  instance.classList.add("prog-wrap");
  
  instance.innerHTML =
    `<div class="prog-bar"></div>
     <div class="prog-percent">0%</div>`;
  instance.hbar = instance.querySelector(".prog-bar");
  instance.hpercent = instance.querySelector(".prog-percent");

  instance.set = (percent) => {
    instance.hbar.style.width = percent + "%";
    instance.hpercent.innerHTML = percent + "%";
  };

  return instance;
}

// Function to run MOBO when clicked button
function runMOBO(){
  console.log("runMOBO");
  document.getElementById("mobo-loading").textContent = ""
  var progressBarHtml = "<progress id='mobo-progress' value='0' max='100'></progress>";
  document.getElementById("mobo-loading").innerHTML += progressBarHtml;
  $('.button').prop('disabled', true);
  document.getElementById("test-button").disabled = true;
  document.getElementById("evaluation-button").disabled = true;
  
  var inputSliders = document.querySelectorAll(".slider");
  for (var i = 0; i < inputSliders.length; i++){
    inputSliders[i].disabled = true;
  }

  getMOBOResult(evaluatedDesigns, regionData, forbidRangeData);
  moboUsed = true;
  progressBarFinished = false;

  var waitTime = 5; //s, this should be the same as in the python script
  var progressStep = 1 / waitTime * 10;
  var progressVal = 0;
  const progressInterval = setInterval(function () {
      document.getElementById("mobo-progress").value = progressVal;
      progressVal += progressStep; 

      if (progressBarFinished){
        document.getElementById("mobo-progress").value = 100;

        progressStep = 0;
        waitTime = 0;
        progressVal = 100;

        progressBarFinished = false;
      }
      else{
        if (progressVal >= 100) {
          clearInterval(progressInterval);
        }
      }
  }, 100);
}

// Function to get new design from MOBO
function getMOBOResult(evaluatedDesigns, regionData, forbidRangeData){
  // Put everything in appropriate array format
  var processedX = [];
  var processedY = [];
  console.log(evaluatedDesigns);
  for (var i = 0; i < evaluatedDesigns.length; i++){
    processedX.push([evaluatedDesigns[i].x1, 
                    evaluatedDesigns[i].x2, 
                    evaluatedDesigns[i].x3, 
                    evaluatedDesigns[i].x4, 
                    evaluatedDesigns[i].x5]);
    processedY.push([evaluatedDesigns[i].y1, 
                    evaluatedDesigns[i].y2]);
  }

  var processedRegions = [];
  for (var i = 0; i < regionData.length; i++){
    var totalForbiddenRegion = regionData[i].lowerBound.concat(regionData[i].upperBound);
    totalForbiddenRegion.push(regionData[i].confidence);
    totalForbiddenRegion.push(0);
    processedRegions.push(totalForbiddenRegion);
  }

  for (var i = 0; i < forbidRangeData.length; i++){
    var dim = forbidRangeData[i].dim;
    var lower = forbidRangeData[i].low;
    var upper = forbidRangeData[i].up;
    var confidence = forbidRangeData[i].confidence;

    var lowerBounds = new Array(numParams).fill(0);
    var upperBounds = new Array(numParams).fill(1);
    lowerBounds[dim-1] = lower;
    upperBounds[dim-1] = upper;

    var totalForbiddenRange = lowerBounds.concat(upperBounds);
    totalForbiddenRange.push(confidence);
    totalForbiddenRange.push(1);
    processedRegions.push(totalForbiddenRange);
  }

  console.log(processedX);
  console.log(processedY);
  console.log(processedRegions);

  var designParamsJson = JSON.stringify(processedX);
  var objectivesJson = JSON.stringify(processedY);
  var forbidRegionsJson = JSON.stringify(processedRegions);

  $.ajax({
      url: "./cgi/query_mobo.py",
      type: "post",
      datatype: "json",
      data: {   'design_params'   : designParamsJson,
                'objectives'   : objectivesJson,
                'forbidden_regions'    : forbidRegionsJson,
                'participant_id'    :String(participantID),
                'application_id'    :String(applicationID),
                'condition_id'      :String(conditionID) },
      success: function(result) {
        submitReturned = true;

        var proposedLocation = JSON.parse(result.message).proposed_location;
        var proposedLocationUnnormalized = unnormalizeParameters(proposedLocation, parameterBounds);
        // console.log(proposedLocation);
        for (var i = 0; i < numParams; i++){
          // console.log(parameterValues[i]);
          document.getElementById('param' + (i+1) + 'slider').value = proposedLocationUnnormalized[i];
          document.getElementById('param' + (i+1) + 'output').value = proposedLocationUnnormalized[i];
        }

        $('.button').prop('disabled', false);
        document.getElementById("test-button").disabled = false;
        document.getElementById("evaluation-button").disabled = false;
        
        var inputSliders = document.querySelectorAll(".slider");
        if (conditionID != ConditionType.MOBO){
          for (var i = 0; i < inputSliders.length; i++){
            inputSliders[i].disabled = false;
          }
        }
      
        drawGuidingLine();

        for (var i = 0; i < numParams; i++){
          document.getElementById('param' + (i+1) + 'slider').dispatchEvent(new Event('input'));
          console.log("Hello");
        }

        progressBarFinished = true;
        
        document.getElementById("evaluation-button").disabled = false;

      },
      error: function(result){
          console.log("Error in getTestResult: " + result.message);
      }
  });
}

// Function to finish the experiment
function finishExperiment(){
  var sureFinished = confirm("Are you sure you want to finish?");
  if (sureFinished){
    $.ajax({
      url: "./cgi/finish_log.py",
      type: "post",
      datatype: "json",
      data: {   'participant_id'    :String(participantID),
                'application_id'    :String(applicationID),
                'condition_id'      :String(conditionID) },
      success: function(result) {
        submitReturned = true;
        parent.window.location.href = "end.html";
      },
      error: function(result){
          console.log("Error in finishing experiment: " + result.message);
      }
    });
  }
}

// Add recent to note table
function addRecentTable(){
  // var formalChecked = $("#heuristic-formal-check", window.parent.task.document).prop("checked");

  var formalChecked;
  if (mostRecentType == 'pilot'){
    formalChecked = false; 
  }
  else if (mostRecentType == 'formal'){
    formalChecked = true;
  }

  console.log(formalChecked);
  console.log(String(mostRecentDesign));
  console.log(String(mostRecentObjectives));

  var htmlNewRow = ""
  htmlNewRow += "<tr>"
  if (formalChecked == true){
    htmlNewRow += "<td class='record-data' id='record-data-heuristic'>Formal</td>"
  }
  else if (formalChecked == false) {
    htmlNewRow += "<td class='record-data' id='record-data-heuristic'>Heuristic</td>"
  }
  else {
    htmlNewRow += "<td class='record-data' id='record-data-heuristic'></td>"
  }

  if (mostRecentDesign === undefined){
    htmlNewRow += "<td class='record-data' id='record-data-design'></td>"
  }
  else {
    var stringDesign = String(mostRecentDesign);
    htmlNewRow += "<td class='record-data' id='record-data-design'>" + stringDesign + "</td>"
  }
  
  if (mostRecentObjectives === undefined){
    htmlNewRow += "<td class='record-data' id='record-data-objective'></td>"
  }
  else {
    var stringObjectives = String(mostRecentObjectives);
    htmlNewRow += "<td class='record-data' id='record-data-objective'>" + stringObjectives + "</td>"
  }
  
  htmlNewRow += "<td contenteditable='true' class='record-data' id='record-data-note'></td>"
  htmlNewRow += "<td id='record-data-buttons'><button class='record-show' id='record-show'><img src='./images/interface/search.png'></button>"
  htmlNewRow += "<button class='record-delete' id='record-delete'><img src='./images/interface/delete.png'></button>"
  htmlNewRow += "<span style='display: inline-block; width: 20px; height: 15px;'>"
  htmlNewRow += "<button class='record-up' id='record-up'><i class='arrow up'></i></button>"
  htmlNewRow += "<button class='record-down' id='record-down'><i class='arrow down'></i></button>"
  htmlNewRow += "</span>"
  htmlNewRow += "</td></tr>"
  $("#record-note-table", window.parent.task.document).append(htmlNewRow);  
}

// Delete row of note table
function deleteRowRecentTable(){
  $(this).parents('tr').remove();
}

// Move row of table up
function moveRowTableUp(){
  var $row = $(this).parents('tr');
  if ($row.index() == 0) return;
  $row.prev().before($row.get(0));
}

// Move row of table down
function moveRowTableDown(){
  var $row = $(this).parents('tr');
  $row.next().after($row.get(0));
}

// Display point in table in the figures
function showPointTable(){
  var rowEntries = [];
  
  var $row = $(this).closest("tr");
  var $tds = $row.find("td");

  $.each($tds, function() {
    rowEntries.push($(this).text());
  });
  rowEntries.pop();

  var designParameters = normalizeParameters(rowEntries[1].split(",").map(Number), parameterBounds);
  var objectiveValues = normalizeObjectives(rowEntries[2].split(",").map(Number), objectiveBounds);

  // Check all values are valid
  var designParamValid = true;
  var objectiveValValid = true;

  for (var i = 0; i < numParams; i++){
    if (isNaN(parseFloat(designParameters[i]))){
      designParamValid = false;
    }
    else {
      if (designParameters[i] < 0|| designParameters[i] > 1){
        designParamValid = false;
      }    
    }
  }

  for (var i = 0; i < numObjs; i++){
    if (isNaN(parseFloat(objectiveValues[i]))){
      console.log("hi");
      objectiveValValid = false;
    }
    else {
      if (objectiveValues[i] < -1|| objectiveValues[i] > 1){
        objectiveValValid = false;
      }
    }
  }

  console.log(designParamValid);
  console.log(objectiveValValid);

  if (designParamValid && objectiveValValid){
    drawTableLine(designParameters);
    drawTablePoint(objectiveValues);
  }
}

// Plot table note line on PCP plot
function drawTableLine(designParameters) {
  d3.selectAll(".line").filter(function(){
    return d3.select(this).attr("value") == "table-line";
  }).remove();

  var designParamParsed = [{id: "table-line",
                              x1: designParameters[0],
                              x2: designParameters[1],
                              x3: designParameters[2],
                              x4: designParameters[3],
                              x5: designParameters[4]}];

  svgPcp
    .selectAll("myPath")
    .data(designParamParsed).enter()
    .append("path")
    // .join("path")
      .attr("class", function (d) { return "line"; } ) // 2 class for each line: 'line' and the group name
      .attr("d", function(d) { return pathPcp(d);})
      .attr("value", function (d) {return d.id; })
      .attr("design", function (d) {return [d.x1, d.x2, d.x3, d.x4, d.x5]; })
      .style("fill", "none" )
      .style("stroke", function(d){ return("green")} )
      .style("opacity", 1.0)
      .style("stroke-width", "2")
      .style("stroke-dasharray", ("3, 3"))
}

// Plot table note point on scatter plot
function drawTablePoint(objectiveVals){
  d3.selectAll("#table-point").remove();

  var objectiveValsParsed = [{id: "table-point",
                              y1: objectiveVals[0],
                              y2: objectiveVals[1]}]

                          
  const x = d3.scaleLinear()
    .domain(objectiveBounds[0])
    .range([ 0, width ]);
  
  const y = d3.scaleLinear()
    .domain(objectiveBounds[1])
    .range([ height, 0]);

  // console.log(pilotTestResults);

  svgScatter.selectAll("dot")
    .data(objectiveValsParsed).enter()
    .append("circle")
        .attr("id", "table-point")
        .attr("objectives", function (d) {return [d.y1, d.y2]; })
        .attr("y1", function(d) {return d.y1; })
        .attr("y2", function(d) {return d.y2; })
        .attr("cx", function (d) { return x(0.5 * (Number(d.y1) + 1) * (objectiveBounds[0][1] - objectiveBounds[0][0]) + objectiveBounds[0][0]); } )
        .attr("cy", function (d) { return y(0.5 * (Number(d.y2) + 1) * (objectiveBounds[1][1] - objectiveBounds[1][0]) + objectiveBounds[1][0]); } )
        .attr("r", 7)
        .style("fill", "green")
}

// Clear show from table
function clearTableShow(){
  console.log("hello");
  d3.selectAll(".line").filter(function(){
    return d3.select(this).attr("value") == "table-line";
  }).remove();

  d3.selectAll("#table-point").remove();
}
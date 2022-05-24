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
var xBounds;

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
        var inputTxt = "<input type='range' min=" + xBounds[i][0] + " max=" + xBounds[i][1] + " value='0.50' step='0.01' class='slider'"
        + " id=" + "'param" + (i+1) + "slider'" + " name=" + "'param" + (i+1) + "'" + " oninput='this.nextElementSibling.value = this.value'>";
        var outputTxt = "<output id='param"+ (i+1) + "output'>0.5</output>"
        var breakTxt = "<br><br>"

        // console.log(inputTxt);
        $("#param-sliders").append(inputTxt)
        $("#param-sliders").append(outputTxt)
        $("#param-sliders").append(breakTxt)
    }
}

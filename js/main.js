var graph;

var x0 = null, x0old = null, x1 = null, dims = [];
var attrNo = null, attr = null, attr2 = [], index = 0;
var X = [], Y = [];
var loaddata = [];

// Gets called when the page is loaded.
function init(){
  // Get input data
  d3.csv('data/04cars data_clean.csv', function(data) {
    for (var i = 0; i<data.length; i++) {
      var item = {"Name":null, "raw":null, "coord":null};
      item["Name"] = data[i]["Vehicle Name"];
      item["raw"] = data[i];
      delete item["raw"]["Vehicle Name"];
      delete item["raw"]["Pickup"];
      item["coord"] = {};
      loaddata[i] = item;
    }
    attr = Object.keys(loaddata[0]["raw"]);
    attrNo = attr.length;
    for (var i = 0; i<attrNo; i++) {
      var tmpmax = d3.max(loaddata, function(d) { return +d["raw"][attr[i]]; });
      var tmpmin = d3.min(loaddata, function(d) { return +d["raw"][attr[i]]; });
      loaddata.forEach(function(d) {
        d["coord"][attr[i]] = (+d["raw"][attr[i]]-tmpmin)/(tmpmax-tmpmin);
      });
    }
    loadVis(loaddata);
  });
}

// Main function
function loadVis(data) {
  drawScatterPlot(data);
  for (var i = 0; i<attrNo; i++) {
    dims[i] = attr[i];
  }
//  drawParaCoords(data,dims);
  tabulate(data[0]);
}

function drawScatterPlot(data) {
  // heterogeneous data
  initdim1 = 11, initdim2 = 7;
  data.forEach(function(d) {d.x = d["coord"][attr[initdim1]]; d.y = d["coord"][attr[initdim2]]; });
  graph = new SimpleGraph("scplot", data, {
          "xlabel": attr[initdim1],
          "ylabel": attr[initdim2],
          "init": true
        });
  
  for (var i = 0; i<attrNo; i++) {
    X[i] = {"attr":attr[i], "value":0, "changed":0, "error":0};
    Y[i] = {"attr":attr[i], "value":0, "changed":0, "error":0};
  }
  X[initdim1]["value"] = 1;
  Y[initdim2]["value"] = 1;
  document.getElementById("cbX").selectedIndex = initdim1;
  document.getElementById("cbY").selectedIndex = initdim2;

  xaxis = new axis("#scplot", X, "X", {
          "width": graph.size.width-dropSize*2,
          "height": graph.padding.bottom-40,
          "padding": {top: graph.padding.top+graph.size.height+40, right: 0, left: graph.padding.left+dropSize+10, bottom: 0}
        });
  yaxis = new axis("#scplot", Y, "Y", {
          "width": graph.padding.left-dropSize,
          "height": graph.size.height-dropSize*2,
          "padding": {top: graph.padding.top+dropSize, right: 0, left: 15, bottom: 0}
        });
}
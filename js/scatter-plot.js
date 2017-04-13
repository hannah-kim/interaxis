var dropSize = 80, dropR = 20, axisOptions = {};

registerKeyboardHandler = function(callback) {
  var callback = callback;
  d3.select(window).on("keydown", callback);  
};

SimpleGraph = function(elemid, data, options) {
  var self = this;
  this.chart = document.getElementById(elemid);
  this.cx = this.chart.clientWidth;
  this.cy = this.chart.clientHeight;
  this.options = options || {};
  this.points = data;

  this.options.xmax = d3.max(data, function(d) { return +d["x"]; }) || options.xmax || 30;
  this.options.xmin = d3.min(data, function(d) { return +d["x"]; }) || options.xmin || 0;
  this.options.ymax = d3.max(data, function(d) { return +d["y"]; }) || options.ymax || 10;
  this.options.ymin = d3.min(data, function(d) { return +d["y"]; }) || options.ymin || 0;

  this.padding = {
     "top":    this.options.title  ? 40 : 20,
     "right":                 			      30,
     "bottom": this.options.xlabel ? 230 : 10,
     "left":   this.options.ylabel ? 300 : 45
  };

  this.size = {
    "width":  this.cx - this.padding.left - this.padding.right,
    "height": this.cy - this.padding.top  - this.padding.bottom
  };

  axisOptions = {
    "X": { "width": this.size.width-dropSize*2,
          "height": this.padding.bottom-40,
          "padding": {top: this.padding.top+this.size.height+40, right: 0, left: this.padding.left+dropSize+10, bottom: 0} },
    "Y": { "width": this.padding.left-dropSize,
          "height": this.size.height-dropSize*2,
          "padding": {top: this.padding.top+dropSize, right: 0, left: 15, bottom: 0} }
  };
  
  // x-scale
  this.x = d3.scale.linear()
  // this.x = d3.scale.log()
      .domain([this.options.xmin, this.options.xmax])
      .range([0, this.size.width]);

  // drag x-axis logic
  this.downx = Math.NaN;

  // y-scale (inverted domain)
  this.y = d3.scale.linear()
  // this.y = d3.scale.log()
      .domain([this.options.ymax, this.options.ymin])
      .nice()
      .range([0, this.size.height])
      .nice();

  // drag y-axis logic
  this.downy = Math.NaN;

  this.dragged = this.selected = null;
  this.dropped = null;
  if (this.options.dropzone) {this.dropzone = this.options.dropzone; delete this.options.dropzone;}
  else {this.dropzone = {"YH":[], "YL":[], "XL":[], "XH":[]};}

  var xrange =  (this.options.xmax - this.options.xmin),
      yrange2 = (this.options.ymax - this.options.ymin) / 2,
      yrange4 = yrange2 / 2;

  if (this.options.init==true) {
    var SC = d3.select(this.chart).append("svg")
      .attr("width",  this.cx)
      .attr("height", this.cy);

    var drp = SC.append("g").attr("id", "DROP");
    drp.append("g").attr("id", "YH").append("rect").attr("x", this.padding.left-dropSize*1.5).attr("y", this.padding.top);
    drp.append("g").attr("id", "YL").append("rect").attr("x", this.padding.left-dropSize*1.5).attr("y", this.cy-this.padding.bottom-dropSize);
    drp.append("g").attr("id", "XL").append("rect").attr("x", this.padding.left).attr("y", this.cy-this.padding.bottom+dropSize*0.5);
    drp.append("g").attr("id", "XH").append("rect").attr("x", this.cx-this.padding.right-dropSize).attr("y", this.cy-this.padding.bottom+dropSize*0.5);
    drp.selectAll("rect").attr("width", dropSize).attr("height", dropSize).attr("rx", dropR).attr("ry", dropR);

    var div = document.getElementById("btnYc");
    div.style.left = this.padding.left-dropSize+20;
    div.style.top = this.padding.top+this.size.height+0.5*dropSize;
    div = document.getElementById("btnXc");
    div.style.left = this.padding.left-dropSize+20;
    div.style.top = this.padding.top+this.size.height+1*dropSize;
    div = document.getElementById("btnYs");
    div.style.left = this.padding.left-dropSize-35;
    div.style.top = this.padding.top+this.size.height+0.5*dropSize;
    div = document.getElementById("btnXs");
    div.style.left = this.padding.left-dropSize-35;
    div.style.top = this.padding.top+this.size.height+1*dropSize;

    d3.select("#cbY")
      .selectAll("option")
      .data(attr)
      .enter()
      .append("option")
      .attr("value", function(d) {return d;})
      .text(function(d) {return d;});
    d3.select("#cbX")
      .selectAll("option")
      .data(attr)
      .enter()
      .append("option")
      .attr("value", function(d) {return d;})
      .text(function(d) {return d;});
    div = document.getElementById("cbY");
    div.style.left = this.padding.left-dropSize-175;
    div.style.top = this.padding.top+this.size.height+0.5*dropSize;
    div = document.getElementById("cbX");
    div.style.left = this.padding.left-dropSize-175;;
    div.style.top = this.padding.top+this.size.height+1*dropSize;
  }
  else {
    var SC = d3.select(this.chart).select("svg")
      .attr("width",  this.cx)
      .attr("height", this.cy);
  }
  this.vis = SC.append("g")
        .attr("id", "SC")
        .attr("transform", "translate(" + this.padding.left + "," + this.padding.top + ")");

  this.plot = this.vis.append("rect")
      .attr("width", this.size.width)
      .attr("height", this.size.height)
      .style("fill", "#EEEEEE")
      .attr("pointer-events", "all")
      // .on("mousedown.drag", self.plot_drag())
      // .on("touchstart.drag", self.plot_drag())
      this.plot.call(d3.behavior.zoom().x(this.x).y(this.y).on("zoom", this.redraw()));

  this.vis.append("svg")
      .attr("top", 0)
      .attr("left", 0)
      .attr("width", this.size.width)
      .attr("height", this.size.height)
      .attr("viewBox", "0 0 "+(this.size.width)+" "+(this.size.height));

  // add Chart Title
  if (this.options.title) {
    this.vis.append("text")
        .attr("class", "axis")
        .text(this.options.title)
        .attr("x", this.size.width/2)
        .attr("dy","-0.8em")
        .style("text-anchor","middle");
  }

  // Add the x-axis label
  if (this.options.xlabel) {
    this.vis.append("text")
        .attr("class", "axis")
        .text(this.options.xlabel)
        .attr("x", this.size.width/2)
        .attr("y", this.size.height)
        .attr("dy","2.4em")
        .style("text-anchor","middle");
  }

  // add y-axis label
  if (this.options.ylabel) {
    this.vis.append("g").append("text")
        .attr("class", "axis")
        .text(this.options.ylabel)
        .style("text-anchor","middle")
        .attr("transform","translate(" + -40 + " " + this.size.height/2+") rotate(-90)");
  }

  d3.select(this.chart)
      .on("mousemove.drag", self.mousemove())
      .on("touchmove.drag", self.mousemove())
      .on("mouseup.drag",   self.mouseup())
      .on("touchend.drag",  self.mouseup());

  this.redraw()();
};
  
//
// SimpleGraph methods
//

SimpleGraph.prototype.plot_drag = function() {
  var self = this;
  return function() {
    registerKeyboardHandler(self.keydown());
    d3.select('body').style("cursor", "move");
    if (d3.event.altKey) {
      var p = d3.mouse(self.vis.node());
      var newpoint = {};
      newpoint.x = self.x.invert(Math.max(0, Math.min(self.size.width,  p[0])));
      newpoint.y = self.y.invert(Math.max(0, Math.min(self.size.height, p[1])));
      self.points.push(newpoint);
      self.points.sort(function(a, b) {
        if (a.x < b.x) { return -1 };
        if (a.x > b.x) { return  1 };
        return 0
      });
      self.selected = newpoint;
      self.update();
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }    
  }
};

SimpleGraph.prototype.update = function() {
  var self = this;

  var circle = this.vis.select("svg").selectAll("circle")
      .data(this.points);
  
  circle.enter().append("circle")
      // .attr("class", function(d) { return d === self.selected ? "selected" : d.indropzone ? "dropped" : null; })
      .attr("class", function(d) { return d.indropzone ? "dropped" : null; })
      .attr("cx",    function(d) { return self.x(d["x"]); })
      .attr("cy",    function(d) { return self.y(d["y"]); })
      .attr("r", 7.0)
      .style("cursor", "resize")
      .on("mouseover", function(d) {
        tabulate(d);
        d3.select("#DROP").selectAll("circle").filter(function(c) {return c==d;}).attr("class", "highlighted");
      })
      .on("mouseout", function(d) {
        d3.select("#DROP").selectAll("circle").filter(function(c) {return c==d;}).attr("class", null);
      })
      .on("click", function(d){tabulate(d,"click"); sglclick(d)})
//      .on("dblclick", function(d){dblclick(d)})
      .on("mousedown.drag",  self.datapoint_drag())
      .on("touchstart.drag", self.datapoint_drag());
  
  circle.attr("text", function(d) { return d["Name"]; });

  circle
      .attr("class", function(d) { return d.indropzone ? "dropped" : null; })
      .attr("cx",    function(d) { return self.x(d.x); })
      .attr("cy",    function(d) { return self.y(d.y); });

  circle.exit().remove();

  if (d3.event && d3.event.keyCode) {
    d3.event.preventDefault();
    d3.event.stopPropagation();
  }
}

sglclick = function(d) {
  if (x0!=d) {
    x0old = x0;
    x0 = d;
  }
};

SimpleGraph.prototype.datapoint_drag = function() {
  var self = this;
  return function(d) {
    registerKeyboardHandler(self.keydown());
    document.onselectstart = function() { return false; };
    self.selected = self.dragged = d;
    self.dragged.oldy = d.y;
    self.dragged.oldx = d.x;

    self.update();
  }
};

SimpleGraph.prototype.mousemove = function() {
  var self = this;
  return function() {
    var p = d3.mouse(self.vis[0][0]),
        t = d3.event.changedTouches;
    // console.log(p);

    if (self.dragged) {
      // self.dragged.y = self.y.invert(Math.max(0, Math.min(self.size.height, p[1])));
      self.dragged.y = self.y.invert(p[1]);
      // self.dragged.x = self.x.invert(Math.max(0, Math.min(self.size.width, p[0])));
      self.dragged.x = self.x.invert(p[0]);

      if (-dropSize*1.5<=p[0] && p[0]<=-dropSize*0.5 && 0<=p[1] && p[1]<=dropSize) { // YH
        self.dropped = "YH";
      } else if (-dropSize*1.5<=p[0] && p[0]<=-dropSize*0.5 && self.size.height-dropSize<=p[1] && p[1]<=self.size.height) { // YL
        self.dropped = "YL";
      } else if (0<=p[0] && p[0]<=dropSize && self.size.height+dropSize*0.5<=p[1] && p[1]<=self.size.height+dropSize*1.5) { // XL
        self.dropped = "XL";
      } else if (self.size.width-dropSize<=p[0] && p[0]<=self.size.width && self.size.height+dropSize*0.5<=p[1] && p[1]<=self.size.height+dropSize*1.5) { // XH
        self.dropped = "XH";
      }
      else {
        self.dropped = null;
      }
      
      self.update();
    };
    if (!isNaN(self.downx)) {
      d3.select('body').style("cursor", "ew-resize");
      var rupx = self.x.invert(p[0]),
          xaxis1 = self.x.domain()[0],
          xaxis2 = self.x.domain()[1],
          xextent = xaxis2 - xaxis1;
      if (rupx != 0) {
        var changex, new_domain;
        changex = self.downx / rupx;
        new_domain = [xaxis1, xaxis1 + (xextent * changex)];
        self.x.domain(new_domain);
        self.redraw()();
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    };
    if (!isNaN(self.downy)) {
      d3.select('body').style("cursor", "ns-resize");
      var rupy = self.y.invert(p[1]),
          yaxis1 = self.y.domain()[1],
          yaxis2 = self.y.domain()[0],
          yextent = yaxis2 - yaxis1;
      if (rupy != 0) {
        var changey, new_domain;
        changey = self.downy / rupy;
        new_domain = [yaxis1 + (yextent * changey), yaxis1];
        self.y.domain(new_domain);
        self.redraw()();
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  }
};

SimpleGraph.prototype.mouseup = function() {
  var self = this;

  return function() {
    document.onselectstart = function() { return true; };
    d3.select('body').style("cursor", "auto");
    d3.select('body').style("cursor", "auto");
    if (!isNaN(self.downx)) {
      self.redraw()();
      self.downx = Math.NaN;
      d3.event.preventDefault();
      d3.event.stopPropagation();
    };
    if (!isNaN(self.downy)) {
      self.redraw()();
      self.downy = Math.NaN;
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
    if (self.dragged) { 
      self.dragged.y = self.dragged.oldy;
      self.dragged.x = self.dragged.oldx;

      if (self.dropped) {
        self.dragged.indropzone = true;
        var count = 0;
        for (var i = 0; i<self.dropzone[self.dropped].length; i++) {
          if (self.dropzone[self.dropped][i]["Name"]==self.dragged["Name"]) {
            count = count + 1;
            break;
          }
        }
        if (count==0) {
          self.dropzone[self.dropped][self.dropzone[self.dropped].length] = self.dragged;
          d3.select("#"+self.dropped).selectAll("circle").remove();

          var cx = +d3.select("#"+self.dropped).select("rect").attr("x")+0.5*dropSize,
              cy = +d3.select("#"+self.dropped).select("rect").attr("y")+0.5*dropSize,
              num = self.dropzone[self.dropped].length,
              dist = num==1 ? 0 : 10.0/Math.sin(Math.PI/num);
          
          d3.select("#"+self.dropped).selectAll("circle").data(self.dropzone[self.dropped]).enter().append("circle")
            .attr("cx",    function(d,i) { return cx + dist*Math.cos(Math.PI*2*i/num); })
            .attr("cy",    function(d,i) { return cy + dist*Math.sin(Math.PI*2*i/num); })
            .attr("r", 7.0)
            .on("mouseover", function(d) {
              tabulate(d); 
              tmpclass = d3.select("#SC").selectAll("circle").filter(function(c) {return c==d;}).attr("class");
              d3.select("#SC").selectAll("circle").filter(function(c) {return c==d;}).attr("class", "highlighted");
            })
            .on("mouseout", function(d) {
              d3.select("#SC").selectAll("circle").filter(function(c) {return c==d;}).attr("class", tmpclass);
            })
            .on("dblclick", function(d) {
              thisdropzone = d3.select(this.parentNode).attr("id");
              for (var i = 0; i<self.dropzone[thisdropzone].length; i++) {
                if (self.dropzone[thisdropzone][i]==d) {
                  self.dropzone[thisdropzone].splice(i,1);
                  break;
                }
              }
              var inotherdropzone = graph.dropzone.XH.concat(graph.dropzone.XL,graph.dropzone.YH,graph.dropzone.YL)
                                    .filter(function(c) {return c==d;});
              if (inotherdropzone.length==0) {d.indropzone = false; tmpclass = null;}
              this.remove();
              console.log(self.dropzone);
              if ((thisdropzone=="XL" || thisdropzone=="XH") && self.dropzone["XH"].length*self.dropzone["XL"].length>0) {
                console.log("update X");
                updategraph("X");
              } else if ((thisdropzone=="YL" || thisdropzone=="YH") && self.dropzone["YH"].length*self.dropzone["YL"].length>0) {
                console.log("update Y");
                updategraph("Y");
              } else {
                self.redraw()();
              }
            })
            .on("click", function(d) {tabulate(d,"click");});
        }
      }
      if ((self.dropped=="XL" && self.dropzone["XH"].length>0) || (self.dropped=="XH" && self.dropzone["XL"].length>0)) {
        console.log("update X");
        updategraph("X");
      } else if ((self.dropped=="YL" && self.dropzone["YH"].length>0) || (self.dropped=="YH" && self.dropzone["YL"].length>0)) {
        console.log("update Y");
        updategraph("Y");
      }
      self.dragged = null;
      self.dropped = null;
      self.redraw()();
    }
  }
}

updategraph = function(axistobeupdated,givenV,givenVchanged) {
  data = graph.points;
  if (givenV == undefined) {
    var x1 = {}, x0 = {};
    var high = graph.dropzone[axistobeupdated+"H"], low = graph.dropzone[axistobeupdated+"L"];
    for (var i = 0; i<attrNo; i++) {
      x1[attr[i]] = d3.mean(low, function(d) { return d["coord"][attr[i]]});
      x0[attr[i]] = d3.mean(high, function(d) { return d["coord"][attr[i]]});
    }

    var hlpair = [];
    for (var i = 0; i<high.length; i++) {
      for (var j = 0; j<low.length; j++) {
        var tmpelt = {};
        for (var k = 0; k<attrNo; k++) {
          tmpelt[attr[k]] = high[i]["coord"][attr[k]] - low[j]["coord"][attr[k]];
        }
        hlpair[hlpair.length] = tmpelt;
      }
    }
    
    // calculate new attr
    console.log("------------------------ Getting new axis vector ------------------------------")
    var V = {}, Vchanged = {}, Verror = {}, norm = 0;
    for (var i = 0; i<attrNo; i++) {
      V[attr[i]] = 0;
      Vchanged[attr[i]] = 0;
    }
    for (var i = 0; i<attrNo; i++) {
     V[attr[i]] = x0[attr[i]]-x1[attr[i]];
     norm = norm + (x0[attr[i]]-x1[attr[i]])*(x0[attr[i]]-x1[attr[i]]);
    }
    var VV = [];
    for (var i = 0; i<attrNo; i++) {
      VV[i] = {"attr":attr[i], "value":V[attr[i]]};
    }
    VV.sort(function(a,b) {return Math.abs(b["value"]) - Math.abs(a["value"]);});
    for (var i = 0; i<VV.length; i++) {
      // V[VV[i]["attr"]] = i<10 ? VV[i]["value"] : 0;
    }
    norm = Math.sqrt(norm);
    for (var i = 0; i<attrNo; i++) {
      V[attr[i]] = V[attr[i]]/norm;
      if (hlpair.length>1) { Verror[attr[i]] = d3.deviation(hlpair, function(d) { return d[attr[i]]; }); }
      else { Verror[attr[i]] = 0; }
    }
    console.log("------------------------ Calculating new attr ------------------------------")
  } else {
    var V = givenV, Vchanged = givenVchanged, Verror = {}, norm = 0;
    for (var i = 0; i<attrNo; i++) {
     norm = norm + (V[attr[i]])*(V[attr[i]]);
    }
    norm = Math.sqrt(norm);
    for (var i = 0; i<attrNo; i++) {
     V[attr[i]] = V[attr[i]]/norm;
     Verror[attr[i]] = 0;
    }
    console.log("------------------------ Calculating new attr ------------------------------")
  }

    index = index + 1;
    var newxname = 'x'+index;
    graph.points.forEach(function(d,i) {
      d["coord"][newxname] = 0; 
      for (var j = 0; j<attrNo; j++) {
        d["coord"][newxname] = d["coord"][newxname] + V[attr[j]]*d["coord"][attr[j]];
      }
      
    });
    console.log("------------------------ Done ------------------------------")

    d3.select("#SC").remove();
    d3.select("#"+axistobeupdated).remove();
    data.forEach(function(d) {d[axistobeupdated=="X" ? "x" : "y"] = d["coord"][newxname]; });
    graph = new SimpleGraph("scplot", data, {
            "xlabel": axistobeupdated == "X" ? newxname : graph.options.xlabel,
            "ylabel": axistobeupdated == "X" ? graph.options.ylabel : newxname,
            "init": false,
            "dropzone": graph.dropzone
          });
    var VV = [];
    for (var i = 0; i<attrNo; i++) {
      VV[i] = {"attr":attr[i], "value":V[attr[i]], "changed":Vchanged[attr[i]], "error":Verror[attr[i]]};
    }
    if (axistobeupdated == "X") { X = VV; xaxis = new axis("#scplot", VV, axistobeupdated, axisOptions[axistobeupdated]); }
    else { Y = VV; yaxis = new axis("#scplot", VV, axistobeupdated, axisOptions[axistobeupdated]) }
};

SimpleGraph.prototype.keydown = function() {
  var self = this;
  return function() {
    if (!self.selected) return;
    switch (d3.event.keyCode) {
      case 8: // backspace
      case 46: { // delete
        var i = self.points.indexOf(self.selected);
        self.points.splice(i, 1);
        self.selected = self.points.length ? self.points[i > 0 ? i - 1 : 0] : null;
        self.update();
        break;
      }
    }
  }
};

SimpleGraph.prototype.redraw = function() {
  var self = this;
  return function() {
    var tx = function(d) { 
      return "translate(" + self.x(d) + ",0)"; 
    },
    ty = function(d) { 
      return "translate(0," + self.y(d) + ")";
    },
    stroke = function(d) { 
      return d ? "#ccc" : "#666"; 
    },
    fx = self.x.tickFormat(10),
    fy = self.y.tickFormat(10);

    // Regenerate x-ticks…
    var gx = self.vis.selectAll("g.x")
        .data(self.x.ticks(10), String)
        .attr("transform", tx);

    gx.select("text")
        .text(fx);

    var gxe = gx.enter().insert("g", "a")
        .attr("class", "x")
        .attr("transform", tx);

    gxe.append("line")
        .attr("stroke", stroke)
        .attr("y1", 0)
        .attr("y2", self.size.height);

    gxe.append("text")
        .attr("class", "axis")
        .attr("y", self.size.height)
        .attr("dy", "1em")
        .attr("text-anchor", "middle")
        .text(fx)
        .style("cursor", "ew-resize")
        .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
        .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
        .on("mousedown.drag",  self.xaxis_drag())
        .on("touchstart.drag", self.xaxis_drag());

    gx.exit().remove();

    // Regenerate y-ticks…
    var gy = self.vis.selectAll("g.y")
        .data(self.y.ticks(10), String)
        .attr("transform", ty);

    gy.select("text")
        .text(fy);

    var gye = gy.enter().insert("g", "a")
        .attr("class", "y")
        .attr("transform", ty)
        .attr("background-fill", "#FFEEB6");

    gye.append("line")
        .attr("stroke", stroke)
        .attr("x1", 0)
        .attr("x2", self.size.width);

    gye.append("text")
        .attr("class", "axis")
        .attr("x", -3)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(fy)
        .style("cursor", "ns-resize")
        .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
        .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
        .on("mousedown.drag",  self.yaxis_drag())
        .on("touchstart.drag", self.yaxis_drag());

    gy.exit().remove();
    self.plot.call(d3.behavior.zoom().x(self.x).y(self.y).on("zoom", self.redraw()));
    self.update();    
  }  
}

SimpleGraph.prototype.xaxis_drag = function() {
  var self = this;
  return function(d) {
    document.onselectstart = function() { return false; };
    var p = d3.mouse(self.vis[0][0]);
    self.downx = self.x.invert(p[0]);
  }
};

SimpleGraph.prototype.yaxis_drag = function(d) {
  var self = this;
  return function(d) {
    document.onselectstart = function() { return false; };
    var p = d3.mouse(self.vis[0][0]);
    self.downy = self.y.invert(p[1]);
  }
};

function tabulate(dataitem, option) {
    var op = option || "no";
    if (op == "click") { return; var tid = "#datapanel2";}
    else {var tid = "#datapanel";}

    d3.select(tid).selectAll("table").remove();

    var columns = [dataitem["Name"],""];
    
    var table = d3.select(tid).append("table")
            .attr("style", "margin-left: 5px"),
        thead = table.append("thead"),
        tbody = table.append("tbody");

    // append the header row
    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
            .text(function(column) { return column; });
    
    var data = [];
    columns = ["key", "value"];
    for (var i = 0; i<attrNo; i++) {
        var item = {"key":null, "value":null};
        item["key"] = attr[i];
        item["value"] = dataitem["raw"][attr[i]];
        data[i] = item;
    }

    // create a row for each object in the data
    var rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr");

    // create a cell in each row for each column
    var cells = rows.selectAll("td")
        .data(function(row) {
            return columns.map(function(column) {
                return {column: column, value: row[column]};
            });
        })
        .enter()
        .append("td")
        .html(function(d) { return d.value; });
    
    return table;
}

clearDropzone = function(axistobeupdated) {
  data = graph.points;
  graph.dropzone[axistobeupdated+"L"] = [];
  graph.dropzone[axistobeupdated+"H"] = [];
  var inotherdropzone = graph.dropzone.XH.concat(graph.dropzone.XL,graph.dropzone.YH,graph.dropzone.YL);
  data.forEach(function(d) { d.indropzone = false; inotherdropzone.forEach(function(c) { if (c==d) { d.indropzone = true; return; } }); });
  d3.select("#"+axistobeupdated+"L").selectAll("circle").remove();
  d3.select("#"+axistobeupdated+"H").selectAll("circle").remove();
  
  document.getElementById("cb"+axistobeupdated).selectedIndex = axistobeupdated=="X" ? initdim1 : initdim2;
  updatebycb(axistobeupdated, axistobeupdated=="X" ? attr[initdim1] : attr[initdim2]); 
  
  console.log(graph.dropzone);
}

updatebycb = function(axistobeupdated, selectedattr) {
    data = graph.points;
    var V = [], newxname = selectedattr;
    for (var i = 0; i<attrNo; i++) {
      V[i] = {"attr": attr[i], "value": attr[i]==selectedattr ? 1 : 0, "error":0};
    }
    for (var i = 0; i<attr2.length; i++) {
      if (attr2[i]["attr"]==selectedattr) {V = attr2[i]["vector"];}
    }
    
    d3.select("#SC").remove();
    d3.select("#"+axistobeupdated).remove();
    data.forEach(function(d) {d[axistobeupdated=="X" ? "x" : "y"] = d["coord"][newxname]; });
    graph = new SimpleGraph("scplot", data, {
            "xlabel": axistobeupdated == "X" ? newxname : graph.options.xlabel,
            "ylabel": axistobeupdated == "X" ? graph.options.ylabel : newxname,
            "init": axistobeupdated,
            "dropzone": graph.dropzone
          });
    if (axistobeupdated == "X") { X = V; xaxis = new axis("#scplot", V, axistobeupdated, axisOptions[axistobeupdated]); }
    else { Y = V; yaxis = new axis("#scplot", V, axistobeupdated, axisOptions[axistobeupdated]); }
}

saveAxis = function(axistobeupdated) {
  var newxname = axistobeupdated=="X" ? graph.options.xlabel : graph.options.ylabel;
  var count = 0;
  for (var i = 0; i<attr2.length; i++) {
    if (attr2[i]["attr"]==newxname) {
      count = count + 1;
      break;
    }
  }
  for (var i = 0; i<attr.length; i++) {
    if (attr[i]==newxname) {
      count = count + 1;
      break;
    }
  }
  if (count==0) {
    addNewAxis(newxname, axistobeupdated=="X" ? X : Y);
    setTimeout(function(){document.getElementById("cb"+axistobeupdated).selectedIndex = attrNo+attr2.length-1;}, 3);
  }
}

addNewAxis = function(newxname, newaxisvector) {
  attr2[attr2.length] = {"attr": newxname, "vector": newaxisvector};
  d3.select("#cbY").append("option").attr("value",newxname).text(newxname);
  d3.select("#cbX").append("option").attr("value",newxname).text(newxname);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Time Series Bar Chart
//
// Marc Gumowski
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// The data are loaded in the main .Rmd file under the var name tsbar.
// This script has to be loaded in the main file.
//
// Based on : http://bl.ocks.org/mbostock/3943967


var margin = { top: 50, left: 50, right: 50, bottom: 75 };
var rescale = 1.35;
var width = 480 * rescale - margin.left - margin.right;
var height = 480 * rescale - margin.top - margin.bottom;

var div = d3.select('#timeSeriesBarInteractive').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

var svg = d3.select("#timeSeriesBarInteractive").append("svg")
    .attr('id', 'timeSeriesBarInteractiveSvg')
    .attr("height", height + margin.top + margin.bottom)
    .attr("width", width + margin.left + margin.right);
    
var rect = svg.append("rect")
    .attr("height", height)
    .attr("width", width)
    .attr("class", "background")
    .style("fill", "transparent")
    .style('opacity', 0);  
    
var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + ","  + margin.top + ")");    
    
var m = d3.map(tsbar.year, function(d){return d;}).keys().length, // The number of values per series. 
    n = tsbar.count.length / m; // The number of series.

// The xz array has m elements, representing the x-values shared by all series.
// The yz array has n elements, representing the y-values of each of the n series.
// Each yz[i] is an array of m non-negative numbers representing a y-value for xz[i].
// The y01z array has the same structure as yz, but with stacked [y₀, y₁] instead of y.    
var xz = d3.range(m),
    yz = [];
    
    for (var i = 0; i < tsbar.count.length / 2; i += 1) {
        yz[i] = [];
    yz[i].push(tsbar.count[i*2]);
    yz[i].push(tsbar.count[i*2 + 1]);
    }    
    
var y01z = d3.stack().keys(d3.range(n))(d3.transpose(yz)),
    yMax = d3.max(yz, function(y) { return d3.max(y); }),
    y1Max = d3.max(y01z, function(y) { return d3.max(y, function(d) { return d[1]; }); });

var x = d3.scaleBand()
    .domain(xz)
    .rangeRound([0, width])
    .padding(0.25);

var y = d3.scaleLinear()
    .domain([0, y1Max])
    .range([height, 0]);
    
var xAxis = d3.axisBottom(x)
            .tickSize(0)
            .tickFormat(function(d, i) { return tsbar.year[i]; });
            
var yAxis = d3.axisRight(y)
            .tickSize(width);       

var color = d3.scaleOrdinal()
    .domain(d3.range(n))
    //.range(d3.schemeCategory10);
    .range(["#FFFFCC", "#FED9A6", "#DECBE4", "#CCEBC5", "#B3CDE3", "#FBB4AE"]);

// Draw custom y-axis (before appending series "g" element)
g.append("g")
    .attr("class", "y axis")
    .call(customYAxis);

var seriesTSBar = g.selectAll(".seriesTSBar")
  .data(y01z)
  .enter().append("g")
    .attr("fill", function(d, i) { return color(i); });

var rectBar = seriesTSBar.selectAll("rectBar")
  .data(function(d) { return d; })
  .enter().append("rect")
    .attr("class", "TSBar")
    .attr("x", function(d, i) { return x(i); })
    .attr("y", height)
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .on('click', function(d) {
         console.log(d);
      })
    .on('mouseover', function(d) {      
      div.transition()        
      .duration(0)      
      .style('opacity', 1);
    div.html('<b><font size = "3"> Number of members: ' + (d[1] - d[0]) + '</font></b>')
      .style('left', (d3.event.pageX - 75)+ 'px')    
      .style('top', (d3.event.pageY - 75) + 'px');    
      })
    .on('mousemove', function(d) {
      div.transition()        
      .duration(0)      
      .style('opacity', 1);
    div.html('<b><font size = "3"> Number of members: ' + (d[1] - d[0]) + '</font></b>')
      .style('left', (d3.event.pageX- 75) + 'px')  
      .style('top', (d3.event.pageY - 75) + 'px');   
    })  
    .on('mouseout', function(d) {       
      div.transition()        
      .duration(500)
      .style('opacity', 0);
     })  ;

// Draw custom x-axis 
g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(customXAxis);

// Starting transition
rectBar.transition()
    .delay(function(d, i) { return i * 10; })
    .attr("y", function(d) { return y(d[1]); })
    .attr("height", function(d) { return y(d[0]) - y(d[1]); });

// Sort bars on click
rect.on("click", changed); 

// Legend
var legendRectText = ["Duty Free", "   0<5   ", "   5<10  ", "  10<15  ", "  15<25  ", "  25<50  "];
  
var legend = svg.append('g')
    .attr('class', 'legend')
    .selectAll('g')
    .data(color.domain())
    .enter().append('g')
    .attr('transform', function(d, i) { return 'translate(' + i * 62 + ', 0)'; });

legend.append('rect')
    .attr('y', height + margin.top + margin.bottom - 8)
    .attr('x', width / 2 - margin.left - margin.right - 30)
    .attr('width', 60)
    .attr('height', 10)
    .style('fill', color);
  
legend.append('text')
    .data(legendRectText)
    .attr('y', height + margin.top + margin.bottom - 16)
    .attr('x', width / 2 - margin.left - margin.right)
    .attr('dy', '.35em')
    .style('text-anchor', 'middle')
    .style('fill', '#666666')
    .style('font', '14px sans-serif')
    .style('font-family', 'calibri')
    .text(function(d) { return d; });


// Functions
var stacked = true;
function changed() {
  if (stacked === true) {
    transitionGrouped();
    stacked = false; 
  }
  else {
    transitionStacked();
    stacked = true;
  }
}

function transitionGrouped() {
  y.domain([0, yMax]);

  rectBar.transition()
      .duration(500)
      .delay(function(d, i) { return i * 10; })
      .attr("x", function(d, i) { return x(i) + x.bandwidth() / n * this.parentNode.__data__.key; })
      .attr("width", x.bandwidth() / n)
    .transition()
      .attr("y", function(d) { return y(d[1] - d[0]); })
      .attr("height", function(d) { return y(0) - y(d[1] - d[0]); });
      
  g.selectAll(".y.axis").transition()
      .duration(1000)
      .call(customYAxis);
}

function transitionStacked() {
  y.domain([0, y1Max]);

  rectBar.transition()
      .duration(500)
      .delay(function(d, i) { return i * 10; })
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
    .transition()
      .attr("x", function(d, i) { return x(i); })
      .attr("width", x.bandwidth());
      
  g.selectAll(".y.axis").transition()
      .duration(1000)
      .call(customYAxis);
} 

function customXAxis(g) {
  g.call(xAxis);
  g.select(".domain").attr("stroke", "#666666").attr("stroke-width", 1.5);
  g.selectAll(".tick text").attr("dy", 20).style('font', '14px sans-serif').style('font-family', 'calibri')
  .style("fill", "#666666");
}

function customYAxis(g) {
  var s = g.selection ? g.selection() : g;
  g.call(yAxis);
  s.select(".domain").remove();
  s.selectAll(".tick line").attr("stroke", "#666666").attr("stroke-dasharray", "2,2")
    .attr("stroke-width", 0.5);
  s.selectAll(".tick text").attr("x", 4).attr("dy", -4).style("fill", "#666666");
  if (s !== g) g.selectAll(".tick text").attrTween("x", null).attrTween("dy", null);
}
   

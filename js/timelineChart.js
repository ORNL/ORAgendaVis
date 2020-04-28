var timelineChart = function () {
  let margin = {top:20, right:20, bottom: 20, left: 20};
  let width = 900 - margin.left - margin.right;
  let height = 400 - margin.top - margin.bottom;

  var highlightString = '';

  let chartData;
  let chartDiv;
  let gapLines;
  let spanLines;
  let labels;
  let dots;

  let selectedColor = "mediumblue";
  let unselectedColor = "gray";
  let normalColor = "#222";

  const orders = ({
    Start: (a, b) => d3.ascending(a.start, b.start),
    End: (a, b) => d3.ascending(a.end || today, b.end || today) || d3.ascending(a.start, b.start),
    Duration: (a, b) => d3.descending((a.end || today) - a.start, (b.end || today) - b.start)
  });
  // const today = new Date(Date.UTC(2021, 0, 1));
  // let endDate = new Date(Date.UTC(2021, 0));
  let endDate;

  function chart(selection, data) {
    // chartData = data.slice().sort(orders.Start);
    endDate = d3.max(data, d => d.end);
    // console.log(endDate);
    chartData = data.slice();
    chartDiv = selection;
    drawChart();
  }

  var count = 0;

  function getID(name) {
    const id = "0-" + (name === null ? "" : name + "-") + ++count;
    return id;
  }

  const getColorByName = d => d.name.toLowerCase().includes(highlightString.toLowerCase()) ? selectedColor : unselectedColor;
  const getOpacityByName = d => d.name.toLowerCase().includes(highlightString.toLowerCase()) ? null : 0.6;

  function drawChart() {
    if (chartData) {
      chartDiv.selectAll('*').remove();
      if (chartData) {      
        // console.log(endDate);

        const svg = chartDiv.append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
          .domain([d3.min(chartData, d => d.start), endDate])
          .rangeRound([0, width]);

        const y = d3.scalePoint()
          .domain(chartData.map(d => d.name))
          .rangeRound([0, height])
          .padding(1);
        
        const xAxis = g => g
          .call(d3.axisTop(x).ticks(x.domain()[1] - x.domain()[0]).tickFormat(x => `FY${x.toFixed(4).substring(2,4)}`))
          .call(g => g.select(".domain").remove())
          .call(g => g.append("g")
              .attr("stroke", "white")
              .attr("stroke-width", 2)
            .selectAll("line")
            .data(x.ticks(x.domain()[1] - x.domain()[0]))
            .join("line")
              .attr("x1", d => 0.5 + x(d))
              .attr("x2", d => 0.5 + x(d))
              .attr("y2", height))
          .call(g => g.selectAll(".tick text")
            .attr("font-size", 12));
        
        g.append("defs")
          .selectAll("linearGradient")
          // .data(chartData.filter(d => d.end !== null))
          .data(chartData.filter(d => d.end !== x.domain()[1]))
          .join("linearGradient")
            .attr("id", d => (d.gradientId = getID("gradient")))
            // .attr("id", d => (d.gradientId = DOM.uid("gradient")).id)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", d => x(d.start))
            .attr("x2", d => x(d.end))
            .call(g => g.append("stop").attr("stop-color", "black"))
            .call(g => g.append("stop").attr("offset", "100%").attr("stop-color", "#aaa"));
        
        gapLines = g.append("g")
            .attr("stroke-width", 1.5)
            // .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .attr("stroke-dasharray", "2,4")
            // .attr("stroke", "#777")
          .selectAll("line")
          // .data(d3.merge(chartData.map(d => d.gaps)))
          .data(d3.merge(chartData.map(d => d.gaps.slice().map(s => { return {name: d.name, start: s.start, end: s.end, gradientId: d.gradientId}; }))))
          .join("line")
            .attr("stroke", d => highlightString.length > 0 ? getColorByName(d) : "#777")
            .attr("x1", d => x(d.start))
            .attr("x2", d => x(d.end || x.domain()[1]))
            .attr("y1", d => y(d.name) + 0.5)
            .attr("y2", d => y(d.name) + 0.5);

        spanLines = g.append("g")
            .attr("stroke-width", 2)
            // .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
          .selectAll("line")
          // .data(chartData)
          // .data(d3.merge(chartData.map(d => d.spans.slice())))
          .data(d3.merge(chartData.map(d => d.spans.slice().map(s => { return {name: d.name, start: s.start, end: s.end, gradientId: d.gradientId}; }))))
          .join("line")
            // .attr("stroke", "black")
            .attr("stroke", d => d.gradientId ? `url(#${d.gradientId})` : "black")
            // .attr("stroke", d => d.end === x.domain()[1] ? "black" : `url(#${d.gradientId})`)
            // .attr("stroke-opacity", d => d.end === x.domain()[1] ? null : 0.7)
            .attr("x1", d => x(d.start))
            .attr("x2", d => x(d.end || x.domain()[1]))
            .attr("y1", d => y(d.name) + 0.5)
            .attr("y2", d => y(d.name) + 0.5);

        g.append("g")
          .call(xAxis);

        labels = g.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 14)
            .attr("text-anchor", "end")
          .selectAll("text")
          .data(chartData)
          .join("text")
            .attr("x", d => x(d.start) - 6)
            .attr("y", d => y(d.name))
            .attr("dy", "0.35em")
            .attr("fill", d => highlightString.length > 0 ? getColorByName(d) : normalColor)
            .attr("fill-opacity", d => highlightString.length > 0 ? getOpacityByName(d) : null)
            // .attr("fill-opacity", d => d.end === x.domain()[1] ? null : 0.7)
            .attr("font-weight", d => d.end === x.domain()[1] ? "bold" : null)
            // .attr("font-weight", d => d.end.getFullYear() === x.domain()[1].getFullYear() ? "bold" : null)
            // .attr("fill-opacity", d => d.end === null ? null : 0.6)
            .text(d => d.name);

        // if (highlightString.length > 0) {
        //   labels.attr('fill', getColorByName);
          // spanLines.attr('stroke', getColorByName);
          // gapLines.attr('stroke', getColorByName);
        // }

        dots = g.append("g")
            // .attr("fill", "black")
          .selectAll("circle")
          .data(chartData.filter(d => d.end !== x.domain()[1]))
          .join("circle")
            .attr("fill", d => highlightString.length > 0 ? getColorByName(d) : normalColor)
            .attr("cx", d => x(d.end))
            .attr("cy", d => y(d.name) + 0.5)
            .attr("r", 2);
      }
    }
  };

  chart.setHighlightString = function(value) {
    if (!arguments.length) {
      return highlightString;
    }
    highlightString = value;

    // highlight span lines, gap lines, and labels of items with names that include the highlightString
    // drawChart();
    if (chartData) {
      dots.attr("fill", d => highlightString.length > 0 ? getColorByName(d) : normalColor);
      labels
        .attr("fill", d => highlightString.length > 0 ? getColorByName(d) : normalColor)
        .attr("fill-opacity", d => highlightString.length > 0 ? getOpacityByName(d) : null);
      spanLines
        .attr('stroke', d => highlightString.length > 0 ? getColorByName(d) : d.gradientId ? `url(#${d.gradientId})` : normalColor)
        .attr('opacity', d => highlightString.length > 0 ? getOpacityByName(d) : null);
      gapLines
        .attr("stroke", d => highlightString.length > 0 ? getColorByName(d) : "#777");

      // if (highlightString.length === 0) {
      //   labels.attr('fill', normalColor);
      //   labels.attr('fill-opacity', null);
      //   spanLines.attr("stroke", d => d.gradientId ? `url(#${d.gradientId})` : "black");
        
      // } else {
      //   labels.attr('fill', getColorByName);
      //   labels.attr('fill-opacity', getOpacityByName);
      //   spanLines.attr('stroke', getColorByName);
      //   spanLines.attr('fill-opacity', getOpacityByName);
      // }
      // spanLines.attr('fill', getColorByName);
      // gapLines.attr('fill', getColorByName);
    }

    return chart;
  }

  chart.margin = function(value) {
    if (!arguments.length) {
      return margin;
    }
    oldChartWidth = width + margin.left + margin.right;
    oldChartHeight = height + margin.top + margin.bottom;
    margin = value;
    width = oldChartWidth - margin.left - margin.right;
    height = oldChartHeight - margin.top - margin.bottom;
    return chart;
  };

  chart.width = function(value) {
    if (!arguments.length) {
      return width;
    }
    width = value - margin.left - margin.right;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) {
      return height;
    }
    height = value - margin.top - margin.bottom;
    drawChart();
    return chart;
  };

  return chart;
}
var timelineChart = function () {
  let margin = {top:20, right:20, bottom: 20, left: 20};
  let width = 900 - margin.left - margin.right;
  let height = 400 - margin.top - margin.bottom;

  var highlightStrings = [];

  let chartData;
  let chartDiv;
  let gapLines;
  let spanLines;
  let labels;
  let dots;

  let selectedColor = "mediumblue";
  let unselectedColor = "gray";
  let normalColor = "#222";

  let endDate;
  var count = 0;

  const orders = ({
    Start: (a, b) => d3.ascending(a.start, b.start),
    End: (a, b) => d3.ascending(a.end || today, b.end || today) || d3.ascending(a.start, b.start),
    Duration: (a, b) => d3.descending((a.end || today) - a.start, (b.end || today) - b.start)
  });

  function chart(selection, data) {
    // chartData = data.slice().sort(orders.Start);
    endDate = d3.max(data, d => d.end);
    chartData = data.slice();
    chartDiv = selection;
    drawChart();
  }

  function getID(name) {
    const id = "0-" + (name === null ? "" : name + "-") + ++count;
    return id;
  }

  const isNameHighlighted = (name) => {
    for (let i = 0; i < highlightStrings.length; i++) {
      if (name.toLowerCase().includes(highlightStrings[i])) {
        return true;
      }
    }
    return false;
  };

  // const getColorByName = d => d.name.toLowerCase().includes(highlightString.toLowerCase()) ? selectedColor : unselectedColor;
  // const getOpacityByName = d => d.name.toLowerCase().includes(highlightString.toLowerCase()) ? null : 0.6;
  const getLabelColorByName = d => highlightStrings.length === 0 ? normalColor : isNameHighlighted(d.name) ? selectedColor : unselectedColor;
  const getLineColorByName = d => highlightStrings.length === 0 ? d.gradientId ? `url(#${d.gradientId})` : normalColor : isNameHighlighted(d.name) ? selectedColor : unselectedColor;
  const getOpacityByName = d => highlightStrings.length === 0 ? null : isNameHighlighted(d.name) ? null : 0.6;

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

        const oneYearWidth = width / (endDate - x.domain()[0]);
        // console.log(oneYearWidth);

        const y = d3.scalePoint()
          .domain(chartData.map(d => d.name))
          .rangeRound([0, height])
          .padding(1);
        
        const xAxis = g => g
          .call(d3.axisTop(x).ticks(x.domain()[1] - x.domain()[0]).tickFormat(x => `${x.toFixed(4).substring(2,4)}`))
          .call(g => g.select(".domain").remove())
          .call(g => g.append("g")
              .attr("stroke", normalColor)
              .attr("stroke-opacity", 0.2)
              .attr("stroke-dasharray", "1.5,2")
              // .attr("stroke", "white")
              // .attr("stroke-width", 2)
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
            .attr("stroke-width", 1.2)
            // .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .attr("stroke-dasharray", "1,2")
            // .attr("stroke", "#777")
          .selectAll("line")
          // .data(d3.merge(chartData.map(d => d.gaps)))
          .data(d3.merge(chartData.map(d => d.gaps.slice().map(s => { return {name: d.name, start: s.start, end: s.end, gradientId: d.gradientId}; }))))
          .join("line")
            .attr("stroke", d => getLineColorByName(d.name))
            // .attr("stroke", d => highlightString.length > 0 ? getColorByName(d) : "#777")
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
            .attr("stroke", d => getLineColorByName(d))
            // .attr("stroke", d => d.gradientId ? `url(#${d.gradientId})` : "black")
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
            .attr("fill", d => getLabelColorByName(d))
            .attr("fill-opacity", d => getOpacityByName(d))
            // .attr("fill", d => highlightString.length > 0 ? getColorByName(d) : normalColor)
            // .attr("fill-opacity", d => highlightString.length > 0 ? getOpacityByName(d) : null)
            // .attr("fill-opacity", d => d.end === x.domain()[1] ? null : 0.7)
            .attr("font-weight", d => d.end === x.domain()[1] ? "bold" : null)
            // .attr("font-weight", d => d.end.getFullYear() === x.domain()[1].getFullYear() ? "bold" : null)
            // .attr("fill-opacity", d => d.end === null ? null : 0.6)
            .text(d => d.name);

        const themeYears = d3.merge(chartData.map(d => {
          return d.years.map(y => { return {name: d.name, year: y}; })
        }));
        // console.log(themeYears);
        const yearDots = g.append("g")
            .selectAll("circle")
          .data(themeYears)
          .join("circle")
            .attr("stroke", "white")
            .attr("stroke-width", 1.5)
            .attr("fill", "#777")  
            // .attr("fill-opacity", 0.5)
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.name) + 0.5)
            .attr("r", 2.5);

        dots = g.append("g")
            // .attr("fill", "black")
          .selectAll("circle")
          .data(chartData.filter(d => d.end !== x.domain()[1]))
          .join("circle")
            .attr("fill", d => getLabelColorByName(d))
            // .attr("fill", d => highlightString.length > 0 ? getColorByName(d) : normalColor)
            .attr("cx", d => x(d.end))
            .attr("cy", d => y(d.name) + 0.5)
            .attr("r", 3.5);
        
        function hover(svg) {
          if ("ontouchstart" in document) svg
            .style("-webkit-tap-highlight-color", "transparent")
            .on("touchmove", moved)
            .on("touchstart", entered)
            .on("touchend", left)
          else svg
            .on('mousemove', moved)
            .on('mouseenter', entered)
            .on('mouseleave', left);

          const hoverDot = g.append("g")
            .attr("display", "none");

          const linkLines = g.append("g")
            .attr("fill", "none")
            .attr("stroke", normalColor)
            .attr("stroke-opacity", 0.7)
            .attr("display", "none")
            .attr("stroke-dasharray", "4,2");
          
          // const linkDots = g.append("g")
          //   .attr("fill", normalColor)
          //   .attr("fill-opacity", 0.7)
          //   .attr("display", "none");

          hoverDot.append("circle").attr("r", 2.5);

          hoverDot.append("text")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "middle")
            .attr("y", -8);
          
          function invertY(yPos) {
            const nameIndex = Math.floor((yPos / y.step()) - 1);
            nameIndex < 0 ? 0 : nameIndex > (y.domain().length - 1) ? (y.domain().length - 1) : nameIndex;
            return y.domain()[nameIndex];
            // return y.domain()[Math.floor((yPos / y.step()) - 0.5)];
          }

          function moved () {
            d3.event.preventDefault();

            linkLines.selectAll('path').remove();
            // linkDots.selectAll('circle').remove();

            const ym = invertY(d3.mouse(this)[1] - margin.top);
            const xm = Math.round(x.invert(d3.mouse(this)[0] - margin.left));
            const hoverTheme = chartData.find(d => d.name === ym);
            if (hoverTheme) {
              // console.log(hoverTheme.spans.includes(d => xm >= d.start && xm <= d.end));
              if (hoverTheme.spans.find(d => xm >= d.start && xm <= d.end)) {
                hoverTheme.linkedThemes.forEach((links, year) => {
                  // console.log(links);

                  function arc(d) {
                    const y1 = y(ym);
                    const y2 = y(d);
                    const r = Math.abs(y2 - y1) / 2;
                    const rx = r > oneYearWidth ? oneYearWidth : r;
                    return `M${x(year)},${y1}A${rx},${r} 0,0,${y1 < y2 ? 1 : 0} ${x(year)},${y2}`;
                  }

                  linkLines.selectAll('themeLinks')
                    .data(links)
                    .join('path')
                      .attr('d', arc);

                  // linkDots.selectAll('dstDots')
                  //   .data(links)
                  //   .join('circle')
                  //     .attr('cx', x(year))
                  //     .attr('cy', d => y(d))
                  //     .attr('r', 2);
                });
                // const linkedThemes = hoverTheme.linkedThemes.get(xm);
                // if (linkedThemes) {
                //   console.log(linkedThemes);

                // function arc(d) {
                //   const y1 = y(ym);
                //   const y2 = y(d);
                //   const r = Math.abs(y2 - y1) / 2;
                //   const rx = r > oneYearWidth ? oneYearWidth : r;
                //   return `M${x(xm)},${y1}A${rx},${r} 0,0,${y1 < y2 ? 1 : 0} ${x(xm)},${y2}`;
                // }

                // linkLines.selectAll('themeLinks')
                //   .data(linkedThemes)
                //   .join("path")
                //     .attr("d", arc);
                // }
                hoverDot.attr('display', null);
                hoverDot.attr('transform', `translate(${x(xm)}, ${y(ym)})`);
              } else {
                hoverDot.attr('display', 'none');
              }
            }
          }

          function entered() {
            hoverDot.attr("display", null);
            hoverDot.raise();
            linkLines.attr("display", null);
            linkLines.raise();
            // linkDots.attr("display", null);
            // linkDots.raise();
          }

          function left() {
            hoverDot.attr("display", "none");
            linkLines.attr("display", "none");
            // linkDots.attr("display", "none");
          }
        }

        svg.call(hover);
      }
    }
  };

  chart.setHighlightStrings = function(value) {
    if (!arguments.length) {
      return highlightStrings;
    }
    let strings = d3.csvParseRows(value)[0];
    highlightStrings = [];
    if (strings) {
      strings.forEach(s => {
        if (s.trim().length > 0) {
          highlightStrings.push(s.trim().toLowerCase());
        }
      });
    }
    
    if (chartData) {
      dots.attr("fill", d => getLabelColorByName(d));
      labels.attr("fill", d => getLabelColorByName(d))
        .attr("fill-opacity", d => getOpacityByName(d));
      spanLines.attr("stroke", d => getLineColorByName(d))
        .attr("stroke-opacity", d => getOpacityByName(d));
      gapLines.attr("stroke", d => getLineColorByName(d));
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
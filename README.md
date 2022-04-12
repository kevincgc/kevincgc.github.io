# Unpacking Happiness

A website to visualize national happiness scores around the world.

## Citations for modifications

### [Ref-1] Gradient Legend - bl.ocks.org
**Problem**: Displaying a legend that contains a gradient of colors  
**Modification**: Added offset and stop-color to a rect at intervals of our color scale to create a gradient scale 
```
.enter().append("stop")
        .attr("offset", d => ((d.value - extent[0]) / (extent[1] - extent[0]) * 100) + "%")
        .attr("stop-color", d => d.color);
```
**Source**: [bl.ocks.org: Gradient Legend - bl.ocks.org](https://bl.ocks.org/HarryStevens/6eb89487fc99ad016723b901cbd57fde)

---
### [Ref-2] Radar Chart d3 - github.com
**Problem**: Creating radar chart paths   
**Modification**: Math equation for calculating line angles for each attribute axis on a radar chart 
```
const calculateLineAngle = (i) => (Math.PI * 2 * (i + 1) / vis.axes.length) + (Math.PI / 2);
const xValue = (i, value) => Math.cos(calculateLineAngle(i)) * value;
const yValue = (i, value) => Math.sin(calculateLineAngle(i)) * value;
```
**Source**: [github.com: alangrafu/radar-chart-d3: Simple radar chart in D3.js](https://github.com/alangrafu/radar-chart-d3)

---

### [Ref-3] LineChart d3 
**Problem**: Creating a plot for average over all selected countries
**Modification**: Rollup data based on year, find the mean and add it to the chart

**Sources**: 
- [Interactive line charts](https://github.com/UBC-InfoVis/436V-materials/tree/22Jan/d3-examples/d3-interactive-line-chart)
- [Overvable d3 rollups](https://observablehq.com/@d3/d3-group)
- [Geeks for Geeks](https://www.geeksforgeeks.org/d3-js-rollup-method/)
---

### [Ref-4] Scatterplot d3
**Problem**: 
- Drag to select regions 
- Show distribution of regions 
- Plot the line of best fit 
- Plot the confidence interval 
- Make the confidence interval adjustable 
- Make the distribution adjustable 
- 
**Modification**: 
- Implement d3.brush to select multiple points by dragging
- Use ss.linearRegressionLine to find the line of best fit
- Find the confidence interval using linear regression and inverse transformation with a customizable value
- Use curveBasis on histogram to show distributions 

**Sources**:
- [Scatterplot](https://github.com/UBC-InfoVis/436V-materials/tree/22Jan/d3-examples/d3-interactive-scatter-plot)
- [Histogram in d3](https://d3-graph-gallery.com/graph/histogram_basic.html)
- [d3 brush](https://github.com/d3/d3-brush)
- [Linear Regression Line](https://observablehq.com/@bbruneau/simple-linear-regression-scatterplot-with-d3)
- [Confidence interval](https://www.statisticshowto.com/probability-and-statistics/confidence-interval/)
- [Currve basis](https://www.geeksforgeeks.org/d3-js-curvebasis-method/)
---

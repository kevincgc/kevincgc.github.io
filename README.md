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
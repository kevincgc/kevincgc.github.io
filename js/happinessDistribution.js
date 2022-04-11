class HappinessDistribution {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _colors) {
        this.config = {
            parentElement: _config.parentElement,
            attribute_selected: _config.attribute_selected,
            containerWidth: _config.containerWidth || 900,
            containerHeight: _config.containerHeight || 150,
            margin: _config.margin || {top: 25, right: 20, bottom: 20, left: 35},
            tooltipPadding: _config.tooltipPadding || 15
        }
        this.data = _data;
        this.colors = _colors;
        this.initVis();
    }

    /**
     * We initialize scales/axes and append static elements, such as axis titles.
     */
    initVis() {
        let vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.parseDate = d3.timeParse("%Y");

        vis.xScale = d3.scaleLinear()
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(10)
            .tickSize(-10)
            .tickPadding(10);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(3)
            .tickSize(0)
            .tickPadding(10);

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .append("svg")
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);

        // Append y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');
    }

    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
        let vis = this;

        vis.xValue = d => d['Happiness Score']
        vis.yValue = d => d[scatterplot_attribute]

        vis.yearFilteredData = data.filter(d => (d.year === selectedYear && vis.yValue(d) !== 0));

        vis.filtered_regions = vis.yearFilteredData.filter(d => filteredRegionIds.includes(d.id))

        const maxVal = d3.max(vis.yearFilteredData, vis.xValue)
        vis.computedData = [];

        for (let i = 0; i < maxVal; i++) {
            const count = vis.yearFilteredData.filter(d => d['Happiness Score'] >= i && d['Happiness Score'] < i + 1).length
            vis.computedData.push({x: i, y: count})
        }

        vis.filteredComputedData = [];

        for (let i = 0; i < maxVal; i++) {
            const count = vis.filtered_regions.filter(d => d['Happiness Score'] >= i && d['Happiness Score'] < i + 1).length
            vis.filteredComputedData.push({x: i, y: count})
        }

        vis.computedX = d => d["x"]
        vis.computedY = d => d["y"]

        vis.histogram  = d3.histogram()
            .value((d) => d['Happiness Score'])
            .domain(vis.xScale.domain())
            .thresholds(vis.xScale.ticks(10));


        vis.maxX = d3.max(vis.yearFilteredData, vis.xValue)

        vis.xScale.domain([0, vis.maxX]);
        vis.yScale.domain([0, d3.max(vis.computedData, vis.computedY)]);
        vis.renderVis();
    }

    /**
     * Bind data to visual elements.
     */
    renderVis() {
        let vis = this;

        vis.chart.selectAll(".bar")
            .data(vis.computedData)
            .join("rect")
            .attr("class", "bar")
            .attr("x", d => vis.xScale(vis.computedX(d)))
            .attr("y", d => vis.yScale(vis.computedY(d)))
            .attr("height", (d) => vis.height - vis.yScale(vis.computedY(d)))
            .attr("width", vis.width / vis.maxX)
            .style("opacity", 0.5)

        vis.chart.selectAll(".selected-bar")
            .data(vis.filteredComputedData)
            .join("rect")
            .attr("class", "selected-bar")
            .attr("x", d => vis.xScale(vis.computedX(d)))
            .attr("y", d => vis.yScale(vis.computedY(d)))
            .attr("height", (d) => vis.height - vis.yScale(vis.computedY(d)))
            .attr("width", vis.width / vis.maxX)
            .style("opacity", 0.5)
            .style("fill", regionColor)
    }
}
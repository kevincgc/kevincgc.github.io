class AttributeDistribution {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _colors) {
        this.config = {
            parentElement: _config.parentElement,
            attribute_selected: _config.attribute_selected,
            containerWidth: _config.containerWidth || 100,
            containerHeight: _config.containerHeight || 400,
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
            .ticks(3)
            .tickSize(-10)
            .tickPadding(10);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(6)
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

        vis.diffMap = {
            "Happiness Score": 0.5,
            "Log GDP per capita": 0.5,
            "Social support": 0.05,
            "Healthy life expectancy at birth": 2,
            "Freedom to make life choices": 0.05,
            "Generosity": 0.1,
            "Perceptions of corruption": 0.1
        }
    }

    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
        let vis = this;

        vis.yValue = d => d[scatterplot_attribute];
        vis.yearFilteredData = data.filter(d => (d.year === selectedYear && vis.yValue(d) !== 0));

        const maxVal = d3.max(vis.yearFilteredData, vis.yValue)

        vis.computedData = [];
        const diff = vis.diffMap[scatterplot_attribute]

        const start = Math.floor(d3.min(vis.yearFilteredData, vis.yValue))

        for (let i = start; i < maxVal; i = i+diff) {
            const count = vis.yearFilteredData.filter(d => d[scatterplot_attribute] >= i && d[scatterplot_attribute] < i + diff).length
            vis.computedData.push({x: count, y: i+diff})
        }

        vis.filtered_regions = vis.yearFilteredData.filter(d => filteredRegionIds.includes(d.id))
        vis.filteredComputedData = [];

        for (let i = start; i < maxVal; i = i+diff) {
            const count = vis.filtered_regions.filter(d => d[scatterplot_attribute] >= i && d[scatterplot_attribute] < i + diff).length
            vis.filteredComputedData.push({x: count, y: i+diff})
        }

        vis.computedX = d => d["x"]
        vis.computedY = d => d["y"]

        vis.histogram  = d3.histogram()
            .value((d) => d[scatterplot_attribute])
            .domain(vis.yScale.domain())
            .thresholds(vis.yScale.ticks(6));


        vis.maxY = d3.max(vis.computedData, vis.computedY)
        vis.maxX = d3.max(vis.computedData, vis.computedX)

        // Set the scale input domains
        vis.xScale.domain([0, vis.maxX]);
        vis.yScale.domain([d3.min(vis.yearFilteredData, vis.yValue), maxVal]);
        vis.renderVis();
    }

    /**
     * Bind data to visual elements.
     */
    renderVis() {
        let vis = this;

        vis.bins = vis.histogram(vis.yearFilteredData)
        vis.chart
            .selectAll(".bar")
            .data(vis.computedData)
            .join("rect")
            .attr("class", "bar")
            .attr("y", d => vis.yScale(vis.computedY(d)))
            .attr("height", vis.height / vis.yScale.ticks().length)
            .attr("width", d => vis.xScale(vis.computedX(d)))
            .style("opacity", 0.5)

        vis.chart.selectAll(".selected-bar")
            .data(vis.filteredComputedData)
            .join("rect")
            .attr("class", "selected-bar")
            .attr("y", d => vis.yScale(vis.computedY(d)))
            .attr("height", vis.height / vis.yScale.ticks().length)
            .attr("width", d => vis.xScale(vis.computedX(d)))
            .style("opacity", 0.5)
            .style("fill", "#004488")
    }
}

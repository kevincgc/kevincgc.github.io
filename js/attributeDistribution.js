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
            containerWidth: _config.containerWidth || 150,
            containerHeight: _config.containerHeight || 600,
            margin: _config.margin || {top: 25, right: 20, bottom: 20, left: 0},
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

        vis.xScale = d3.scaleLinear()
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height,0]);

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .append("svg")
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(10,0)`);

        vis.overall = vis.chart.append("path")
            .attr("class", "happiness-overall")
            .attr("fill", "#777")
            .attr("opacity", ".8")
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .attr("stroke-linejoin", "round");

        vis.selected = vis.chart.append("path")
            .attr("class", "happiness-overall")
            .attr("fill", "#004488")
            .attr("opacity", ".8")
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .attr("stroke-linejoin", "round");
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

        // set the parameters for the histogram
        vis.histogram = d3.histogram()
            .value(function(d) {return vis.yValue(d);})
            .domain([d3.min(vis.yearFilteredData, vis.yValue) - Math.abs(d3.max(vis.yearFilteredData, vis.yValue) * 0.1),
                d3.max(vis.yearFilteredData, vis.yValue) + d3.max(vis.yearFilteredData, vis.yValue) * 0.1])
            .thresholds(binSize); // then the numbers of bins
        // And apply this function to data to get the bins
        vis.bins = vis.histogram(vis.yearFilteredData);
        vis.binsCount = [];
        for (let i = 0; i < vis.bins.length; i++) {
            vis.binsCount.push([i, vis.bins[i].length]);
        }
        vis.selectedBins = vis.histogram(vis.filtered_regions);
        vis.selectedBinsCount = [];
        for (let i = 0; i < vis.selectedBins.length; i++) {
            vis.selectedBinsCount.push([i, vis.selectedBins[i].length]);
        }

        vis.xScale.domain([0, d3.max(vis.binsCount, d => d[1])]);
        vis.yScale.domain([0, vis.bins.length]);
        vis.renderVis();
    }

    /**
     * Bind data to visual elements.
     */
    renderVis() {
        let vis = this;

        vis.overall.datum(vis.binsCount)
            .attr("d",  d3.line()
                .curve(d3.curveBasis)
                .x(function(d) { return vis.xScale(d[1]); })
                .y(function(d) { return vis.yScale(d[0]); })
            );

        vis.selected.datum(vis.selectedBinsCount)
            .attr("d",  d3.line()
                .curve(d3.curveBasis)
                .x(function(d) { return vis.xScale(d[1]); })
                .y(function(d) { return vis.yScale(d[0]); })
            );
    }
}

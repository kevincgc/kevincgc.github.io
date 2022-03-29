class Scatterplot {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _regions) {
        this.config = {
            parentElement: _config.parentElement,
            attribute_selected: _config.attribute_selected,
            containerWidth: _config.containerWidth || 600,
            containerHeight: _config.containerHeight || 400,
            margin: _config.margin || {top: 25, right: 20, bottom: 20, left: 35},
            tooltipPadding: _config.tooltipPadding || 15
        }
        this.data = _data;
        this.regions = _regions;
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
        // vis.xScale = d3.scaleTime().range([0, vis.width]).domain([vis.parseDate(2011), vis.parseDate(2020)]);

        vis.xScale = d3.scaleLinear()
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickSize(-vis.height - 10)
            .tickPadding(10);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(6)
            .tickSize(-vis.width - 10)
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

        // Append both axis titles
        vis.chart.append('text')
            .attr('class', 'axis-title')
            .attr('y', vis.height - 15)
            .attr('x', vis.width + 10)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text('Happiness Score');

        vis.yLabel = vis.chart.append('text')
            .attr('class', 'axis-title')
            .attr('x', 0)
            .attr('y', 0)
            .attr('dy', '.71em')
            .text(scatterplot_attribute);

        vis.regression = vis.chart
            .append('path')
            .attr('class', 'reg')
            .attr('stroke', 'black')
            .attr('fill', 'none');
    }

    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
        let vis = this;

        vis.xValue = d => d['Happiness Score'];
        vis.yValue = d => d[scatterplot_attribute];

        vis.yearFilteredData = data.filter(d => (d.year === selectedYear && vis.yValue(d) !== 0));
        vis.filteredRegions = regions.filter(d => d[regionColumn] === selectedRegion);
        vis.filteredRegionIds = vis.filteredRegions.map(d => d['country-code']);
        
        vis.fillColor = d => {
            if (selectedCountries.includes(d.id)) {
                return colors[selectedCountries.indexOf(d.id)];
            } else if (this.filteredRegionIds.includes(d.id)) {
                return '#004488';
            } else {
                return '#000';
            }
        }

        vis.opacity = d => {
            if (selectedCountries.includes(d.id)) {
                return 1;
            }  else if (this.filteredRegionIds.includes(d.id)) {
                return 0.6;
            } else {
                return 0.15;
            }
        }

        // Set the scale input domains
        vis.xScale.domain([0, d3.max(vis.data, vis.xValue)]);
        vis.yScale.domain([d3.min(vis.yearFilteredData, vis.yValue), d3.max(vis.yearFilteredData, vis.yValue)]);

        vis.linearRegression = ss.linearRegression(vis.yearFilteredData.map(d => [vis.xValue(d), vis.yValue(d)]));
        vis.linearRegressionLine = ss.linearRegressionLine(vis.linearRegression);
        vis.regressionPoints = vis.xScale.domain().map(d => {
            return {
                x: d,
                y: vis.linearRegressionLine(d)
            };
        });

        vis.line = d3.line()
            .x(d => vis.xScale(d.x))
            .y(d => vis.yScale(d.y));

        vis.renderVis();
    }

    /**
     * Bind data to visual elements.
     */
    renderVis() {
        let vis = this;

        // Add circles
        vis.chart.selectAll('.point')
            .data(vis.yearFilteredData)
            .join('circle')
            .attr('class', 'point')
            .attr('r', 4)
            .attr('cy', d => vis.yScale(vis.yValue(d)))
            .attr('cx', d => vis.xScale(vis.xValue(d)))
            .attr('fill', d => vis.fillColor(d))
            .attr("opacity", d => vis.opacity(d));

        vis.yLabel.text(scatterplot_attribute);

        vis.regression.datum(vis.regressionPoints).attr('d', vis.line);

        // Update the axes/gridlines
        // We use the second .call() to remove the axis and just show gridlines
        vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.select('.domain').remove());

        vis.yAxisG
            .call(vis.yAxis)
            .call(g => g.select('.domain').remove())
    }
}

class LineChart {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            attribute: _config.attribute,
            containerWidth: _config.containerWidth || 600,
            containerHeight: _config.containerHeight || 400,
            margin: _config.margin || {top: 25, right: 20, bottom: 20, left: 35},
            tooltipPadding: _config.tooltipPadding || 15
        }
        this.data = _data;
        this.paths = [];
        this.points = [];
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
        vis.xScale = d3.scaleTime().range([0, vis.width]).domain([vis.parseDate(2011), vis.parseDate(2020)]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(10)
            .tickSize(-10)
            .tickPadding(10);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(6)
            .tickSize(-10)
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
            .text('Year');

        vis.yLabel = vis.chart.append('text')
            .attr('class', 'axis-title')
            .attr('x', 0)
            .attr('y', 0)
            .attr('dy', '.71em')
            .text(scatterplot_attribute);
    }

    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
        let vis = this;

        vis.xValue = d => vis.parseDate(d['year'])
        vis.yValue = d => d[scatterplot_attribute]

        vis.yearFilteredData = data.filter(d => (vis.yValue(d) !== 0));

        vis.fillColor = d => {
            if (selectedCountries.includes(d.id)) {
                return colors[selectedCountries.indexOf(d.id)];
            } else if (filteredRegionIds.includes(d.id)) {
                return regionColor;
            } else if (myCountry === d.id) {
                return myCountryColor;
            } else {
                return '#000';
            }
        }

        // Set the scale input domains
        vis.yScale.domain([d3.min(vis.yearFilteredData, vis.yValue), d3.max(vis.yearFilteredData, vis.yValue)]);
        vis.renderVis();
    }

    /**
     * Bind data to visual elements.
     */
    renderVis() {
        let vis = this;

        vis.line = d3.line()
            .x(d => vis.xScale(vis.xValue(d)))
            .y(d => vis.yScale(vis.yValue(d)));

        const getOtherCountriesData = (d) => {
            const otherCountries = vis.yearFilteredData
                .filter(f => f.id != d.id && f['year'] == d['year'] && countries.includes(f.id))
                .sort((a, b) => {
                    return vis.yValue(b) - vis.yValue(a)
                })
                .map(z => `<div>
                <b>vs ${z['Country name']}:</b> ${vis.yValue(z)}

                <div class="tooltip-comparison"
                    style="background-color: ${vis.fillColor(z) || '#000'};">
                </div>

                </div>`)
                .join('');
            if (otherCountries != '' && otherCountries) {
                return '<hr>' + otherCountries;
            }

            return '';
        }

        const countries = [...selectedCountries];
        const chartColors = [...colors];

        for (let i = 0; i < countries.length; i++) {
            if (countries[i]) {
                // Paths
                if (vis.paths[i]) {
                    vis.paths[i].remove();
                    vis.points[i].remove();
                }

                const data_selected = vis.yearFilteredData.filter(d => d.id === countries[i]);
                vis.paths[i] = vis.chart.selectAll(`.chart-line-${i}`)
                    .data([data_selected])
                    .join('path')
                    .attr("fill", "none")
                    .attr("stroke", chartColors[i])
                    .attr('class', `.chart-line-${i}`)
                    .attr('d', vis.line)

                vis.points[i] = vis.chart.selectAll(`.point-${i}`)
                    .data(data_selected)
                    .join('circle')
                    .attr('class', `.point-${i}`)
                    .attr('r', 4)
                    .attr('cy', d => vis.yScale(vis.yValue(d)))
                    .attr('cx', d => vis.xScale(vis.xValue(d)))
                    .attr('fill', chartColors[i])
                    .style('cursor', 'pointer')
                    .on('mouseover', function (event, d) {
                        d3.select(this)
                            .attr('stroke-width', '3')
                            .attr('r', 7)
                        d3.select('#tooltip')
                            .style('display', 'block')
                            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                            .html(`
                                <div>
                                    <div style="display: flex">
                                        <div class="tooltip-title">${d['Country name']}</div>
                                        <div style="margin-left: auto; margin-right: 0">${vis.xValue(d).getFullYear()}</div>
                                    </div>

                                    <div class="tooltip-colordiv"
                                        style="background-color: ${vis.fillColor(d) || '#000'};">
                                    </div>

                                    <div>
                                        <b>${scatterplot_attribute}</b>
                                        <i>${vis.yValue(d)}</i>
                                    </div>

                                    ${getOtherCountriesData(d)}
                                </div>
                            `);
                    })
                    .on('mouseleave', function () {
                        d3.select(this)
                            .attr('stroke-width', '0')
                            .attr('r', 4)
                        d3.select('#tooltip').style('display', 'none');
                    });
                    
            } 
            else if (vis.paths[i]) {
                vis.paths[i].remove();
                vis.points[i].remove();

            }
        }

        vis.yLabel.text(scatterplot_attribute);

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

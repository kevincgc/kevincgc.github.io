class RadarPlot {

    constructor(_config, _data, _onPointClickedEventListener, _onbackgroundClickedEventListener) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 550,
            containerHeight: _config.containerHeight || 400,
            margin: _config.margin || {top: 50, right: 100, bottom: 0, left: 100},
            tooltipPadding: _config.tooltipPadding || 3,
            colors: _config.colors
        }

        this.onPointClickedEventListener = _onPointClickedEventListener;
        this.onbackgroundClickedEventListener = _onbackgroundClickedEventListener;
        this.data = _data;
        this.countriesSelected = [];
        this.yearSelected = null;
        this.initVis();
    }

    initVis() {
        let vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.radarRadius = vis.width / 2;

        vis.radialScale = d3.scaleLinear()
            .range([0, vis.radarRadius]);

        vis.circleTicks = [25, 50, 75, 100]; // percentages

        vis.axes = [{
            percentValue: 'Happiness Score pecentile',
            dataValue: 'Happiness Score',
            tooltipLabel: 'Happiness Score',
            radarLabel: 'Happiness Score'
        }, {
            percentValue: 'Log GDP per capita pecentile',
            dataValue: 'Log GDP per capita',
            tooltipLabel: 'Log GDP Per Capita',
            radarLabel: 'GDP per capita'
        }, {
            percentValue: 'Social support pecentile',
            dataValue: 'Social support',
            tooltipLabel: 'Social Support',
            radarLabel: 'Social Support'
        }, {
            percentValue: 'Healthy life expectancy at birth pecentile',
            dataValue: 'Healthy life expectancy at birth',
            tooltipLabel: 'Healthy Life Expectancy',
            radarLabel: 'Life Expectancy'
        }, {
            percentValue: 'Freedom to make life choices pecentile',
            dataValue: 'Freedom to make life choices',
            tooltipLabel: 'Freedom To Make Life Choices',
            radarLabel: 'Freedom'
        }, {
            percentValue: 'Generosity pecentile',
            dataValue: 'Generosity',
            tooltipLabel: 'Generosity',
            radarLabel: 'Generosity'
        }, {
            percentValue: 'Perceptions of corruption pecentile',
            dataValue: 'Perceptions of corruption',
            tooltipLabel: 'Perceptions Of Corruption',
            radarLabel: 'Corruption'
        }];

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .append("svg")
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
        // .on('click', this.onbackgroundClickedEventListener);

        // Append group element that will contain our actual chart 
        // and position it according to the given margin config
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)

        // Append both axis titles
        vis.svg.append('text')
            .attr('class', 'plot-title')
            .attr('y', 25)
            .attr('x', 5)
            .attr('dy', '.71em')
            .text('Regional/National Indicators');

        // Append both axis titles
        vis.svg.append('text')
            .attr('class', 'plot-description')
            .attr('y', 42)
            .attr('x', 5)
            .attr('dy', '.71em')
            .text('Values are represented as percentiles');

    }

    updateVis() {
        let vis = this;

        vis.filteredData = vis.data.filter(d => vis.countriesSelected.includes(d.id) && d['year'] == vis.yearSelected);

        if (vis.selectedRegionPercentiles != {} && vis.selectedRegionPercentiles != undefined && vis.selectedRegionPercentiles != null) {
            vis.filteredData.push(vis.selectedRegionPercentiles);
        }

        vis.percentValue = (d, percentValue) => d[percentValue];
        vis.dataValue = (d, dataValue) => d[dataValue];

        vis.percentageScale = [0, 100];

        // Set the scale input domain
        vis.radialScale.domain(vis.percentageScale);

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        // --------- Circles ---------

        // Add circles
        const circles = vis.chart.selectAll('.radial')
            .data(vis.circleTicks);

        circles.join(enter => enter.append('circle')
            .attr('class', 'radial')
            .attr('cy', vis.height / 2)
            .attr('cx', vis.width / 2)
            .attr('stroke', '#000')
            .attr('fill', 'none')
            .attr('r', d => vis.radialScale(d)));

        // Add ticks to circles
        const circleTicks = vis.chart.selectAll('.circleTick')
            .data(vis.circleTicks);

        circleTicks.join(enter => enter.append('text')
            .attr('class', 'circleTick')
            .attr('x', vis.width / 2)
            .attr('y', d => vis.radarRadius * 1.25 - vis.radialScale(d))
            .attr('dy', '-.45em')
            .attr('dx', '.35em')
            .text(d => `${d}th`));

        // --------- Axes ---------

        // Get last circle tick value, use it for axis length
        // This makes the axis lines go exactly to the outermost circle
        // [Ref-2] Radar Chart d3 - github.com
        const axisLength = vis.radialScale(vis.circleTicks[vis.circleTicks.length - 1]);
        const calculateLineAngle = (i) => (Math.PI * 2 * (i + 1) / vis.axes.length) + (Math.PI / 2);
        const xValue = (i, value) => Math.cos(calculateLineAngle(i)) * value;
        const yValue = (i, value) => Math.sin(calculateLineAngle(i)) * value;


        // Add axes lines
        const axes = vis.chart.selectAll('.circle-axis')
            .data(vis.axes);

        axes.join(enter => enter.append('line')
            .attr('class', 'circle-axis')
            .attr('x1', vis.width / 2)
            .attr('y1', vis.height / 2)
            .attr('x2', (d, i) => xValue(i, axisLength) + (vis.width / 2))
            .attr('y2', (d, i) => yValue(i, axisLength) + (vis.height / 2))
            .attr('stroke', '#000'));


        // Add axes labels
        const axesLabelsOffset = 30;

        const axesLabels = vis.chart.selectAll('.circle-axis-labels')
            .data(vis.axes);

        axesLabels.join(enter => enter.append('text')
            .attr('class', 'circle-axis-labels')
            .attr('x', (d, i) => xValue(i, (axisLength + axesLabelsOffset)) + (vis.width / 2) - 25)
            .attr('y', (d, i) => yValue(i, (axisLength + axesLabelsOffset)) + (vis.height / 2))
            .attr('dx', (d, i) => {
                const cosX = Math.cos(calculateLineAngle(i));
                if (cosX <= 0) {
                    // Left
                    return -40
                } else {
                    // Right
                    return 0;
                }
            })
            .text(d => d.radarLabel));


        // --------- Points ---------

        const createPathForRow = (d) => {
            const pathCoordinates = [];
            for (let i = 0; i < vis.axes.length; i++) {
                const axis = vis.axes[i];
                const value = vis.radialScale(vis.percentValue(d, axis.percentValue));

                const coordinatesOnAxis = {
                    x: xValue(i, value) + (vis.width / 2), y: yValue(i, value) + (vis.height / 2)
                };

                pathCoordinates.push(coordinatesOnAxis);
            }

            // Finish the path from first coordinate to last coordinate
            pathCoordinates.push(pathCoordinates[0])

            return pathCoordinates;
        }


        const getColorFromSelectedCountry = (d) => {
            if (selectedCountries.includes(d.id)) {
                return colors[selectedCountries.indexOf(d.id)];
            } else if (filteredRegionIds.includes(d.id)) {
                return regionColor;
            } else if (myCountry === d.id) {
                return myCountryColor;
            } else {
                return regionColor;
            }
        }

        // Area
        const radarAreas = vis.chart.selectAll('.area')
            .data(vis.filteredData);

        radarAreas.join(enter => enter.append('path')
            .attr('class', 'area')
            .attr('fill', d => getColorFromSelectedCountry(d))
            .datum(d => createPathForRow(d))
            .attr('d', d3.line()
                .x(d => d.x)
                .y(d => d.y))
            .attr('stroke', '#00ff00')
            .attr('opacity', 0.35), update => update
            .attr('fill', d => getColorFromSelectedCountry(d))
            .datum(d => createPathForRow(d))
            .attr('d', d3.line()
                .x(d => d.x)
                .y(d => d.y)));

        const radarAreaOutlines = vis.chart.selectAll('.area-outline')
            .data(vis.filteredData);

        radarAreaOutlines.join(enter => enter.append('path')
            .attr('class', 'area-outline')
            .datum(d => createPathForRow(d))
            .attr('d', d3.line()
                .x(d => d.x)
                .y(d => d.y))
            .attr('fill-opacity', '0')
            .attr('stroke', '#000')
            .attr('stroke-width', '2')
            .attr('z-index', -1), update => update
            .datum(d => createPathForRow(d))
            .attr('d', d3.line()
                .x(d => d.x)
                .y(d => d.y))
            .attr('z-index', -1));

        // Points
        const points = [];
        for (let i = 0; i < vis.filteredData.length; i++) {
            const d = vis.filteredData[i];
            for (const axis of vis.axes) {
                points.push({
                    color: getColorFromSelectedCountry(d),
                    tooltipLabel: axis.tooltipLabel,
                    percentValue: axis.percentValue,
                    radarValue: vis.radialScale(vis.percentValue(d, axis.percentValue)),
                    dataPercent: Math.round(vis.percentValue(d, axis.percentValue) * 100) / 100,
                    dataValue: vis.dataValue(d, axis.dataValue),
                    data: d
                });
            }
        }

        const getOtherCountriesData = (d) => {
            const otherCountries = vis.filteredData
                .filter(f => f.id != d.data.id)
                .sort((a, b) => {
                    return vis.percentValue(b, d.percentValue) - vis.percentValue(a, d.percentValue)
                })
                .map(z => `<div>
                <b>vs ${z['Country name']}:</b> ${Math.round(vis.percentValue(z, d.percentValue) * 100) / 100} Percentile

                <div class="tooltip-comparison"
                style="background-color: ${getColorFromSelectedCountry(z) || '#000'};">
            </div>

                </div>`)
                .join('');
            if (otherCountries != '' && otherCountries) {
                return '<hr>' + otherCountries;
            }

            return '';
        }

        // Update points on radar plot
        vis.chart.selectAll('.point')
            .remove();

        const radarPoints = vis.chart.selectAll('.point')
            .data(points)

        radarPoints.join(enter => enter.append('circle')
                .attr('class', 'point')
                .attr('r', 5)
                .attr('cx', (d, i) => xValue(i, d.radarValue) + (vis.width / 2))
                .attr('cy', (d, i) => yValue(i, d.radarValue) + (vis.height / 2))
                .attr('stroke', 'black')
                .attr('stroke-width', '0')
                .attr('fill', d => d.color)
                .attr('stroke', d => vis.config.colors[d.index])
                .attr('z-index', 99999)
                .on('click', function (event, d) {
                    d3.select(this)
                        .attr('stroke-width', '3');
                    vis.onPointClickedEventListener(event, d.data, d.percentValue);
                })
                .on('mouseover', function (event, d) {
                    d3.select(this)
                        .attr('stroke-width', '3')
                        .attr('r', 7)

                    console.log(event.pageY);
                    console.log(event.pageX);
                    d3.select('#tooltip')
                        .style('display', 'block')
                        .style('left', (event.pageX/0.8 + vis.config.tooltipPadding) + 'px')
                        .style('top', (event.pageY/0.8 + vis.config.tooltipPadding) + 'px')
                        .html(`
                            <div>
                                <div style="display: flex">
                                    <div class="tooltip-title" style="margin-right: 10px">${d.data['Country name']}</div>
                                    <div style="margin-left: auto; margin-right: 0">${vis.yearSelected}</div>
                                </div>

                                <div class="tooltip-colordiv"
                                    style="background-color: ${d.color || '#000'};">
                                </div>

                                <div>
                                    <b>${d.tooltipLabel}</b>
                                    ${d.dataValue != undefined ? `<i>${d.dataValue}</i>` : ''}
                                </div>

                                <div>
                                    <span>${d.dataPercent} Percentile</span>
                                </div>
                                ${getOtherCountriesData(d)}
                             </div>
                        `);
                })
                .on('mouseleave', function () {
                    d3.select(this)
                        .attr('stroke-width', '0')
                        .attr('r', 5)


                    d3.select('#tooltip').style('display', 'none');
                }),

            update => update
                .attr('cx', (d, i) => xValue(i, d.radarValue) + (vis.width / 2))
                .attr('cy', (d, i) => yValue(i, d.radarValue) + (vis.height / 2)));

    }
}

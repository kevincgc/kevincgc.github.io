class RadarPlot {

    constructor(_config, _data, _onPointClickedEventListener, _onbackgroundClickedEventListener) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 500,
            margin: _config.margin || { top: 100, right: 100, bottom: 100, left: 100 },
            tooltipPadding: _config.tooltipPadding || 15,
            colors: _config.colors
        }

        this.onPointClickedEventListener = _onPointClickedEventListener;
        this.onbackgroundClickedEventListener = _onbackgroundClickedEventListener;
        this.data = _data;
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

        vis.axes = [
            {
                // TODO update with Life Ladder percentile
                name: 'Life Ladder',
                label: 'Life Ladder'
            },
            {
                name: 'Log GDP per capita pecentile',
                label: 'GDP Per Capita'
            },
            {
                name: 'Social support pecentile',
                label: 'Social Support'
            },
            {
                name: 'Healthy life expectancy at birth pecentile',
                label: 'Life Expentancy'
            },
            {
                name: 'Freedom to make life choices pecentile',
                label: 'Freedom'
            },
            {
                name: 'Generosity pecentile',
                label: 'Generosity'
            },
            {
                name: 'Perceptions of corruption pecentile',
                label: 'Corruption'
            }
        ];

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
        // .on('click', this.onbackgroundClickedEventListener);

        // Append group element that will contain our actual chart 
        // and position it according to the given margin config
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)

    }

    updateVis(countriesSelected = [], yearSelected = null) {
        let vis = this;

        vis.countriesSelected = countriesSelected;
        vis.yearSelected = yearSelected;

        vis.filteredData = vis.data.filter(d => countriesSelected.includes(d['Country name']) && d['year'] == yearSelected)

        vis.radialValue = (d, name) => d[name];

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

        circles.join(
            enter => enter.append('circle')
                .attr('class', 'radial')
                .attr('cy', vis.height / 2)
                .attr('cx', vis.width / 2)
                .attr('stroke', '#000')
                .attr('fill', 'none')
                .attr('r', d => vis.radialScale(d)));

        // Add ticks to circles
        const circleTicks = vis.chart.selectAll('.circleTick')
            .data(vis.circleTicks);

        circleTicks.join(
            enter => enter.append('text')
                .attr('class', 'circleTick')
                .attr('x', vis.width / 2)
                .attr('y', d => vis.radarRadius - vis.radialScale(d))
                .attr('dy', '-.45em')
                .attr('dx', '.35em')
                .text(d => `${d}%`));

        // --------- Axes ---------

        // Get last circle tick value, use it for axis length
        // This makes the axis lines go exactly to the outermost circle
        const axisLength = vis.radialScale(vis.circleTicks[vis.circleTicks.length - 1]);
        const calculateLineAngle = (i) => (Math.PI * 2 * (i + 1) / vis.axes.length) + (Math.PI / 2);
        const xValue = (i, value) => Math.cos(calculateLineAngle(i)) * value;
        const yValue = (i, value) => Math.sin(calculateLineAngle(i)) * value;


        // Add axes lines
        const axes = vis.chart.selectAll('.circle-axis')
            .data(vis.axes);

        axes.join(
            enter => enter.append('line')
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

        axesLabels.join(
            enter => enter.append('text')
                .attr('class', 'circle-axis-labels')
                .attr('x', (d, i) => xValue(i, (axisLength + axesLabelsOffset)) + (vis.width / 2) - 25)
                .attr('y', (d, i) => yValue(i, (axisLength + axesLabelsOffset)) + (vis.height / 2))
                .attr('dx', (d, i) => {
                    const cosX = Math.cos(calculateLineAngle(i));
                    if (cosX <= 0) {
                        // Left
                        return -40
                    }
                    else {
                        // Right
                        return 0;
                    }
                })
                .text(d => d.label));



        // --------- Points ---------

        const createPathForRow = (d) => {
            const pathCoordinates = [];
            for (let i = 0; i < vis.axes.length; i++) {
                const axis = vis.axes[i];
                const value = vis.radialScale(vis.radialValue(d, axis.name));

                const coordinatesOnAxis = {
                    x: xValue(i, value) + (vis.width / 2),
                    y: yValue(i, value) + (vis.height / 2)
                };

                pathCoordinates.push(coordinatesOnAxis);
            }

            // Finish the path from first coordinate to last coordinate
            pathCoordinates.push(pathCoordinates[0])

            return pathCoordinates;
        }

        // Area
        const radarAreas = vis.chart.selectAll('.area')
            .data(vis.filteredData);

        radarAreas.join(
            enter => enter.append('path')
                .attr('class', 'area')
                .datum(d => createPathForRow(d))
                .attr('d', d3.line()
                    .x(d => d.x)
                    .y(d => d.y))
                .attr('fill', (d, i) => vis.config.colors[i])
                .attr('stroke', '#00ff00')
                .attr('opacity', 0.35),
            update => update
                .datum(d => createPathForRow(d))
                .attr('d', d3.line()
                    .x(d => d.x)
                    .y(d => d.y))
                .attr('fill', (d, i) => vis.config.colors[i])
        );

        const radarAreaOutlines = vis.chart.selectAll('.area-outline')
            .data(vis.filteredData);

        radarAreaOutlines.join(
            enter => enter.append('path')
                .attr('class', 'area-outline')
                .datum(d => createPathForRow(d))
                .attr('d', d3.line()
                    .x(d => d.x)
                    .y(d => d.y))
                .attr('fill-opacity', '0')
                .attr('stroke', '#000')
                .attr('stroke-width', '2')
                .attr('z-index', -1),
            update => update
                .datum(d => createPathForRow(d))
                .attr('d', d3.line()
                    .x(d => d.x)
                    .y(d => d.y))
                .attr('z-index', -1)
        );

        const points = [];
        for (let i = 0; i < vis.filteredData.length; i++) {
            const d = vis.filteredData[i];
            for (const axis of vis.axes) {
                points.push({
                    index: i,
                    label: axis.label,
                    name: axis.name,
                    value: vis.radialScale(vis.radialValue(d, axis.name)),
                    dataPercent: vis.radialValue(d, axis.name),
                    data: d
                });
            }
        }

        const radarPoints = vis.chart.selectAll('.point')
            .data(points);

        radarPoints.join(
            enter => enter.append('circle')
                .attr('class', 'point')
                .attr('r', 5)
                .attr('cx', (d, i) => xValue(i, d.value) + (vis.width / 2))
                .attr('cy', (d, i) => yValue(i, d.value) + (vis.height / 2))
                .attr('stroke', 'black')
                .attr('stroke-width', '0')
                .attr('fill', d => vis.config.colors[d.index])
                .attr('stroke', d => vis.config.colors[d.index])
                .attr('z-index', 99999)

                .on('click', function (event, d) {
                    d3.select(this)
                        .attr('stroke-width', '3')
                    vis.onPointClickedEventListener(event, d.data, d.name);
                })
                .on('mouseover', function (event, d) {
                    d3.select(this)
                        .attr('stroke-width', '3')

                    d3.select('#tooltip')
                        .style('display', 'block')
                        .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                        .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                        .html(`
                          <div class="tooltip-title">${d.label}</div>
                          <div><span>${d.dataPercent}%</span></div>
                        `);
                })
                .on('mouseleave', function () {
                    d3.select(this)
                        .attr('stroke-width', '0')

                    d3.select('#tooltip').style('display', 'none');
                }),

            update => update
                .attr('cx', (d, i) => xValue(i, d.value) + (vis.width / 2))
                .attr('cy', (d, i) => yValue(i, d.value) + (vis.height / 2))
                .attr('fill', d => vis.config.colors[d.index]),
        );

    }
}

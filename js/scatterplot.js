class Scatterplot {
    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            attribute_selected: _config.attribute_selected,
            containerWidth: _config.containerWidth || 900,
            containerHeight: _config.containerHeight || 600,
            margin: _config.margin || { top: 0, right: 0, bottom: 40, left: 55 },
            tooltipPadding: _config.tooltipPadding || 15
        }
        this.data = _data;
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

        // Initialize scales
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(8)
            .tickSize(-vis.height + 10);

        vis.locale = d3.formatLocale({
            minus: "\u002d",
        })

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(8)
            .tickSize(-vis.width - 10)
            .tickFormat(d => vis.locale.format('.2')(d));

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .append("svg")
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Add the brush feature using the d3.brush function
        vis.brush = d3.brush()
            //.extent( [ [0,0], [vis.width,vis.height] ] )
            .on("start", resetBrush)
            .on("brush", updateBrush)
            .on("end", removeBrush);

        function resetBrush() {
            filteredRegionIds = [];
            updateSelection(0);
            updateRegionData();
        }

        function removeBrush() {
            updateSelection(0);
            d3.select(this).call(d3.brush().move, null);
        }

        // Returns true if coords are in the area and false otherwise
        function isBrushed(brush_coords, cx, cy) {
            let x0 = brush_coords[0][0],
                x1 = brush_coords[1][0],
                y0 = brush_coords[0][1],
                y1 = brush_coords[1][1];
            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
        }

        function updateBrush(event) {
            filteredRegionIds = [];
            vis.circles.classed("selected", function(d){
                let brushed = isBrushed(event.selection, vis.xScale(vis.xValue(d)), vis.yScale(vis.yValue(d)));
                if (brushed) {
                    filteredRegionIds.push(d.id);
                }
                updateRegionData();
                return brushed;
            } );
        }

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
            .attr('y', vis.height + 25)
            .attr('x', vis.width/2)
            .attr('dy', '.71em')
            .style('text-anchor', 'middle')
            .text('Happiness Score');

        vis.yLabel = vis.chart.append('text')
            .attr('class', 'axis-title')
            .attr('x', 0)
            .attr('y', 0)
            .attr('dy', '.71em')
            .attr("text-anchor", "middle")
            .attr('transform', `translate(-45,${vis.height/2})rotate(-90)`)
            .text(scatterplot_attribute);

        vis.ci = vis.chart.append("path")
            .attr("fill", "#aaa")
            .attr("stroke", "none")
            .attr("opacity", 0.2);

        vis.regression = vis.chart
            .append('path')
            .attr('class', 'reg')
            .attr('stroke', 'black')
            .attr('fill', 'none');

        vis.chart.call(vis.brush);
    }

    normDev(p) {
        if (p < 0 || p > 1) return false;
        if (p == 0) return -Infinity;
        if (p == 1) return Infinity;

        let a0 = 3.3871328727963666080e+0,
            a1 = 1.3314166789178437745e+2,
            a2 = 1.9715909503065514427e+3,
            a3 = 1.3731693765509461125e+4,
            a4 = 4.5921953931549871457e+4,
            a5 = 6.7265770927008700853e+4,
            a6 = 3.3430575583588128105e+4,
            a7 = 2.5090809287301226727e+3,

            b1 = 4.2313330701600911252e+1,
            b2 = 6.8718700749205790830e+2,
            b3 = 5.3941960214247511077e+3,
            b4 = 2.1213794301586595867e+4,
            b5 = 3.9307895800092710610e+4,
            b6 = 2.8729085735721942674e+4,
            b7 = 5.2264952788528545610e+3,

            c0 = 1.42343711074968357734e+0,
            c1 = 4.63033784615654529590e+0,
            c2 = 5.76949722146069140550e+0,
            c3 = 3.64784832476320460504e+0,
            c4 = 1.27045825245236838258e+0,
            c5 = 2.41780725177450611770e-1,
            c6 = 2.27238449892691845833e-2,
            c7 = 7.74545014278341407640e-4,

            d1 = 2.05319162663775882187e+0,
            d2 = 1.67638483018380384940e+0,
            d3 = 6.89767334985100004550e-1,
            d4 = 1.48103976427480074590e-1,
            d5 = 1.51986665636164571966e-2,
            d6 = 5.47593808499534494600e-4,
            d7 = 1.05075007164441684324e-9,

            e0 = 6.65790464350110377720e+0,
            e1 = 5.46378491116411436990e+0,
            e2 = 1.78482653991729133580e+0,
            e3 = 2.96560571828504891230e-1,
            e4 = 2.65321895265761230930e-2,
            e5 = 1.24266094738807843860e-3,
            e6 = 2.71155556874348757815e-5,
            e7 = 2.01033439929228813265e-7,

            f1 = 5.99832206555887937690e-1,
            f2 = 1.36929880922735805310e-1,
            f3 = 1.48753612908506148525e-2,
            f4 = 7.86869131145613259100e-4,
            f5 = 1.84631831751005468180e-5,
            f6 = 1.42151175831644588870e-7,
            f7 = 2.04426310338993978564e-15;

        let q = p - 0.5, r, z;

        // p close to 0.5
        if (Math.abs(q) <= 0.425) {
            r = 0.180625 - q * q;
            z = q * (((((((a7 * r + a6) * r + a5) * r + a4) * r + a3) * r + a2) * r + a1) * r + a0)
                / (((((((b7 * r + b6) * r + b5) * r + b4) * r + b3) * r + b2) * r + b1) * r + 1);
            return z;
        }

        if (q > 0) r = 1 - p;
        else r = p;
        r = Math.sqrt(-Math.log(r));

        // p neither close to 0.5 nor 0 or 1
        if (r <= 5) {
            r += -1.6;
            z = (((((((c7 * r + c6) * r + c5) * r + c4) * r + c3) * r + c2) * r + c1) * r + c0)
                / (((((((d7 * r + d6) * r + d5) * r + d4) * r + d3) * r + d2) * r + d1) * r + 1);
        }
        // p near 0 or 1
        else {
            r += -5;
            z = (((((((e7 * r + e6) * r + e5) * r + e4) * r + e3) * r + e2) * r + e1) * r + e0)
                / (((((((f7 * r + f6) * r + f5) * r + f4) * r + f3) * r + f2) * r + f1) * r + 1);
        }

        if (q < 0.0) z = -z;
        return z;
    }

    inverseT(p, df) {
        const { sin, cos, sqrt, pow, exp, PI } = Math;
        let a, b, c, d, t, x, y;

        if (df == 1) return cos(p * PI / 2) / sin(p * PI / 2);
        if (df == 2) return sqrt(2 / (p * (2 - p)) - 2);

        a = 1 / (df - 0.5);
        b = 48 / (a * a);
        c = ((20700 * a / b - 98) * a - 16) * a + 96.36;
        d = ((94.5 / (b + c) - 3) / b + 1) * sqrt(a * PI * 0.5) * df;
        x = d * p;
        y = pow(x, 2 / df);

        if (y > 0.05 + a) {
            // The procedure normdev(p) is assumed to return a negative normal
            // deviate at the lower tail probability level p, e.g. -2.32 for p = 0.01.
            x = this.normDev(p / 2);
            y = x * x;
            if (df < 5) c = c + 0.3 * (df - 4.5) * (x + 0.6);
            c = (((0.05 * d * x - 5) * x - 7) * x - 2) * x + b + c;
            y = (((((0.4 * y + 6.3) * y + 36) * y + 94.5) / c - y - 3) / b + 1) * x;
            y = a * y * y;
            if (y > 0.002) y = exp(y) - 1;
            else y = 0.5 * y * y + y;
        } else {
            y = ((1 / (((df + 6) / (df * y) - 0.089 * d - 0.822) * (df + 2) * 3) + 0.5 / (df + 4)) * y - 1) *
                (df + 1) / (df + 2) + 1 / y;
        }

        return sqrt(df * y);
    }

    linearReg(data, x) {
        let n = data.length, sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < data.length; ++i) {
            const xi = data[i].x;
            const yi = data[i].y;
            if (!Number.isFinite(xi) || !Number.isFinite(yi)) { --n; continue; }
            sumX += xi;
            sumY += yi;
            sumXY += xi * yi;
            sumX2 += xi * xi;
        }
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        return slope * x + intercept;
    }

    confidenceInterval(data, x) {
        const mean = d3.sum(data, d => d.x) / data.length;
        let a = 0, b = 0;
        for (let i = 0; i < data.length; ++i) {
            a += Math.pow(data[i].x - mean, 2);
            b += Math.pow(data[i].y - this.linearReg(data, data[i].x), 2);
        }
        const sy = Math.sqrt(b / (data.length - 2));
        const t = this.inverseT(+confidenceLevel, data.length - 2)
        const Y = this.linearReg(data, x);
        const se = sy * Math.sqrt(1 / data.length + Math.pow(x - mean, 2) / a);
        return { x, left: Y - t * se, right: Y + t * se };
    }

    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
        let vis = this;

        vis.xValue = d => d['Happiness Score'];
        vis.yValue = d => d[scatterplot_attribute];

        vis.yearFilteredData = data.filter(d => (d.year === selectedYear && vis.yValue(d) !== 0));

        vis.fillColor = d => {
            if (filteredRegionIds.includes(d.id)) {
                return '#004488';
            } else if (d.id === myCountry) {
                return '#999'
            } else {
                return '#000';
            }
        }

        vis.opacity = d => {
            if (d.id === myCountry) {
                return 1
            } else if (filteredRegionIds.includes(d.id)) {
                return 0.8;
            } else {
                return 0.15;
            }
        }

        // Set the scale input domains
        vis.xScale.domain([d3.min(vis.data, vis.xValue) - 0.6, d3.max(vis.data, vis.xValue) + 0.6]);
        vis.yScale.domain([d3.min(vis.yearFilteredData, vis.yValue) - Math.abs(d3.max(vis.yearFilteredData, vis.yValue) * 0.06),
            d3.max(vis.yearFilteredData, vis.yValue) + d3.max(vis.yearFilteredData, vis.yValue) * 0.06]);

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

        vis.yearAttributeFilteredData = vis.yearFilteredData.map(d => ({
            name: d['Country name'], x: vis.xValue(d), y: vis.yValue(d)
        }));
        vis.intervalData = () => {
            const domain = vis.xScale.domain();
            const step = (domain[1] - domain[0]) / 100;
            return d3.range(domain[0], domain[1] + step, step)
                .map(d => vis.confidenceInterval(vis.yearAttributeFilteredData, d));
        };

        vis.renderVis();
    }


    /**
     * Bind data to visual elements.
     */
    renderVis() {
        let vis = this;

        let normalR = 6, myR = 8, normalRHover = 8, myRHover = 10;
        // Add circles
        vis.circles = vis.chart.selectAll('.point')
            .data(vis.yearFilteredData)
            .join('circle')
            .attr('class', 'point')
            .attr('r', d => d.id === myCountry ? myR : normalR)
            .attr('cy', d => vis.yScale(vis.yValue(d)))
            .attr('cx', d => vis.xScale(vis.xValue(d)))
            .attr('fill', d => vis.fillColor(d))
            .attr('opacity', d => vis.opacity(d))
            .attr('stroke', d => d.id === myCountry ? myCountryColor : "transparent")
            .attr('stroke-width', 4)
            .attr('stroke-opacity', 1)
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
                if (d.id !== myCountry) {
                    d3.select(this)
                        .attr('r', normalRHover);
                } else {
                    d3.select(this)
                        .attr('r', myRHover);
                }
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                    .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                    .html(`
                        <div>
                            <div style="display: flex">
                                <div class="tooltip-title">${d['Country name']}</div>
                                <div style="margin-left: auto; margin-right: 0">${selectedYear}</div>
                            </div>

                            <div class="tooltip-colordiv"
                                style="background-color: ${ d.id === myCountry ? myCountryColor :vis.fillColor(d)}; 
                                opacity: ${vis.fillColor(d) === "#000" ? 0.15 : 1};">
                                
                            </div>
                        
                            <div>
                                <b>${scatterplot_attribute}</b>
                                <i>${vis.yValue(d)}</i>
                            </div>
                        
                            <div>
                                <b>Happiness Score</b>
                                <i>${vis.xValue(d)}</i>
                            </div>
                        </div>
                    `);
            })
            .on('mouseleave', function (event, d) {
                if (d.id !== myCountry) {
                    d3.select(this)
                        .attr('r', normalR);
                } else {
                    d3.select(this)
                        .attr('r', myR);
                }

                d3.select('#tooltip').style('display', 'none');
            })
            .on("mousedown", function(event,d) { event.stopPropagation(); })
            .on("mouseup", function(event,d) {
                event.stopPropagation();
                updateSelection(d.id);
            });

        vis.yLabel.text(scatterplot_attribute);

        vis.regression.datum(vis.regressionPoints).attr('d', vis.line);

        vis.ci.datum(vis.intervalData())
            .attr("d", d3.area()
                .x(function (d) { return vis.xScale(d.x) })
                .y0(function (d) { return vis.yScale(d.left) })
                .y1(function (d) { return vis.yScale(d.right) })
            );

        // Update the axes/gridlines
        // We use the second .call() to remove the axis and just show gridlines
        vis.xAxisG
            .call(vis.xAxis);

        vis.yAxisG
            .call(vis.yAxis);
    }
}

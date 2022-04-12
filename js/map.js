class GeoMap {
    pathGenerator;

    /**
     * Class constructor with basic configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _geojson) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 700,
            containerHeight: _config.containerHeight || 350,
            margin: _config.margin || {top: 0, right: 0, bottom: 0, left: 0},
            tooltipPadding: 10,
            legendBottom: 15,
            legendLeft: 300,
            legendRectHeight: 12,
            legendRectWidth: 150
        };
        this.data = _data;
        this.geojson = _geojson;
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

        // Define size of SVG drawing area
        vis.svg = d3
            .select(vis.config.parentElement)
            .append("svg")
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight)
            .attr("style", "outline: thin solid black;");

        //vis.svg1 = d3.select('svg');

        // Initialize projection and background
        vis.projection = d3.geoNaturalEarth1();
        vis.background = vis.svg.append("g");
        vis.background.append('path')
            .attr('class', 'background')
            .attr('fill', '#ffffff')
            .attr('transform', `translate(-200, -40)`);

        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.chart = vis.svg
            .append("g")
            .attr('transform', `translate(-140, -60)`);

        vis.map = vis.chart.append("g");

        // Scales
        vis.colorScale = d3.scaleLinear()
            .range(['#FFF7F3', '#FF1812'])
            .interpolate(d3.interpolateHcl);

        vis.xScale = d3.scaleLinear()
            .range([0, vis.config.legendRectWidth])

        vis.xAxis = d3.axisBottom(vis.xScale)
            .tickSize(vis.config.legendRectHeight)
            .ticks(5);

        vis.xAxisG = vis.svg.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(${(vis.width / 2) - (vis.config.legendRectWidth / 2)},${vis.config.legendBottom})`);

        vis.legendLabel = vis.svg.append('text')
            .attr('class', 'map-legend-title')
            .style('text-align', 'center')
            .attr('x', (vis.width / 2) - (vis.config.legendRectWidth / 2) + 20)
            .attr('y', 0)
            .attr('dy', '.71em')
            .text('Happiness Score');

        vis.legendDefs = vis.svg.append('defs');

        vis.selectedCountriesArea = vis.svg.append('g')
            .attr('transform', `translate(0,${vis.height - 90})`);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        let myCountryObj = regions.find(e => e["country-code"] === myCountry);
        vis.selectedCountriesData = [{'Country name': myCountryObj ? myCountryObj.name : "", 'id': myCountry}];

        if (vis.selectedRegionPercentiles != {} && vis.selectedRegionPercentiles != undefined && vis.selectedRegionPercentiles != null) {
            vis.selectedCountriesData.push(vis.selectedRegionPercentiles);
        }

        vis.projection = d3.geoNaturalEarth1().scale(110);

        vis.geoPath = d3.geoPath().projection(vis.projection);
        vis.pathGenerator = d3.geoPath().projection(vis.projection);
        vis.filteredData = vis.data.filter(d => d.year === selectedYear);
        vis.happinessValue = d => d["Happiness Score"];
        vis.extent = d3.extent(vis.filteredData, vis.happinessValue);
        vis.colorScale.domain(vis.extent);
        vis.features = topojson.feature(vis.geojson, vis.geojson.objects.countries).features;
        vis.centroids = vis.features.map(function (feature) {
            return [feature.id, vis.geoPath.centroid(feature)];
        });

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

        vis.legendTicks = [];
        for (let i = 0; i < Math.ceil(vis.extent[1]); i++) {
            vis.legendTicks.push({
                color: vis.colorScale(i), value: i
            });
        }

        vis.xScale.domain(vis.extent)

        vis.renderVis();
    }

    renderLegend() {
        let vis = this;

        // Draw selected countries
        const evenLegendX = 25;
        const oddLegendX = 200;
        const legendYMultiplier = 10;
        const legendTextXOffset = 15;
        const legendTextYOffset = 4;

        vis.fillLegendColor = d => {
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

        vis.selectedCountriesArea.selectAll('.selected-country')
            .data(vis.selectedCountriesData)
            .join("circle")
            .attr('class', 'selected-country')
            .attr("cx", (_, i) => {
                // Even legend items
                if (i % 2 == 0) return evenLegendX;
                // Odd legend items
                else return oddLegendX;
            })
            .attr("cy", 75)
            .attr("r", 6)
            .attr('fill-opacity', '1')
            .attr('stroke', '#333')
            .attr('stroke-width', '0.3')
            .attr("fill", d => vis.fillLegendColor(d))

        vis.selectedCountriesArea.selectAll(".select-country-text")
            .data(vis.selectedCountriesData)
            .join('text')
            .attr('text-anchor', 'left')
            .attr('class', 'select-country-text')
            .attr('dx', (_, i) => {
                // Even legend items
                if (i % 2 == 0) return evenLegendX + legendTextXOffset;
                // Odd legend items
                else return oddLegendX + legendTextXOffset;
            })
            // .attr("dy", (_, i) => {
            //     // Even legend items
            //     if (i % 2 == 0) return ((i + 1) * legendYMultiplier) + legendTextYOffset;
            //     // Odd legend items
            //     else return (i * legendYMultiplier) + legendTextYOffset;
            // })
            .attr("dy", 80)
            .text(d => d['Country name'])
    }

    renderVis() {
        let vis = this;

        // Convert compressed TopoJSON to GeoJSON format
        const countries = topojson.feature(vis.geojson, vis.geojson.objects.countries);

        // Draw legend
        const legend = vis.legendDefs.append('linearGradient').attr('id', 'legendGradient');

        // [Ref-1] Gradient Legend - bl.ocks.org
        legend.selectAll('stop')
            .data(vis.legendTicks)
            .enter().append('stop')
            .attr('offset', d => ((d.value - vis.extent[0]) / (vis.extent[1] - vis.extent[0]) * 100) + '%')
            .attr('stop-color', d => d.color);

        vis.xAxisG.append('rect')
            .attr('width', vis.config.legendRectWidth)
            .attr('height', vis.config.legendRectHeight)
            .style('fill', 'url(#legendGradient)');

        vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.selectAll('.tick text')
                .attr('font-size', '0.8rem'));

        // Render selected countires
        vis.renderLegend();

        // Defines the scale of the projection so that the geometry fits within the SVG area
        //vis.projection.fitSize([vis.width, vis.height], countries);
        d3.selectAll(".background")
            .attr("d", vis.pathGenerator({type: 'Sphere'}));

        // Append world map
        vis.countryPath = vis.map
            .selectAll(".country")
            .data(countries.features)
            .join("path")
            .attr("class", "country")
            .attr("d", vis.geoPath)
            .style('cursor', 'pointer')
            .attr("fill", (d) => {
                let country = vis.filteredData.filter(e => e.id === d.id);
                if (country.length > 0) {
                    return vis.colorScale(country[0]["Happiness Score"]);
                } else if (validCountries.includes(d.id)) {
                    return "#333";
                } else {
                    return "#999";
                }
            })
            .attr("stroke", d => {
                if (filteredRegionIds.includes(d.id)) {
                    return "#004488";
                } else {
                    return "#000000";
                }
            })
            .attr("stroke-width", d => {
                if (filteredRegionIds.includes(d.id)) {
                    return 2;
                } else {
                    return 0;
                }
            });

        vis.countryPath
            .style('cursor', 'pointer')
            .on("mouseover", (event, d) => {
                let country = vis.filteredData.filter(e => e.id === d.id);
                let countryData = regions.find(e => e["country-code"] === d.id);
                if (!countryData) {
                    countryData = {name: "Somalia"};
                }
                d3
                    .select("#tooltip")
                    .style("display", "block")
                    .style("left", event.pageX/0.8 + vis.config.tooltipPadding + "px")
                    .style("top", event.pageY/0.8 + vis.config.tooltipPadding + "px").html(`

                <div style="display: flex">
                <div class="tooltip-title">${countryData.name}</div>
                <div style="margin-left: auto; margin-right: 0">${selectedYear}</div>
                </div>
          <hr>
                      <div class="tooltip-colordiv" id="tooltip-colordiv"
                style="background-color: ${vis.fillColor(d) || '#000'}; opacity: ${vis.fillColor(d) === "#000" ? 0.15 : 1};">
            </div>

              <div>Happiness Score: <strong>${country.length > 0 ? country[0]["Happiness Score"] : (validCountries.includes(d.id) ? "Missing Data for " + selectedYear : "No Data Available")}</strong></div>
            `);
            })
            .on("mouseleave", () => {
                d3.select("#tooltip").style("display", "none");
            })
            .on('click', function (event, d) {
                if (validCountries.includes(d.id) && d.id != myCountry) {
                    updateSelection(d.id);
                }
            });

        vis.country = myCountry === null ? [] : [myCountry];
        vis.marker = vis.map.selectAll(".marker")
            .data(vis.country)
            .join("path")
            .attr("class", "marker")
            .attr("d", "M0,0l-8.8-17.7C-12.1-24.3-7.4-32,0-32h0c7.4,0,12.1,7.7,8.8,14.3L0,0z")
            .attr("transform", d => {
                let countryCentroid = vis.centroids.find(e => e[0] === d);
                return "translate(" + countryCentroid[1][0] + "," + countryCentroid[1][1] + ") scale(0.55)";
            })
            .on('click', function (event, d) {
                document.getElementById('title').scrollIntoView({
                    behavior: 'smooth'
                })
            });

        vis.zoom = d3.zoom().on('zoom', (e) => {
            vis.map.attr('transform', e.transform);
        });
        vis.svg.call(vis.zoom);
    }

    resetZoom() {
        let vis = this;

        vis.svg.transition()
            .duration(750)
            .call(vis.zoom.transform, d3.zoomIdentity);
    }
}

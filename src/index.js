'use strict';
var d3 = require('d3');
var MultiaxisZoom = require('d3-multiaxis-zoom');
var _ = require('lodash');
var utils = require('lightning-client-utils');
var LightningVisualization = require('lightning-visualization');
var fs = require('fs');
var css = fs.readFileSync(__dirname + '/style.css');

var Visualization = LightningVisualization.extend({

    init: function() {
        MultiaxisZoom(d3);
        this.margin = {top: 0, right: 0, bottom: 20, left: 45};
        if(_.has(this.data, 'xaxis')) {
            this.margin.bottom = 57;
        }
        if(_.has(this.data, 'yaxis')) {
            this.margin.left = 70;
        }
        this.render();
    },

    css: css,

    render: function() {

        var data = this.data;
        var height = this.height;
        var width = this.width;
        var margin = this.margin;
        var selector = this.selector;
        var self = this;

        var series = data.series;

        function setSize() {
            self.size = Math.max(Math.exp(2 - 0.003 * self.series[0].d.length), 1);
        }
        
        setSize();

        var nestedExtent = function(data, map) {
            var max = d3.max(data, function(arr) {
                return d3.max(_.map(arr, map));
            });
            var min = d3.min(data, function(arr) {
                return d3.min(_.map(arr, map));
            });

            return [min, max];
        };

        function setAxis() {
        
            var yDomain = nestedExtent(self.series.map(function(d) {return d.d}), function(d) {
                return d.y;
            });
            var xDomain = nestedExtent(self.series.map(function(d) {return d.d}), function(d) {
                return d.x;
            });

            var ySpread = Math.abs(yDomain[1] - yDomain[0]) || 1;
            var xSpread = Math.abs(xDomain[1] - xDomain[0]) || 1;

            self.x = d3.scale.linear()
                .domain([xDomain[0] - 0.05 * xSpread, xDomain[1] + 0.05 * xSpread])
                .range([0, width - margin.left - margin.right]);

            self.y = d3.scale.linear()
                .domain([yDomain[0] - 0.1 * ySpread, yDomain[1] + 0.1 * ySpread])
                .range([height - margin.top - margin.bottom, 0]);

            self.xAxis = d3.svg.axis()
                .scale(self.x)
                .orient('bottom')
                .ticks(5);

            self.yAxis = d3.svg.axis()
                .scale(self.y)
                .orient('left')
                .ticks(5);

            self.zoom = d3.behavior.zoom()
                .x(self.x)
                .y(self.y)
                .on('zoom', zoomed);

        }

        setAxis();

        this.line = d3.svg.line()
            .x(function (d) {
                return self.x(d.x);
            })
            .y(function (d) {
                return self.y(d.y);
            });

        var container = d3.select(selector)
            .append('div')
            .style('width', width + "px")
            .style('height', height + "px");

        var canvas = container
            .append('canvas')
            .attr('class', 'line-plot canvas')
            .attr('width', width - margin.left - margin.right)
            .attr('height', height - margin.top - margin.bottom)
            .style('margin-left', margin.left + 'px')
            .style('margin-right', margin.right + 'px')
            .style('margin-top', margin.top + 'px')
            .style('margin-bottom', margin.bottom + 'px')
            .call(self.zoom);

        var ctx = canvas
            .node().getContext("2d");

        var svg = container
            .append('svg:svg')
            .attr('class', 'line-plot svg')
            .attr('width', width)
            .attr('height', height)
            .append('svg:g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            .call(self.zoom);

        svg.append('rect')
            .attr('width', width - margin.left - margin.right)
            .attr('height', height - margin.top - margin.bottom)
            .attr('class', 'line-plot rect');

        var makeXAxis = function () {
            return d3.svg.axis()
                .scale(self.x)
                .orient('bottom')
                .ticks(5);
        };

        var makeYAxis = function () {
            return d3.svg.axis()
                .scale(self.y)
                .orient('left')
                .ticks(5);
        };

        svg.append('svg:g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0, ' + (height - margin.top - margin.bottom) + ')')
            .call(this.xAxis);

        svg.append('g')
            .attr('class', 'y axis')
            .call(this.yAxis);

        svg.append('g')
            .attr('class', 'x grid')
            .attr('transform', 'translate(0,' + (height - margin.top - margin.bottom) + ')')
            .call(makeXAxis()
                    .tickSize(-(height - margin.top - margin.bottom), 0, 0)
                    .tickFormat(''));

        svg.append('g')
            .attr('class', 'y grid')
            .call(makeYAxis()
                    .tickSize(-(width - margin.left - margin.right), 0, 0)
                    .tickFormat(''));

        var txt;
        if(_.has(this.data, 'xaxis')) {
            txt = this.data.xaxis;
            if(_.isArray(txt)) {
                txt = txt[0];
            }
            svg.append("text")
                .attr("class", "x label")
                .attr("text-anchor", "middle")
                .attr("x", (width - margin.left - margin.right) / 2)
                .attr("y", height - margin.top)
                .text(txt);
        }
        if(_.has(this.data, 'yaxis')) {
            txt = this.data.yaxis;
            if(_.isArray(txt)) {
                txt = txt[0];
            }

            svg.append("text")
                .attr("class", "y label")
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
                .attr("x", - (height - margin.top - margin.bottom) / 2)
                .attr("y", -margin.left + 20)
                .text(txt);
        }

        function updateAxis() {

            svg.select('.x.axis').call(self.xAxis);
            svg.select('.y.axis').call(self.yAxis);
            svg.select('.x.grid')
                .call(makeXAxis()
                    .tickSize(-(height - margin.top - margin.bottom), 0, 0)
                    .tickFormat(''));
            svg.select('.y.grid')
                .call(makeYAxis()
                        .tickSize(-(width - margin.left - margin.right), 0, 0)
                        .tickFormat(''));
        }

        function zoomed() {
            redraw();
            updateAxis();
        }

        function redraw() {
            ctx.clearRect(0, 0, width - margin.left - margin.right, height - margin.top - margin.bottom);
            draw()
        }

        function draw() {

            ctx.globalAlpha = 0.9;

            _.forEach(self.series, function(s) {
                var t = s.d.length, d, i = 0;
                ctx.strokeStyle = s.c ? s.c : self.defaultSize;
                ctx.lineWidth = s.s ? s.s : self.defaultSize;
                ctx.lineJoin = 'round';
                ctx.beginPath();
                ctx.moveTo(self.x(s.d[0].x), self.y(s.d[0].y))
                while(++i < t) {
                    ctx.lineTo(self.x(s.d[i].x), self.y(s.d[i].y));
                }
                ctx.stroke()
            })

        }

        draw();

        this.svg = svg;
        this.canvas = canvas;
        this.zoomed = zoomed;
        this.updateAxis = updateAxis;
        this.setAxis = setAxis;
        this.setDefaultSize = setDefaultSize;
        this.series = series;
        this.redraw = redraw;

    },

    formatData: function(data) {

        // parse the array data
        if(_.isArray(data.series[0])) {
            // handle case of mutliple series
            data.series = _.map(data.series, function(d) {
                return _.map(d, function(datum, i) {
                    return {
                        x: data.index ? data.index[i] : i,
                        y: datum
                    };
                });
            });
        } else {
            // handle a single series
            data.series = [_.map(data.series, function(d, i) {
                return {
                    x: data.index ? data.index[i] : i,
                    y: d
                };
            })];
        }

        // parse colors and sizes, and automatically fill colors
        // with our random colors if none provided
        var retColor = utils.getColorFromData(data);
        if (retColor.length == 0) {
            retColor = utils.getColors(data.series.length)
        }
        var retSize = data.size || [];

        // embed properties in data array
        data.series = data.series.map(function(line, i) {
            var d = {'d': line, 'i': i};
            d.c = retColor.length > 1 ? retColor[i] : retColor[0];
            d.s = retSize.length > 1 ? retSize[i] : retSize[0];
            return d
        });

        return data;
    },

    updateData: function(formattedData) {
        this.data = formattedData;
        this.redraw();
    },

    appendData: function(formattedData) {
        this.data.series = this.data.series.concat(formattedData.series);
        this.redraw();
    }

});


module.exports = Visualization;

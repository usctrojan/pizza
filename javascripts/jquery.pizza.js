;(function ($, window, document, undefined) {
  'use strict';

  var Pizza = {
    name : 'graphs',

    version : '1.0.0',

    settings : {

    },

    init : function (scope, method, options) {
      this.scope = scope || this.scope;

      if (typeof method === 'object') {
        $.extend(true, this.settings, method);
      }

      this.build($('[data-pie-id]'));

      if (typeof method !== 'string') {
        this.events();
      } else {
        return this[method].call(this, options);
      }
    },

    events : function () {
      var self = this;

      $(window).off('.graphs').on('resize.graphs', self.throttle(function () {
        self.build($('[data-pie-id]'));
      }, 100));

      $(document).off('.graphs').on('mouseenter.graphs mouseleave.graphs', '[data-pie-id] li', function (e) {
        var path = Snap($('path[data-id="s' + $(this).index() + '"]')[0]),
            text = Snap($(path.node).parent()
              .find('text[data-id="' + path.node.getAttribute('data-id') + '"]')[0]);

        if (/enter/i.test(e.type)) {
          path.animate({
            transform: 's1.05 1.05 ' + path.node.getAttribute('data-cx') + ' ' + path.node.getAttribute('data-cy')
          }, 500, mina.elastic);
          text.animate({
            opacity: 1
          }, 500);
        } else {
          path.animate({
            transform: ''
          }, 500, mina.elastic);
          text.animate({
            opacity: 0
          }, 500);
        }
      });
    },

    build : function(legends) {
      var self = this;

      legends.each(function () {
        var legend = $(this), graph;
        self.data(legend);

        if (legend.data('bar-id')) {
          return self.update_DOM(self.bar(legend));
        }

        return self.update_DOM(self.pie(legend));
      });
    },

    data : function (legend) {
      var data = [],
          count = 0;

      $('li', legend).each(function () {
        var segment = $(this);

        data.push({
          value: segment.data('value'), 
          color: segment.css('color'),
          segment: segment
        });
      });

      return legend.data('graph-data', data);
    },

    update_DOM : function (parts) {
      var legend = parts[0],
          graph = parts[1];

      return $(this.identifier(legend)).html(graph);
    },

    pie : function (legend) {
      // pie chart concept from JavaScript the 
      // Definitive Guide 6th edition by David Flanagan
      var svg = this.svg(legend),
          data = legend.data('graph-data'),
          total = 0,
          angles = [],
          start_angle = 0,
          base = $(this.identifier(legend)).width() - 4;

      $('path, text', svg.node).remove();

      for (var i = 0; i < data.length; i++) {
        total += data[i].value;
      }

      for (var i = 0; i < data.length; i++) {
        angles[i] = data[i].value / total * Math.PI * 2;
      }

      for (var i = 0; i < data.length; i++) {
        var end_angle = start_angle + angles[i];
        var cx = (base / 2),
            cy = (base / 2),
            r = ((base / 2) * 0.85);

        // Compute the two points where our wedge intersects the circle
        // These formulas are chosen so that an angle of 0 is at 12 o'clock
        // and positive angles increase clockwise
        var x1 = cx + r * Math.sin(start_angle);
        var y1 = cy - r * Math.cos(start_angle);
        var x2 = cx + r * Math.sin(end_angle);
        var y2 = cy - r * Math.cos(end_angle);

        // This is a flag for angles larger than than a half circle
        // It is required by the SVG arc drawing component
        var big = 0;
        if (end_angle - start_angle > Math.PI) big = 1;

        // This string holds the path details
        var d = "M" + cx + "," + cy +  // Start at circle center
            " L" + x1 + "," + y1 +     // Draw line to (x1,y1)
            " A" + r + "," + r +       // Draw an arc of radius r
            " 0 " + big + " 1 " +      // Arc details...
            x2 + "," + y2 +            // Arc goes to to (x2,y2)
            " Z";                      // Close path back to (cx,cy)

        var path = svg.path();
        var percent = (data[i].value / total) * 100.0;

        // thanks to Raphael.js
        var text = path.paper.text(cx + (r + 40) * Math.sin(start_angle + (angles[i] / 2)),
         cy - (r + 40) * Math.cos(start_angle + (angles[i] / 2)), Math.ceil(percent) + '%');

        var left_offset = text.getBBox().width / 2;

        text.attr({
          x: text.attr('x') - left_offset,
          opacity: 0
        });

        text.node.setAttribute('data-id', 's' + i);

        path.attr({
          d: d,
          fill: data[i].color,
          stroke: '#333'
        });

        path.node.setAttribute('data-id', 's' + i);
        path.node.setAttribute('data-cx', cx);
        path.node.setAttribute('data-cy', cy);
        path.node.setAttribute('data-percent', percent);

        window.path = path.node;

        this.animate(path, cx, cy);

        // The next wedge begins where this one ends
        start_angle = end_angle;
      }

      return [legend, svg.node];
    },

    animate : function (el, cx, cy) {
      el.hover(function (e) {
        var path = Snap(e.target),
            text = Snap($(path.node).parent()
              .find('text[data-id="' + path.node.getAttribute('data-id') + '"]')[0]);

        path.animate({
          transform: 's1.05 1.05 ' + cx + ' ' + cy
        }, 500, mina.elastic);
        text.animate({
          opacity: 1
        }, 500);
      }, function (e) {
        var path = Snap(e.target),
            text = Snap($(path.node).parent()
              .find('text[data-id="' + path.node.getAttribute('data-id') + '"]')[0]);

        path.animate({
          transform: ''
        }, 500, mina.elastic);
        text.animate({
          opacity: 0
        }, 500);
      });
    },

    svg : function (legend) {
      var container = $(this.identifier(legend)),
          svg = $('svg', container),
          width = container.width(),
          height = this.get_height(container);

      if (svg.length > 0) {
        return Snap(svg[0]);
      }

      return Snap(width, height);
    },

    get_height : function (el) {
      var height = el.height(),
          width = el.width();

      if (height < 1) {
        return height = width; 
      }

      return height;
    },

    identifier : function (legend) {
      if (legend.data('pie-id')) {
        return '#' + legend.data('pie-id');
      }
      
      return '#' + legend.data('bar-id');
    },

    reflow : function () {
      this.build($('[data-pie-id]'));
    },

    throttle : function(fun, delay) {
      var timer = null;
      return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
          fun.apply(context, args);
        }, delay);
      };
    }
  };

  window.Pizza = Pizza;

}($, this, this.document));
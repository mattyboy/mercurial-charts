// semicolon protects script integrity (when mixed with incomplete objects, arrays, etc)
;(function($){
	$.mercurialCharts = function(options) {

    // reference to plugin
    var plugin = this; 

    // populated by init
    plugin.settings = {};
    plugin.json     = {};

    var defaults = {
			'gravatar'         : 'http://www.gravatar.com/avatar/',
      'profile_selector' : '#profile-template',
      'zoom_selector'    : '#zoom-control',
			'json_path'        : '/json',
			'chart_colours'    : ["#1D7373","#86B32D","#9A2768"],
			'chart_height'     : '250px',
			'chart_width'      : 'col-md-6',
      'chart_class'      : 'mercurial-chart',
      'series_types'     : ['commits','additions','deletions']
    };

    // highcharts highstock chart defaults
    var chart_defaults = {
      chart: { type: "areaspline" },
      rangeSelector: { enabled: false },
      navigator: { enabled: false },
      scrollbar: { enabled: false }, 
      zoomType: 'x',
      xAxis: {  
        dateTimeLabelFormats: { month: '%b \'%y', year: '%Y' },
        max: new Date().getTime(),
        minTickInterval: 14 * 24 * 3600 * 1000, // fortnight
        minRange: 7 * 24 * 3600 * 1000, // week
        range: 3 * 30 * 24 * 3600 * 1000, // 3 months
        ordinal: false    
      },
      tooltip: { headerFormat: '',
        pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y}</b> commits<br/>'
      },
      plotOptions: {
        series: { 
          lineWidth: 1,
          dataGrouping: { approximation: "sum", forced: true }, 
          states: { hover: { enabled: false, lineWidth: 1 } }
        }
      }
    };

    // commit chart defaults
    var chart_commits = {
      yAxis: { tickInterval: 5, min: 0, max: 20},
      tooltip: { pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y}</b> commits<br/>' }
		};

    // diff chart defaults
    var chart_diffs = {
      yAxis: { tickInterval: 1000, min: -3000, max: 3000},
      tooltip: { pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y}</b> lines<br/>' }
		};

		// plugin initialise method
    var init = function() {
			plugin.settings = $.extend({}, defaults, options);
      loadContribData();
      registerEvents();
		};

    // add commas to numbers
		var formatNumber = function(value) {
			return String(value).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"); 
		};

    // Clones defined html for highcharts title (if no element returns text only)
    var cloneProfile = function(profile) {
      var template = $(plugin.settings.profile_selector);
      if(profile.length != 5) return $('<div/>').text('invalid profile array');
      if(template.length == 0) {
        return $('<div/>').text(profile[0] + ' ' + profile[2] + ' commits ' + profile[3] + '/' + profile[4]);
      }
      template.find(".title").text(profile[0]);
      template.find(".gravatar").attr('src', plugin.settings.gravatar + profile[1]);
      template.find(".commits").text(formatNumber(profile[2]));
      template.find(".plus").text(formatNumber(profile[3]));
      template.find(".minus").text(formatNumber(profile[4]));
      return template; 
    };

    var createChartDiv = function(profile) {
      var chart_div = $('<div/>')
        .attr('hg-commits', profile[2])
        .css('height',plugin.settings.chart_height)
        .addClass(plugin.settings.chart_class);
      return chart_div;
    };

    var createCommitChart = function(json, profile, key) {
      var chart_title = cloneProfile(profile);
      var chart_div = createChartDiv(profile);
      var chart_options = $.extend({}, chart_defaults, chart_commits, { 
        'title'  : { 'text': chart_title.html(), useHTML: true },
        'series' : [{color: plugin.settings.chart_colours[0], name: json.contrib, data: json.data}]
      });

      // todo: fix this should be using plugin settings for divs and classes
      if(key == "all_contributions") {
        $('#commit-total').append(chart_div.addClass('col-md-12'));
        chart_options.series[0].color = plugin.settings.chart_colours[1];
        chart_options.yAxis.max = 25;
      } else {
        $('#commit-charts').append(chart_div.addClass(plugin.settings.chart_width));
      }

      chart_div.highcharts('StockChart', chart_options);
    };

    var createDiffChart = function(profile, key) {
      var series = plugin.json[key];
      var chart_title = cloneProfile(profile);
      var chart_div = createChartDiv(profile);
      var chart_options = $.extend({}, chart_defaults, chart_diffs, { 
        'title'  : { 'text': chart_title.html(), useHTML: true },
        'series' : [
          {color: plugin.settings.chart_colours[1], name: series[0].type, data: series[0].data},
          {color: plugin.settings.chart_colours[2], name: series[1].type, data: series[1].data}
         ]
      });

      // todo: fix this should be using plugin settings for divs and classes
      if(key == "all_contributions") {
        $('#diffs-total').append(chart_div.addClass('col-md-12'));
      } else {
        $('#diffs-charts').append(chart_div.addClass(plugin.settings.chart_width));
      }

      chart_div.highcharts('StockChart', chart_options);
    };

    var ajax_defaults = {
        dataType: 'jsonp', 
        jsonp: 'callback',
        contentType:"application/javascript",
        error: function(req, status ,error) { console.error(status + ": " + error); console.error(req); }
    };

    // loads list of contributors then calls loadSeriesData
    var loadContribData = function() {
      var options = $.extend({
        jsonpCallback: 'contribs',
        url: plugin.settings.json_path + '/contrib.json',
        success: loadSeriesData
      }, ajax_defaults);
      $.ajax(options);
    };

    // from list of contributors loads series data for each chart type
    var loadSeriesData = function(json) {
      plugin.json['contribs'] = json;
      $.each(plugin.json.contribs, function (key, profile) {
        $.each(plugin.settings.series_types, function (i, type) {
          var filename = type + '_' + key;
          var options = $.extend({
            jsonpCallback: filename,
            url: defaults.json_path + '/' + filename + '.json',
            success: function (json) {
              if(type == 'commits') {
                plugin.json[filename] = json;
                createCommitChart(json, profile, key)
              } else {
                // diff chart has 2 series additions/deletions
                // create array to hold charts until both load
                if(plugin.json[key] === undefined) plugin.json[key] = [];
                plugin.json[key].push(json)
                // wait for both to load then create chart
                if(plugin.json[key].length == 2) 
                  createDiffChart(profile, key)
              }
            }
          }, ajax_defaults);
          $.ajax(options);
        });
      });
    };

    var sortCharts = function() {
      sortChart('#commit-charts', byCommits);
      sortChart('#diffs-charts', byCommits);
    };

    var sortChart = function(selector, sortFunction) {
      var container = $(selector);
			var children = container.children().detach()
      children.sort(byCommits);
      container.append(children);
    };

    var byCommits = function(a, b) {
  	  var aCommits = $(a).attr("hg-commits");
    	var bCommits = $(b).attr("hg-commits");
      var compare = parseInt(aCommits) < parseInt(bCommits);
      console.log(aCommits + ' ' + bCommits + ': ' + (compare ? 1 : -1) );
      return compare ? 1 : -1;
    };

    var registerEvents = function() {
      $(plugin.settings.zoom_selector).change(function () {
        var charts = $('.'+plugin.settings.chart_class);
        var zoom = this.value;
        // get all chart divs
        $.each(charts, function (i, chart_div) {
          var chart = $(chart_div).highcharts();
          var max_date = new Date();
          var min_date = new Date();
          min_date.setMonth(min_date.getMonth() - zoom); 
          chart.xAxis[0].setExtremes(min_date, max_date);
        });
      });

      // after all charts loaded sort them
			$( document ).ajaxStop(function() {
        sortCharts();
			});
    };

 		init();
	}
})(jQuery);
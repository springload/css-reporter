var fs = require("fs");
var css = require('css');
var Parker = require('parker');
var metrics = require("parker/metrics/All.js");
var glob = require("glob");
var SpecificityPerSelector;

// Filename may very well change, so let's just look for the id
metrics.map(function(item) {
    if (item.id === "specificity-per-selector") {
        SpecificityPerSelector = item;
    }
});

// Some sort of globby default
var globString = "public/assets/**/*.css";
pattern = process.argv[2] || globString;



function generateStylesheetReport(filePaths) {

    var stylesheetResults = [];

    function parseStyleSheet(item) {
        var stylesheet;

        try {
            stylesheet = fs.readFileSync(item, "utf-8");
            console.log("Inspecting ", item);
        } catch(e) {
            var message = "Couldn't read", item;
            stylesheetResults.push({ errors: message, path: item });
            console.log(message);
            return;
        }

        var obj = css.parse(stylesheet);

        var rules = obj.stylesheet.rules;
        var specificityMap = [];

        var _lines = [];
        var _specificity = [];
        var _selectors = [];

        function iterator(rule) {
            if (rule.selectors) {
                var specs = [];

                if (rule.selectors.length) {
                    rule.selectors.forEach(function iterate(selector) {
                        var res = SpecificityPerSelector.measure(selector);

                        _specificity.push(res);
                        _lines.push(rule.position.start.line);
                        _selectors.push(selector);

                        specificityMap.push({
                            specificity: res,
                            selector: selector,
                            position: rule.position.start
                        });
                    });
                }
            }
        }

        rules.forEach(iterator);

        var chartData = {
            lines: _lines,
            specificity: _specificity,
            selectors: _selectors
        };

        parker = new Parker(metrics);
        var report = parker.run(stylesheet);

        stylesheetResults.push({
            path: item,
            data: specificityMap,
            chart: chartData,
            report: report
        })
    }

    filePaths.forEach(parseStyleSheet);

    return stylesheetResults;
};




var nunjucks = require("nunjucks");
var express = require("express");
var port = 9000;
var app = express();
var webRoot = __dirname + "/public";

var viewEngine = new nunjucks.Environment(new nunjucks.FileSystemLoader(webRoot));
viewEngine.express(app);

viewEngine.addFilter("array", function(data) {
    if (data instanceof Array) {
        return true;
    } else {
        return false;
    }
});

viewEngine.addFilter("json", function(data) {
    try {
        return JSON.stringify(data);
    } catch(e) {

    }
    return "";
});

app.set('view engine', 'html');
app.use("/assets", express.static(__dirname + "static"));

app.get("/", function index(req, res, next) {

    function onGetFiles(error, files) {
        var results = [];

        if (files.length) {
            results = generateStylesheetReport(files);
        }

        res.format({
            html: function() {
                res.render('index', {
                    stylesheets: results,
                    pattern: pattern
                });
            },
            json: function() {
                res.json(results);
            }
        });
    }

    glob(pattern, {}, onGetFiles);
});



var server = app.listen(port, function () {
    console.log("CSS Report on localhost:", port);
});


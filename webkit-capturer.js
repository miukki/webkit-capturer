/*
usage

                var  chromeData = {/images url/}
                wkcapt.gui(gui);
                wkcapt.capture(chromeData, function (count) {
                    //step of capturing
                }, function () {
                    console.log('wkcapt finished!');

                });
*/


var fs = require("fs");
var path = require("path");
var recursive_fs = require("recursive_fs.js");
var exec = require("child_process").exec;

module.exports = (function () {
    var _gui;
    var win;

    function _capture(shot, callback) {
        var delay = shot.delay ? shot.delay + 500 : 2000;

        var onCapture = function (data) {
            // Get base64 body (without description)
            var base64body = data.match(/data:([^;]+);base64,(.*)/)[2];
            var img = new Buffer(base64body, "base64");
            var output = shot.img;
            var dirsPath = path.dirname(output);

            // Create folder if needed
            recursive_fs.mkdir(dirsPath, function () {
                fs.writeFile(output, img, function (err) {
                    // Rewrite png file with jpg file
                    exec("sips -s format jpeg \"" + output + "\" --out \"" + output + "\"", function () {
                        if (callback) {
                            callback();
                        }
                    });

                });
            });
        };

        console.log('shot.url');
        console.log('win.window', win.window);
        win.window.location.href = shot.url;

        win.once("loaded", function () {
            setTimeout(function () {
                win.capturePage(onCapture, "png"); // Used SIPS MacOS utility instead of capturePage with "jpg" param, which compressing can't be adjust
            }, delay);
        });
    }

    return {

        close: function (cb) {
            if (win) {
                win.close();
            }

            if (cb) {
                cb();
            }
        },
        // Because Cannot call require("nw.gui") from module
        gui: function (gui) {
            _gui = gui;
        },

        capture: function (list, eachCallback, endCallback) {
            console.log('capturer!!!');
            var count = 0;

            console.log('Size for chrome screenshots: list[0].width, list[0].height', list[0].width, list[0].height);
            win = _gui.Window.get(window.open("empty.html", "d", "width=" + list[0].width + ",height=" + (list[0].height + 32)));

            win.once("loaded", function () {
                takeShot();
            });

            function takeShot() {
                var shot = list[count];
                if (shot) {
                    _capture(shot, function () {
                        if (eachCallback) eachCallback(count);
                        count++;
                        takeShot();
                    });
                } else {
                    win.close();
                    if (endCallback) endCallback();
                }
            }

        }
    }

})();

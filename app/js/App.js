define('App', [
    'Geom', 'NBoxTree', 'NBox', 'vec', 'imgConvert', 'imgLoad', 'datgui',
    'app.drawing', 'utils', 'planning.maps', 'Interval'
], function(
    Geom, NBoxTree, NBox, vec, imgConvert, imgLoad, datgui,
    drawing, utils, maps, Interval
) {

    function App() {

        var screencanvas = document.getElementById("maincanvas");
        screencanvas.width = 640;
        screencanvas.height = 480;
        var screenctx = imgConvert.canvasToContext(screencanvas);
        screenctx.lineWidth = 1;


        var mdist = 11;
        var mdist2 = 100;
        var target = [620, 20];
        var redCount = 60;
        var trialCount = 0;

        var quad = null;
        var items = null;
        var reddots = null;
        var lines = null;

        function reset() {
            quad = new NBoxTree(new NBox([0, 0], [640, 480]));
            items = [];
            reddots = [];
            lines = [];
            trialCount = 0;
            putNewItem([20, 460], null);
        }

        var mazeCtx = null;
        var mazeMapFn = null;

        var drawingMouse = null;

        var mazeCanvas = imgLoad.asCanvas('img/map.png', function(pCanvas, pCtx) {
            screencanvas.width = screenctx.width = pCanvas.width;
            screencanvas.height = screenctx.height = pCanvas.height;
            mazeCtx = pCtx;
            drawingMouse = drawing.attach(mazeCtx);
        });

        function isWallAt(p) {
            if (mazeMapFn) return mazeMapFn(p[0], p[1]);
        }


        function itemScore(a) {
            return a.fails + vec.dist(a.pos, target) * 0.02;
        }

        var itemCmp = utils.byCmp("score");


        function iterate() {
            mdist = 40 - trialCount / 150;
            if (mdist < 10) mdist = 10;
            mdist2 = (mdist - 1) * mdist;

            items.forEach(function(item) {
                item.score = itemScore(item);
            });
            items.sort(itemCmp);
            for (var i = 0; i < 20; i++) {
                putRandomDot();
            }
            if (reddots.length > redCount) {
                reddots.splice(0, reddots.length - redCount);
            }
        }
        function update(time) {
            for (var i = 0; i < 5; i++) {
                iterate();
            }
        }

        function putDotInTree(dot) {
            return quad.putDot(dot, 0);
        }

        function putNewItem(dot, parent) {
            if (putDotInTree(dot)) {
                var item = { pos: dot, fails: 0 };
                items.push(item);
                if (parent) {
                    lines.push([parent, dot]);
                }
            }
        }

        function hasNear(p) {
            var result = false;
            function visit(dot) {
                if (vec.dist2(dot, p) < mdist2) {
                    result = true;
                }
            }
            quad.traverse(function(node) {
                if (result || node.nbox.dist2(p) > mdist2) {
                    return true;
                } else {
                    var dots = node.dots;
                    if (dots) {
                        dots.forEach(visit);
                    }
                }
            });
            return result;
        }

        function verifyDot(item, u, edot) {
            var x = Math.cos(u), y = Math.sin(u);
            var p = item.pos;
            var dot, i;
            edot[0] = p[0] + x * mdist;
            edot[1] = p[1] + y * mdist;

            for (i = 5; ; i += 5) {
                if (i >= mdist) {
                    return !isWallAt(edot) && !hasNear(edot);
                } else {
                    dot = [p[0] + x * i, p[1] + y * i];
                    if (isWallAt(dot)) {
                        return false;
                    }
                }
            }
        }
        function putRandomDot() {
            var a = Math.random() * 6.28;
            var idx = Math.random();
            idx *= idx;
            idx *= idx;
            idx = (idx * (items.length - 0.0001)) | 0;
            var item = items[idx];
            trialCount++;

            var dot = [0, 0];
            if (verifyDot(item, a, dot)) {
                putNewItem(dot, item.pos);
            } else {
                reddots.push(dot);
                item.fails++;
            }
        }

        function clear() {
            screenctx.clearRect(0, 0, screencanvas.width, screencanvas.height);
        }
        function draw(time) {
            clear();
            screenctx.drawImage(mazeCanvas, 0, 0);
            // drawTree(quad.root);
            screenctx.fillStyle = "blue";

            if (items) {
                items.forEach(function (item) {
                    drawDot(item.pos);
                });
            }
            if (lines) {
                lines.forEach(function (item) {
                    screenctx.beginPath();
                    screenctx.moveTo(item[0][0], item[0][1]);
                    screenctx.lineTo(item[1][0], item[1][1]);
                    screenctx.stroke();
                });
            }

            if (reddots) {
                screenctx.fillStyle = "red";
                reddots.forEach(drawDot);
            }

            if (drawingMouse) {
                screenctx.lineWidth = 1;
                screenctx.strokeStyle = "black";
                screenctx.beginPath();
                screenctx.arc(drawingMouse.x, drawingMouse.y, 10, 0, 360);
                screenctx.stroke();
            }
        }

        function drawDot(dot) {
            var x = dot[0];
            var y = dot[1];
            screenctx.fillRect(x - 1, y - 1, 3, 3);
        }
        function drawTree(tree) {
            var x0 = tree.nbox.min[0];
            var y0 = tree.nbox.min[1];
            var x1 = tree.nbox.max[0];
            var y1 = tree.nbox.max[1];
            screenctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
            if (tree.ch) tree.ch.forEach(drawTree);
        }

        function onRedraw() {
            var time = Date.now() * 0.001;
            draw(time);
        }
        var redrawer = new Interval(onRedraw);
        redrawer.start(20);


        function onUpdate() {
            var time = Date.now() * 0.001;
            if (mazeMapFn) {
                update(time);
            }
        }
        var updater = new Interval(onUpdate);

        function doStart() {
            if (updater.running || !quad) reset();
            mazeMapFn = maps.fromCanvas(mazeCanvas, mazeCtx).fn;
            updater.start(50);
        }
        function doStop() {
            updater.stop();
        }
        function doReset() {
            reset();
        }

        this.doStart = doStart;
        this.doStop = doStop;
        this.doReset = doReset;
    }


    return App;
});


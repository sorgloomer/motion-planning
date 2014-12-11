define('planning.RrtInc', [
    'utils.utils',
    'math.vec', 'math.NBoxTree', 'math.NBox',
    'planning.helper'
], function(
    utils,
    vec, NBoxTree, NBox,
    helper
) {


    var itemCmp = utils.byCmp("score");

    function RrtInc(map) {
        var self = this;
        var samples = this.samples = [];
        var edges = this.edges = [];
        this.map = map;

        var quad = new NBoxTree(new NBox([0, 0], [640, 480]));
        var trialCount = 0;
        var target = map.target;

        var mdist = map.resolution;
        var mdist2 = mdist * mdist * 0.95;

        var localSampler = map.sampler;

        var solutionSample = null;

        putNewItemByPos(map.start, null);


        function putNewItemByPos(dot, parent) {
            var item = { pos: dot, fails: 0, parent: parent };
            if (putDotInTree(dot)) {
                samples.push(item);
                if (parent) {
                    edges.push([parent, item]);
                }
            }
            return item;
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
                    return !localSampler(edot) && !hasNear(edot);
                } else {
                    dot = [p[0] + x * i, p[1] + y * i];
                    if (localSampler(dot)) {
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
            idx = (idx * (samples.length - 0.0001)) | 0;
            var item = samples[idx];
            trialCount++;

            var dot = [0, 0];
            if (verifyDot(item, a, dot)) {
                var newItem = putNewItemByPos(dot, item);
                if (vec.dist2(dot, target) < mdist2) {
                    self.hasSolution = true;
                    solutionSample = newItem;
                }
            } else {
                if (self.wrongSampleCallback) {
                    self.wrongSampleCallback(dot);
                }
                item.fails++;
            }
        }

        function itemScore(a) {
            return a.fails + vec.dist(a.pos, target) * 0.02;
        }


        function putDotInTree(dot) {
            return quad.putDot(dot, 0);
        }

        function iterate(sampleCnt) {
            samples.forEach(function(item) {
                item.score = itemScore(item);
            });
            samples.sort(itemCmp);
            helper.iterate(self, putRandomDot, sampleCnt);
        }

        function getSolution() {
            function parent(item) {
                return item.parent;
            }
            function cost(a, b) {
                return vec.dist(a.pos, b.pos);
            }
            function mapToPos(item) {
                return item.pos;
            }
            return helper.pathToRoot(parent, solutionSample, cost, mapToPos);
        }

        this.continueForever = false;
        this.hasSolution = false;
        this.wrongSampleCallback = null;
        this.iterate = iterate;
        this.getSolution = getSolution;
    }

    return RrtInc;
});
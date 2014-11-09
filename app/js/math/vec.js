/**
 * Created by Hege on 2014.09.28..
 */

define('vec', [], function() {
    function addTo(to, a, b) {
        for (var i = 0, mi = a.length; i < mi; i++) {
            to[i] = a[i] + b[i];
        }
        return to;
    }
    function add(a, b) {
        var r = alloc(a.length);
        return addTo(r, r, b);
    }
    function subTo(to, a, b) {
        for (var i = 0, mi = a.length; i < mi; i++) {
            to[i] = a[i] - b[i];
        }
        return to;
    }
    function sub(a, b) {
        var r = alloc(a.length);
        return subTo(r, a, b);
    }
    function dot(a, b) {
        var res = 0;
        for (var i = 0, mi = a.length; i < mi; i++) {
            res += a[i] * b[i];
        }
        return res;
    }
    function len2(a) {
        var res = 0, ai;
        for (var i = 0, mi = a.length; i < mi; i++) {
            res += (ai = a[i]) * ai;
        }
        return res;
    }
    function len(a) {
        return Math.sqrt(len2(a));
    }
    function dist2(a, b) {
        var res = 0, ai;
        for (var i = 0, mi = a.length; i < mi; i++) {
            res += (ai = (a[i] - b[i])) * ai;
        }
        return res;
    }
    function dist(a, b) {
        return Math.sqrt(dist2(a, b));
    }
    function copy(a) {
        return a.slice(0);
    }
    function copyTo(b, a) {
        for (var i = 0, mi = a.length; i < mi; i++) {
            b[i] = a[i];
        }
        b.length = a.length;
        return b;
    }
    function zero(dims) {
        var res = alloc(dims);
        for (var i = 0; i < dims; i++) res[i] = 0;
        return res;
    }
    function unit(dims, dir) {
        var res = zero(dims);
        res[dir] = 1;
        return res;
    }
    function alloc(dims) {
        return new Array(dims);
    }
    return {
        alloc: alloc,
        zero: zero,
        unit: unit,

        copy: copy,
        copyTo: copyTo,

        dot: dot,
        add: add,
        sub: sub,
        subTo: subTo,
        len: len,
        len2: len2,
        dist: dist,
        dist2: dist2
    };
});
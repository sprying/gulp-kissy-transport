'use strict';
var path = require('path');
var fs = require('fs');
var through = require('through2');
var managejs = require('managejs');
var extend = require('extend');
var Mod = require('./mod.js');

module.exports = function (opts) {
    var runCwd = path.normalize(opts.runCwd || './src/app');
    var mods = {}

    function calculateAdded(arr1, arr2) {
        var allArr = []
        var addedArr = []
        arr1.map(function (modName) {
            var targetList = [modName]
            allArr.push(modName)
            if (modName.slice(-1) == '/') {
                targetList = targetList.concat(modName.slice(0, -1), modName + 'index', modName + 'index.js')
            } else if (modName.slice(-5) == 'index') {
                targetList = targetList.concat(modName.slice(0, -5), modName.slice(0, -6), modName + '.js')
            } else if (modName.slice(-8) == 'index.js') {
                targetList = targetList.concat(modName.slice(0, -3), modName.slice(0, -8), modName.slice(0, -9))
            }
            allArr = allArr.concat(targetList)
        })
        arr2.map(function (modName) {
            if (!(allArr.indexOf(modName) + 1)) {
                addedArr.push(modName)
            }
        })
        return addedArr
    }

    function obatinRequires(mod) {
        var requireObj = mod.requireObj
        var requires = mod.requires.slice(0)
        var addedRequires = []
        if (!Object.keys(requireObj).length)
            return requires;
        else if (!mod.addedRequires) {
            for (var modName in requireObj) {
                addedRequires = calculateAdded(requires, obatinRequires(requireObj[modName]))
                requires = requires.concat(addedRequires)
            }
            mod.addedRequires = calculateAdded(mod.requires, requires)
            return requires
        }
        return mod.requires.concat(mod.addedRequires)
    }

    function arr2Str(arr) {
        var rtnStr = [];
        arr.map(function (item) {
            rtnStr.push('\'' + item + '\'')
        })
        return rtnStr.join(',')
    }

    function addIndexAndJsExtFromName(name) {
        // 'x/' 'x/y/z/'
        if (name.charAt(name.length - 1) === '/') {
            name += 'index';
        }
        if (name.slice(-3) != '.js') {
            name = name + '.js';
        }
        return name;
    }

    function handleFile(file, parentMod) {
        var modName = path.relative(path.resolve(runCwd, '../'), file.path)
        var mod
        if (modName.slice(-3) == '.js') modName = modName.slice(0, -3)
        if (mods[modName]) {
            parentMod.add('requireObj', mods[modName])
            return
        }
        parentMod.add('requireObj', mods[modName] = mod = new Mod({
            name: modName,
            path: file.path,
            content: file.content.toString()
        }))


        var rootNode = managejs.transfer(file.content.toString());
        var requireArr = rootNode.findById('ArrayExpression', 'requires')
        var childName;
        if (!requireArr.length) return new Buffer(file.content)
        for (var j = 0, ast_len = requireArr[0].astObj.elements.length; j < ast_len; j++) {
            childName = requireArr.get(j).stringify().replace(/\'/g, '')
            mod.add('requires', childName)
            mod.fileNode = rootNode
            var filePath = path.resolve(runCwd, '../', addIndexAndJsExtFromName(childName))
            if (fs.existsSync(filePath)) handleFile({
                path: filePath,
                content: fs.readFileSync(filePath)
            }, mod)
        }
        var fileNode = mod.fileNode
        fileNode.find('CallExpression', 'KISSY.add').spliceParam(2, 1, '{requires:[' + arr2Str(obatinRequires(mod)) + ']}')
        return new Buffer(fileNode.stringify());
    }

    var rootMod = new Mod({
        name: ''
    })

    function transport(file, encoding, callback) {

        console.log(file.path)
        file.contents = handleFile({
            path: file.path,
            content: file.contents
        }, rootMod)

        callback(null, file);
    }

    return through.obj(transport);
}

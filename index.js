'use strict';
var path = require('path');
var fs = require('fs');
var through = require('through2');
var managejs = require('managejs');
var extend = require('extend');
var Mod = require('./libs/mod.js');

module.exports = function (opts) {
    var packagesMap = {}
    var pkList = [];
    (opts || []).forEach(function(item){
        packagesMap[item.match(/[\w\-\_]+[\/]{0,1}$/)[0]] = path.normalize(item)
        pkList.push(item.match(/\w[\s\S]*/)[0])
    })
    pkList.sort(function(item1,item2){
        return item2.length - item1.length
    })
    var mods = {}

    function calculateAdded(arr1, arr2) {
        var allArr = []
        var addedArr = []
        arr1.map(function (modName) {
            var targetList = [modName]
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

    function handleRequires(mod){

    }

    function handleFile(file, parentMod) {
        // 模块名
        var modName = (function(){
            var modName = path.relative(path.resolve('./'), file.path)
            var index
            for(var i=0,len=pkList.length;i<len;i++){
                index = modName.indexOf(pkList[i]);
                if(index+1){
                    modName = pkList[i].match(/[\w\-\_]+[\/]{0,1}$/)[0] + modName.slice(index+pkList[i].length)
                    break
                }
            }
            if (modName.slice(-3) == '.js') modName = modName.slice(0, -3)
            return modName
        })()
        // 模块实例化
        var mod
        parentMod.add('requires', modName)
        if (mods[modName]) {
            parentMod.add('requireObj', mods[modName])
            var rootNode = mods[modName].fileNode
            rootNode.find('CallExpression', 'KISSY.add').spliceParam(2, 1, '{requires:[' + arr2Str(obatinRequires(mods[modName])) + ']}')
            return new Buffer(rootNode.stringify());
        }
        console.log(file.path)
        parentMod.add('requireObj', mods[modName] = mod = new Mod({
            name: modName,
            path: file.path,
            content: file.content.toString()
        }))


        var rootNode = mod.fileNode = managejs.transfer(file.content.toString());
        var requireArr = rootNode.findById('ArrayExpression', 'requires')
        var childName;
        var childFilePath;
        if (!requireArr.length) return new Buffer(file.content)
        for (var j = 0, ast_len = requireArr[0].astObj.elements.length; j < ast_len; j++) {
            childName = requireArr.item(0).get(j).stringify().replace(/\'/g, '')

            // 依赖形式如： "./mod"、"mod"，相对当前文件路径，解析依赖文件路径
            if((childName.search(/^[\.]{0,2}\//)+1) || (childName.search(/^[\w\.\_\-]+(?:\.js)?$/) +1)){
                childFilePath = path.resolve(file.path,'../', addIndexAndJsExtFromName(childName))

                //其它匹配包，再根据包路径，解析依赖文件路径 todo:无匹配包时的解析，绝对路径时的解析都还没考虑
            }else{
                childFilePath = path.resolve(addIndexAndJsExtFromName(childName.replace(childName.match(/[\w\-\_]+/)[0],packagesMap[childName.match(/[\w\-\_]+/)[0]])))
            }
            if (fs.existsSync(childFilePath)) handleFile({
                path:childFilePath,
                content: fs.readFileSync(childFilePath)
            }, mod)
            else{
                mod.add('requires', childName)
            }
        }
        rootNode.find('CallExpression', 'KISSY.add').spliceParam(2, 1, '{requires:[' + arr2Str(obatinRequires(mod)) + ']}')
        return new Buffer(rootNode.stringify());
    }

    var rootMod = new Mod({
        name: ''
    })

    function transport(file, encoding, callback) {

        file.contents = handleFile({
            path: file.path,
            content: file.contents
        }, rootMod)

        callback(null, file);
    }

    return through.obj(transport);
}

'use strict';
var path = require('path');
var fs = require('fs');
var through = require('through2');
var managejs = require('managejs');
var Mod = require('./libs/mod.js');

module.exports = function (opts) {
    var packagesMap = {}
    var pkList = []
    var mods = {};
    (opts || []).forEach(function(item){
        packagesMap[item.match(/[\w\-\_]+[\/]{0,1}$/)[0]] = path.normalize(item)
        pkList.push(item.match(/\w[\s\S]*/)[0])
    })
    pkList.sort(function(item1,item2){
        return item2.length - item1.length
    })

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


    function obtainPathFromReq(basePath, reqName){
        // 依赖形式如： "./mod"、"../mod"、"mod"，相对当前文件路径，解析依赖文件路径
        if((reqName.search(/^[\.]{0,2}\//)+1) || (reqName.search(/^[\w\.\_\-]+(?:\.js)?$/) +1)){
            return path.resolve(basePath,'../', addIndexAndJsExtFromName(reqName))

            //其它匹配包，再根据包路径，解析依赖文件路径 todo:无匹配包时的解析，绝对路径时的解析都还没考虑
        }else{
            return path.resolve(addIndexAndJsExtFromName(reqName.replace(reqName.match(/[\w\-\_]+/)[0],packagesMap[reqName.match(/[\w\-\_]+/)[0]])))
        }

    }
    function start(path,pMod){
        if(!fs.existsSync(path)) return
        var fileContent = fs.readFileSync(path)
        var rootNode = managejs.transfer(fileContent)
        var adds = rootNode.find('CallExpression','KISSY.add')
        var kissyArea
        var modName
        var mod
        var reqList
        var reqName
        var reqPath
        for(var i= 0,len= adds.length;i<len;i++){
            kissyArea = adds.item(i)
            modName = kissyArea.get(0).stringify().replace(/\'/g, '')
            pMod.add('requires',modName)
            if(mods[modName]){
                pMod.add('requireObj',mods[modName])
                return
            }
            pMod.add('requireObj',mods[modName] = mod = new Mod({
                name:modName,
                path:path
            }))
            reqList = kissyArea.findById('ArrayExpression','requires').item(0)
            for(var j= 0,l=reqList[0].astObj.elements.length;j<l;j++){
                reqName = reqList.get(j).stringify().replace(/\'/g, '')
                reqPath = obtainPathFromReq(path, reqName)
                if (fs.existsSync(reqPath)){
                    start(reqPath, mod)
                } else {
                    mod.add('requires',reqName)
                }
            }
        }
    }

    var rootMod = new Mod({
        name: ''
    })

    function transport(file, encoding, callback) {

        start(file.path,new Mod({}))
        var fileNode = managejs.transfer(file.contents)
        var adds = fileNode.find('CallExpression','KISSY.add')
        var kissyArea
        var modName
        for(var i=0,len =adds.length;i<len;i++){
            kissyArea = adds.item(i)
            modName = kissyArea.get(0).stringify().replace(/\'/g, '')
            kissyArea.spliceParam(2, 1, '{requires:[' + arr2Str(obatinRequires(mods[modName])) + ']}')
        }
        file.contents = new Buffer(fileNode.stringify())

        callback(null, file)
    }

    return through.obj(transport);
}

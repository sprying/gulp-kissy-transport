'use strict';
var path = require('path');
var fs = require('fs');
var through = require('through2');
var managejs = require('managejs');
var Mod = require('./libs/mod.js');

module.exports = function (opts) {
    var pkMap = {}
    var pkList = []
    var mods = {};
    // 必须加分号，不然报错
    (opts || []).forEach(function(item){
        pkMap[item.match(/[\w\-\_]+[\/]{0,1}$/)[0]] = path.normalize(item)
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

    function obtainRequires(mod){
        var requireObj = mod.requireObj
        var requires = mod.requires.slice(0)
        var addedRequires = []
        var subMod
        var adds;
        if (!Object.keys(requireObj).length)
            return requires
        else if (!mod.addedRequires) {
            for (var modName in requireObj) {
                addedRequires = calculateAdded(requires, obtainRequires(requireObj[modName]))
                requires = requires.concat(addedRequires)
            }
            adds = calculateAdded(mod.requires,requires)
            addedRequires = []
            for(var i= 0,l=adds.length;i<l;i++){
                subMod = Mod.getModFromName(adds[i])
                if(!subMod  ||  (subMod.path == mod.path) || !pathInNames(subMod.path,mod.requires)){
                    addedRequires.push(adds[i])
                }
            }
            mod.add('addedRequires',addedRequires)
            return mod.requires.concat(addedRequires)
        }
        return requires.concat(mod.addedRequires)
    }

    function pathInNames(filePath,names){
        var reqName
        var reqPath
        for(var i=0,l=names.length;i<l;i++){
            reqName = names[i]
            if((reqName.search(/^[\.]{0,2}\//)+1)){
                reqPath = path.resolve(basePath,'../', addIndexAndJsExtFromName(reqName))

                //其它匹配包，再根据包路径，解析依赖文件路径 todo:无匹配包时的解析，绝对路径时的解析都还没考虑
            } else {
                reqPath = path.resolve(addIndexAndJsExtFromName(reqName.replace(reqName.match(/[\w\-\_]+/)[0],pkMap[reqName.match(/[\w\-\_]+/)[0]])))
            }
            if(filePath == reqPath){
                return true
            }
        }
        return false
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


    function obtainModNameFromAbosulte(filePath){
        // 模块名
        var modName = path.relative(path.resolve('./'), filePath)
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
    }

    /**
     * 获取依赖的模块名、模块路径，模块名是相对路径时，转换成包名开头的模块名
     * 同一文件内包含多个KISSY模块时，依赖模块的实际路径
     * @param basePath
     * @param reqName
     * @returns {*}
     */
    function obtainPathFromReq(basePath, reqName){
        // 根据依赖名解析出路径
        var reqPath
        // 根据路径解析出的模块名
        var nameFromPath


        // 依赖形式如： "./mod"、"../mod"，相对当前文件路径，解析依赖文件路径
        if((reqName.search(/^[\.]{0,2}\//)+1)){
            reqPath = path.resolve(basePath,'../', addIndexAndJsExtFromName(reqName))

            //其它匹配包，再根据包路径，解析依赖文件路径 todo:无匹配包时的解析，绝对路径时的解析都还没考虑
        } else {
            reqPath = path.resolve(addIndexAndJsExtFromName(reqName.replace(reqName.match(/[\w\-\_]+/)[0],pkMap[reqName.match(/[\w\-\_]+/)[0]])))
        }

        nameFromPath = obtainModNameFromAbosulte(reqPath)

        return {
            reqPath:reqPath,
            modName:/^[\w\_]+/.test(reqName)?reqName:nameFromPath
        }
    }
    function parseFile(path,pMod){
        if(!fs.existsSync(path)) return
        var fileContent = fs.readFileSync(path)
        var rootNode = managejs.transfer(fileContent)
        var adds = rootNode.find('CallExpression','KISSY.add')
        var kissyArea
        var modName
        var mod
        var reqList
        var reqModName
        var reqPath
        var reqMod
        for(var i= 0,len= adds.length;i<len;i++){
            kissyArea = adds.item(i)

            // 处理情况：if (typeof KISSY != "undefined" && KISSY.add) {
            if(kissyArea[0].astObj.arguments.length <=1 ) continue
            modName = kissyArea.get(0).stringify().replace(/\'/g, '')
            // 已经创建过此模块
            if(mod = Mod.getModFromName(modName)){
                (path.indexOf(modName)+1) && pMod.add('requireObj',mod)
                continue
            }else{
                mod = Mod.create({
                    name:modName,
                    path:path
                })
            }
            // 只会对名字和文件路径一致的模块进行添加
            if(path.indexOf(modName)+1){
                pMod.add('requireObj',mod)
            }
            reqList = kissyArea.findById('ArrayExpression','requires').item(0)
            // 针对KISSY.add("app/index",function(){})
            if(!reqList)    continue
            for(var j= 0,l=reqList[0].astObj.elements.length;j<l;j++){
                var rtnObj = obtainPathFromReq(path, reqList.get(j).stringify().replace(/\'/g, ''))
                reqPath = rtnObj.reqPath
                reqModName = rtnObj.modName
                mod.add('requires',reqModName)
                reqMod = Mod.getModFromName(reqModName)
                // 为解决单文件多kissy模块
                reqMod && mod.add('requireObj',reqMod)
                if (fs.existsSync(reqPath)){
                    parseFile(reqPath, mod)
                }
            }
        }
    }

    var rootMod = Mod.create({
        name: ''
    })

    function transport(file, encoding, callback) {
        // 递归分析生成kissy模块对象
        parseFile(file.path,rootMod)
        var fileNode = managejs.transfer(file.contents)
        var adds = fileNode.find('CallExpression','KISSY.add')
        var stash = []
        var kissyArea
        var modName
        var mod
        var isNeedChgFile = false
        var requires
        for(var i=0,len =adds.length;i<len;i++){
            kissyArea = adds.item(i)
            // 处理情况：if (typeof KISSY != "undefined" && KISSY.add) {
            if(kissyArea[0].astObj.arguments.length <=1 ) continue
            modName = kissyArea.get(0).stringify().replace(/\'/g, '')
            //console.log('change mod: ' + modName)
            mod = Mod.getModFromName(modName)
            // 获取模块的所有依赖
            requires = obtainRequires(mod)
            // 筛到队列中，后续有需要才执行
            stash.push((function(requires,kissyArea){
                return function(){
                    kissyArea.spliceParam(2, 1, '{requires:[' + arr2Str(requires) + ']}')
                }
            })(requires,kissyArea))
            // 只要文件内模块有一个深层依赖，标志为需重写
            if(mod.needEdit()){
                isNeedChgFile = true
            }
        }

        // 文件内的模块有深层依赖其它文件的模块时
        if(isNeedChgFile){
            stash.forEach(function(item){
                item()
            })
            file.contents = new Buffer(fileNode.stringify())
        }

        callback(null, file)
    }

    return through.obj(transport);
}

'use strict';
var path = require('path')
var fs = require('fs')
var through = require('through2')
var managejs = require('managejs')
var _ = require('lodash')
var Mod = require('./lib/mod.js')

// 根模块
var rootMod = Mod.create({
    name: ''
})
// 已经解析过文件Map
var parsedMap = {}
// 文件对应的模块
var file2mod = {}
// 模块包名
var REG_PACKAGE_NAME = /^[\w-_]+/
// kissy的包配置
var pkgMap = {}

exports.config = function (name, cfg) {
    if (name = 'packages') {
        _.forEach(cfg, function (value, index) {
            pkgMap[value.name] = path.resolve(value.path)
        })
    }
}

function arr2Str(arr) {
    var rtnStr = [];
    _.forEach(arr, function(item){
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

/**
 * 获取依赖的模块名、模块路径，模块名是相对路径时，转换成包名开头的模块名
 * 同一文件内包含多个KISSY模块时，依赖模块的实际路径
 * @param basePath 根路径
 * @param reqName 模块名
 * @returns {*}
 */
function obtainModInfoFromReq(basePath, reqName, relativeModName) {
    // 根据依赖名解析出文件path
    var realPath = ''
    var modName = ''


    // 匹配如： "./mod"、"../mod"，解析出文件路径
    if (/^[.]{1,2}\//.test(reqName)) {
        realPath = path.resolve(basePath, '../', addIndexAndJsExtFromName(reqName))
        modName = obtainModNameFromAbosulte(realPath, relativeModName) || reqName

        //其它匹配包，再根据包路径，解析依赖文件路径 无匹配包时的解析，todo:绝对路径时的解析都还没考虑
    } else {
        var pkgName = reqName.match(REG_PACKAGE_NAME)[0]
        if (pkgMap[pkgName]) {
            realPath = path.resolve(addIndexAndJsExtFromName(reqName.replace(pkgName, pkgMap[pkgName] || '')))
        }
        modName = reqName
    }


    return {
        modPath: realPath,
        modName: modName  // io node等情况不处理，./和../处理成带包名
    }
}


/**
 * 获取模块名
 * @param filePath 模块路径
 * @param relModName 相对的模块名
 * @returns {*}
 */
function obtainModNameFromAbosulte(filePath, relModName) {
    // 模块名
    // window系统 下文件路径 c:\workspace

    var pkgName = extractPkgName(relModName)
    var pkgPath = pkgMap[pkgName]
    var modName

    // console.log('*** obtain module name ***')
    // console.log('filePath: %s', filePath)
    // console.log('pkgPath: %s', pkgPath)

    if (!_.startsWith(filePath, pkgPath)) {
        pkgName = ''
        pkgPath = ''
        _.forIn(pkgMap, function (value, key) {
            if (_.startsWith(filePath, value) && _.endsWith(value, key)) {
                pkgPath = value
                pkgName = key
                return false
            }
        })

        if (!pkgName) {
            console.warn('lack the package definition of path: ' + filePath)
            return false
        }

    }
    modName = filePath.replace(pkgPath, pkgName)

    if (modName.slice(-3) == '.js') modName = modName.slice(0, -3)
    return modName
}

/**
 * 计算出arr2在arr1中没有的元素，然后组成数组返回
 * @param arr1
 * @param arr2
 * @returns {Array}
 */
function calculateAdded(arr1, arr2) {
    var allArr = []
    var addedArr = []
    _.forEach(arr1, function (modName) {
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
    _.forEach(arr2, function (modName) {
        if (!(allArr.indexOf(modName) + 1)) {
            addedArr.push(modName)
        }
    })
    return addedArr
}

/**
 * 解析出包名
 * @param modName 模块名
 * @returns {*}
 */
function extractPkgName(modName) {
    return modName.match(REG_PACKAGE_NAME)[0]
}

/**
 * 模块是不是文件的入口模块，入口模块可以被其它文件的模块引用，进而分析出路径
 * @param modName
 * @param filePath
 * @returns {boolean}
 */
function isEntry(modName, filePath){
    var tag = false
    _.forEach(pkgMap, function(pkgPath, pkgName){
        if(_.startsWith(filePath, pkgPath)){
            var aModName = filePath.replace(pkgPath, pkgName)
            if(addIndexAndJsExtFromName(modName) == aModName){
                tag = true
                return false
            }
        }
    })
    return tag
}

/**
 * 获取一个模块的所有依赖
 * @param mod
 * @returns {Array.<T>}
 */
function obtainRequires(mod) {
    console.log('===[module analysis] start: %s===', mod.name)
    var allReqs

    if (mod.hasChecked) {
        console.log('**quickly analyze %s**', mod.name)
        console.log('mod name: %s', mod.name)
        allReqs = mod.allReqs
    } else {
        var reqRefs = mod.reqRefs
        var reqs = mod.reqs.slice(0)
        var addReqs = []
        var adds = []


        if (reqRefs.length) {
            _.forEach(reqRefs, function (reqMod) {
                adds = calculateAdded(reqs, obtainRequires(reqMod))
                reqs = reqs.concat(adds)
            })
            adds = calculateAdded(mod.reqs, reqs) // 初步提出新增的模块

            // 进一步对提出的新增模块进行过滤
            _.forEach(adds, function (add, i) {
                var subMod = Mod.getModFromName(add)

                // 第一种，是线上模块，或者找不到的模块；第二种，是依赖和被依赖的模块在同一文件里；第三种，依赖的是一个文件中有多模块的副模块
                // 忽略提取出的模块，是非入口模块
                if (!subMod || (subMod.path == mod.path) || subMod.isMain) {
                    addReqs.push(adds[i])
                }
            })

            mod.add('addReqs', addReqs)
        }

        mod.hasChecked = true
        var allOReqs = mod.allOReqs = mod.oriReqs.concat(mod.addReqs)
        allReqs = mod.allReqs = mod.reqs.concat(mod.addReqs)

        console.log('mod name: %s', mod.name)
        console.log('mod reqs: %s', mod.reqs)
        console.log('mod addReqs: %s', addReqs)
    }


    console.log('mod allReqs: %s', allReqs)
    console.log('===[module analysis] end: %s===', mod.name)

    return allReqs
}

/**
 * 一层层解析文件
 * @param path
 * @param pMod
 */
function parseFile(filePath, pMod) {
    if (!fs.existsSync(filePath)) return

    var fileContent = fs.readFileSync(filePath)
    var rootNode = managejs.transfer(fileContent)
    var adds = rootNode.find('CallExpression', 'KISSY.add')
    var kissyArea
    var modName
    var mod
    var reqList
    var reqMod
    var multipleMods = []

    if (parsedMap[filePath]) {
        if (pMod) {
            _.forEach(file2mod[filePath], function (mod) {
                if(isEntry(mod.name, filePath)) {
                    console.log('rootMod reqRefs: ' + mod.name)
                    pMod.add('reqRefs', mod)
                }
            })
        }
        return
    }
    console.log('==[file parse] start: %s==', path.relative(process.cwd(), filePath))
    parsedMap[filePath] = true
    file2mod[filePath] = []

    // 一个文件里有多个kissy模块
    for (var i = 0, len = adds.length; i < len; i++) {
        kissyArea = adds.item(i)

        // 处理情况：if (typeof KISSY != "undefined" && KISSY.add) {
        if (kissyArea[0].astObj.arguments.length <= 1) continue
        modName = kissyArea.get(0).stringify().replace(/\'/g, '')
        mod = Mod.getModFromName(modName)
        if (mod) {
            console.warn('**repeat use the same name ' + modName + ' @ ' + path.relative(process.cwd(), filePath) + '**')
            console.warn('**conflict with the file: ' + path.relative(process.cwd(), mod.path) + '**')
            continue
        }
        var isMain = isEntry(modName, filePath)
        mod = Mod.create({
            name: modName,
            path: filePath,
            isMain: isMain
        })

        reqList = kissyArea.findById('ArrayExpression', 'requires').item(0)

        // 针对KISSY.add("app/index",function(){})
        if (!reqList)    continue

        for (var j = 0, l = reqList[0].astObj.elements.length; j < l; j++) {
            var originReqName = reqList.get(j).stringify().replace(/\'/g, '')
            var rtnObj = obtainModInfoFromReq(filePath, originReqName, modName)
            var depPath = rtnObj.modPath
            var depName = rtnObj.modName

            mod.add('reqs', depName)
            mod.add('oriReqs', originReqName)
            if(originReqName != depName){
                mod.isDepNameChg = true
            }

            reqMod = Mod.getModFromName(depName)

            if (!reqMod && fs.existsSync(depPath)) {
                parseFile(depPath)
            }
            multipleMods.push([mod, depName])
        }
        console.log('[reqs]' + modName + ':' + mod.reqs)

        file2mod[filePath].push(mod)
    }

    _.forEach(multipleMods, function (cache) {
        reqMod = Mod.getModFromName(cache[1])
        if (reqMod) {
            cache[0].add('reqRefs', reqMod)
            console.log('[reqRefs]' + cache[0]['name'] + ' : ' + cache[1])
        }
    })
    if (pMod) {
        _.forEach(pkgMap, function (value, key) {
            if (_.startsWith(filePath, value)) {
                _.forEach(file2mod[filePath], function (mod) {
                    if(extractPkgName(mod.name) == key){
                        console.log('rootMod reqRefs: ' + mod.name)
                        pMod.add('reqRefs', mod)
                    }
                })
            }
        })
    }
    console.log('==[file parse] end: %s==', path.relative(process.cwd(), filePath))
}


/**
 * 原理
 * 从一个文件开始，分析它的模块、依赖的模块、依赖的文件，直到找不到文件的模块依赖了。期间生成各个模块实例，依赖关联关系。
 * 最终提前分析出一个模块层层依赖的所有模块，将层层依赖的模块，追加到当前依赖上。
 *
 **/
exports.deepenDeps = function () {
    function transport(file, encoding, callback) {
        var _log = console.log
        console.log = function(){}

        // 递归生成kissy模块对象
        console.log('=[directory file parse] start: %s=', path.relative(process.cwd(), file.path))
        parseFile(file.path, rootMod)
        console.log('=[directory file parse] end: %s=', path.relative(process.cwd(), file.path))
        console.log()

        // 替换kissy.add第三个参数
        var fileNode = managejs.transfer(file.contents)
        var adds = fileNode.find('CallExpression', 'KISSY.add')
        var kissyArea
        var modName
        var mod
        var isNeedChgFile = false
        var requires
        console.log('=[directory file analysis] start: %s=', path.relative(process.cwd(), file.path))
        for (var i = 0, len = adds.length; i < len; i++) {
            kissyArea = adds.item(i)
            // 处理情况：if (typeof KISSY != "undefined" && KISSY.add) {
            if (kissyArea[0].astObj.arguments.length <= 1) continue

            modName = kissyArea.get(0).stringify().replace(/\'/g, '')

            // 一个文件多模块，只处理其中一个对外模块
            if (!isEntry(modName, file.path))    continue

            mod = Mod.getModFromName(modName)

            // console.log('===begin analyze ' + modName + '===')
            console.log('==[module analysis from source] start: %s==', modName)
            // 获取模块的所有依赖
            obtainRequires(mod)
            requires = mod.allReqs
            // console.log('=== end  analyze ' + modName + '===')
            console.log('==[module analysis from source] end: %s', modName)

            if (mod.needEdit()) {
                isNeedChgFile = true
                kissyArea.spliceParam(2, 1, '{requires:[' + arr2Str(requires) + ']}')
            }
        }
        console.log('=[directory file analysis] end: %s=', path.relative(process.cwd(), file.path))
        console.log()
        console.log()

        // 文件内的模块有深层依赖其它文件的模块时
        if (isNeedChgFile) {
            file.contents = new Buffer(fileNode.stringify())
        }

        console.log = _log
        callback(null, file)
    }

    return through.obj(transport);
}
exports.rootMod = rootMod

'use strict';
var path = require('path');
var fs = require('fs');
var through = require('through2');
var managejs = require('managejs');
var Mod = require('./lib/mod.js');
var util = require('./lib/util')

var rootMod = Mod.create({
    name: ''
})
/**
 * 原理
 * 从一个文件开始，分析它的模块、依赖的模块、依赖的文件，直到找不到文件的模块依赖了。期间生成各个模块实例，依赖关联关系。
 * 最终提前分析出一个模块层层依赖的所有模块，将层层依赖的模块，追加到当前依赖上。
 *
 **/
exports.transport = function (packagePaths) {
    if (typeof packagePaths === 'string') packagePaths = [packagePaths]
    if (!packagePaths.length) {
        console.log('需要配置包所在的路径')
        return
    }

    var pkMap = {}
    var pkList = []; // 必须加分号，不然报错

    packagePaths.forEach(function (item) {
        pkMap[item.match(/[\w\-\_]+[\/]{0,1}$/)[0]] = path.normalize(item)
        pkList.push(item.match(/\w[\s\S]*/)[0])
    })
    pkList.sort(function (item1, item2) {
        return item2.length - item1.length
    })

    /**
     * 计算出arr2在arr1中没有的元素，然后组成数组返回
     * @param arr1
     * @param arr2
     * @returns {Array}
     */
    function calculateAdded(arr1, arr2) {
        var allArr = []
        var addedArr = []
        arr1.forEach(function (modName) {
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
        arr2.forEach(function (modName) {
            if (!(allArr.indexOf(modName) + 1)) {
                addedArr.push(modName)
            }
        })
        return addedArr
    }

    /**
     * 获取一个模块的所有依赖
     * @param mod
     * @returns {Array.<T>}
     */
    function obtainRequires(mod) {
        var reqRefs = mod.reqRefs
        var requires = mod.requires.slice(0)
        var addedRequires = []
        var subMod
        var adds;
        if (!reqRefs.length) {
            console.log('mod latest requires: ')
            console.log(requires.concat(mod.addedRequires))
        } else if (!mod.addedRequires) {
            reqRefs.forEach(function (reqMod) {
                console.log('====analyze the refer to ' + reqMod.name + '    ====')
                addedRequires = calculateAdded(requires, obtainRequires(reqMod))
                console.log('====analyze the refer to ' + reqMod.name + ' end====')
                console.log()
                requires = requires.concat(addedRequires)
            })
            adds = calculateAdded(mod.requires, requires)

            // 为什么再重新校验下哪些嵌套依赖需要添加，当初这样写的原因忘了......
            addedRequires = []

            console.log('mod.name: ' + mod.name)
            // console.log('mod.path: ' + mod.path)
            console.log('mod requires: ' + mod.requires)
            console.log('mod adds: ' + adds)

            for (var i = 0, l = adds.length; i < l; i++) {
                console.log('---one dependency of mod begins analysis---')
                subMod = Mod.getModFromName(adds[i])

                console.log('subMod requireName: ' + adds[i])
                console.log('subMod.path: ' + (!!subMod ? subMod.path : ''))

                // 第一种，是线上模块；第二种，是依赖和被依赖的模块在同一文件里；第三种，如果依赖的模块所在文件，已经被依赖了
                subMod && console.log('**' + subMod.isLessor + '**')
                if (!subMod || (subMod.path == mod.path) || (!subMod.isLessor && !pathInNames(subMod.path, mod.requires))) {
                    addedRequires.push(adds[i])
                    console.log('mod requires add one: ' + adds[i])
                }
            }
            mod.add('addedRequires', addedRequires)
            console.log('------analysis end--------')
            console.log('mod.addedRequires: ')
            console.log(addedRequires)
            console.log('mod latest deps: ')
        } else {
            console.log('=====quickly analyze the refer to ' + mod.name + '=====')
        }
        console.log(mod.requires.concat(mod.addedRequires))
        return mod.requires.concat(addedRequires)
    }

    /**
     * 数组names各个元素，是模块名字，是否有名字拼接成的路径，与filePath相等
     * @param filePath
     * @param names
     * @returns {boolean}
     */
    function pathInNames(filePath, names) {
        var reqName
        var reqPath
        for (var i = 0, l = names.length; i < l; i++) {
            reqName = names[i]
            if ((reqName.search(/^[\.]{0,2}\//) + 1)) {
                reqPath = path.resolve(filePath, '../', util.addIndexAndJsExtFromName(reqName))

                //其它匹配包，再根据包路径，解析依赖文件路径 todo:无匹配包时的解析，绝对路径时的解析都还没考虑
            } else {
                var pkgRootName = reqName.match(/[\w\-\_]+/)[0]
                reqPath = path.resolve(util.addIndexAndJsExtFromName(pkgRootName, pkMap[pkgRootName]))
            }
            if (filePath == reqPath) {
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


    function obtainModNameFromAbosulte(filePath) {
        // 模块名
        // window系统 下文件路径 c:\workspace
        var modName = path.relative(path.resolve('./'), filePath).replace(/\\/g, '/')
        var index
        for (var i = 0, len = pkList.length; i < len; i++) {
            index = modName.indexOf(pkList[i]);
            if (index + 1) {
                modName = pkList[i].match(/[\w\-\_]+[\/]{0,1}$/)[0] + modName.slice(index + pkList[i].length)
                break
            }
        }
        if (modName.slice(-3) == '.js') modName = modName.slice(0, -3)
        return modName
    }

    /**
     * 获取依赖的模块名、模块路径，模块名是相对路径时，转换成包名开头的模块名
     * 同一文件内包含多个KISSY模块时，依赖模块的实际路径
     * @param basePath 根路径
     * @param reqName 模块名
     * @returns {*}
     */
    function obtainModInfoFromReq(basePath, reqName) {
        // 根据依赖名解析出文件path
        var reqPath
        // 根据路径解析出的模块名
        var nameFromPath


        // 匹配如： "./mod"、"../mod"，解析出文件路径
        if ((reqName.search(/^[\.]{1,2}\//) + 1)) {
            reqPath = path.resolve(basePath, '../', util.addIndexAndJsExtFromName(reqName))

            //其它匹配包，再根据包路径，解析依赖文件路径 无匹配包时的解析，todo:绝对路径时的解析都还没考虑
        } else {
            var pkgRootName = reqName.match(/[\w\-\_]+/)[0]
            reqPath = path.resolve(util.addIndexAndJsExtFromName(reqName.replace(pkgRootName, pkMap[pkgRootName] || '')))
        }

        nameFromPath = obtainModNameFromAbosulte(reqPath)

        return {
            reqPath: reqPath,
            modName: /^[\w\_]+/.test(reqName) ? reqName : nameFromPath // io node等情况不处理，./和../处理成带包名
        }
    }

    /**
     * 一层层解析文件
     * @param path
     * @param pMod
     */
    function parseFile(path, pMod) {
        if (!fs.existsSync(path)) return

        var fileContent = fs.readFileSync(path)
        var rootNode = managejs.transfer(fileContent)
        var adds = rootNode.find('CallExpression', 'KISSY.add')
        var kissyArea
        var modName
        var mod
        var reqList
        var reqModName
        var reqPath
        var reqMod
        var multipleMods = []

        // 一个文件里有多个kissy模块
        for (var i = 0, len = adds.length; i < len; i++) {
            kissyArea = adds.item(i)

            // 处理情况：if (typeof KISSY != "undefined" && KISSY.add) {
            if (kissyArea[0].astObj.arguments.length <= 1) continue
            modName = kissyArea.get(0).stringify().replace(/\'/g, '')
            // 已经创建过此模块，包括一个文件多模块情况，不可能是其它文件引用多模块文件里的非根模块
            mod = Mod.getModFromName(modName)
            if (!mod) {
                console.log('modName: ' + modName)
                console.log('path: ' + path)
                mod = Mod.create({
                    name: modName,
                    path: path
                })

                reqList = kissyArea.findById('ArrayExpression', 'requires').item(0)

                // 针对KISSY.add("app/index",function(){})
                if (!reqList)    continue

                for (var j = 0, l = reqList[0].astObj.elements.length; j < l; j++) {
                    var rtnObj = obtainModInfoFromReq(path, reqList.get(j).stringify().replace(/\'/g, ''))
                    reqPath = rtnObj.reqPath
                    reqModName = rtnObj.modName
                    mod.add('requires', reqModName)
                    reqMod = Mod.getModFromName(reqModName)

                    if (reqMod) {
                        mod.add('reqRefs', reqMod) // 一个文件里多模块内部关系在这里指定，要依赖的模块写在前面
                    } else if (fs.existsSync(reqPath)) {
                        parseFile(reqPath, mod)
                    } else {
                        multipleMods.push([mod, reqModName])
                    }
                }
            }
            // 只会对名字和文件路径一致的模块进行添加
            // window下文件路径 c:\workspace
            if (path.replace(/\\/g, '/').indexOf(modName) + 1) {
                pMod.add('reqRefs', mod)
            }
        }

        multipleMods.forEach(function (cache) {
            reqMod = Mod.getModFromName(cache[1])
            if (reqMod) {
                cache[0].add('reqRefs', reqMod) // 一个文件里多模块内部关系在这里指定，要依赖的模块写在前面，这里处理依赖没写在前面的顺序
            }
        })
    }


    function transport(file, encoding, callback) {
        // 递归生成kissy模块对象
        parseFile(file.path, rootMod)

        // 替换kissy.add第三个参数
        var fileNode = managejs.transfer(file.contents)
        var adds = fileNode.find('CallExpression', 'KISSY.add')
        var stash = []
        var kissyArea
        var modName
        var mod
        var isNeedChgFile = false
        var requires
        for (var i = 0, len = adds.length; i < len; i++) {
            kissyArea = adds.item(i)
            // 处理情况：if (typeof KISSY != "undefined" && KISSY.add) {
            if (kissyArea[0].astObj.arguments.length <= 1) continue

            modName = kissyArea.get(0).stringify().replace(/\'/g, '')
            //console.log('change mod: ' + modName)
            mod = Mod.getModFromName(modName)

            // 一个文件多模块，只处理其中一个对外模块
            if (!util.nameInPath(modName, file.path))    continue

            console.log('===begin analyze ' + modName + '===')
            // 获取模块的所有依赖
            requires = obtainRequires(mod)

            console.log('=== end  analyze ' + modName + '===')
            console.log()
            console.log()

            // 筛到队列中，后续有需要才执行
            stash.push((function (requires, kissyArea) {
                return function () {
                    kissyArea.spliceParam(2, 1, '{requires:[' + arr2Str(requires) + ']}')
                }
            })(requires, kissyArea))

            // 只要文件内模块有一个深层依赖，标志为需重写
            if (mod.needEdit()) {
                isNeedChgFile = true
            }
        }

        // 文件内的模块有深层依赖其它文件的模块时
        if (isNeedChgFile) {
            stash.forEach(function (item) {
                item()
            })
            file.contents = new Buffer(fileNode.stringify())
        }

        callback(null, file)
    }

    return through.obj(transport);
}
exports.rootMod = rootMod

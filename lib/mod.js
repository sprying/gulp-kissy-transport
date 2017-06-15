var _ = require('lodash')

function Mod(cfg) {
    _.assign(this, {
        name: '',
        content: '',
        path: '',
        reqs: [],
        oriReqs: [],
        reqRefs: [],
        addReqs: [],
        isMain: true, // 模块是否能作为入口模块，被在其它文件里的模块引用
        pkg: null,
        isDepNameChg: false, // 依赖的名字要不要改变
        isAnalyzed: false // 模块是否被分析过深层依赖关系
    }, cfg)
}
Mod.prototype.add = function (type, value) {
    switch (type) {
        case 'reqs':
            this.reqs.push(value)
            break;
        case 'oriReqs':
            this.oriReqs.push(value)
            break;
        case 'reqRefs':
            this.reqRefs.push(value)
            break;
        case 'addReqs':
            this.addReqs = this.addReqs.concat(value)
    }
}
Mod.prototype.needEdit = function () {
    return this.addReqs.length || this.isDepNameChg
}
Mod.mods = {}
Mod.create = function (cfg) {
    return this.mods[cfg.name] = new Mod(cfg)
}
Mod.getModFromName = function (modName) {
    var me = this
    var targetList = [modName]
    var mod
    if (modName.slice(-1) == '/') {
        targetList = targetList.concat(modName.slice(0, -1), modName + 'index', modName + 'index.js')
    } else if (modName.slice(-5) == 'index') {
        targetList = targetList.concat(modName.slice(0, -5), modName.slice(0, -6), modName + '.js')
    } else if (modName.slice(-8) == 'index.js') {
        targetList = targetList.concat(modName.slice(0, -3), modName.slice(0, -8), modName.slice(0, -9))
    }
    _.forEach(targetList, function(tar){
        mod = me.mods[tar]
        if(mod){
            return false
        }
    }, this)
    return mod
}

module.exports = Mod

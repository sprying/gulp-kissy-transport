var extend = require('extend')
function Mod(cfg){
    extend(this,{
        name : '',
        content : '',
        path : '',
        requires : [],
        requireObj : {},
        addedRequires:[]
    },cfg);
}
Mod.prototype.add = function(type,value){
    switch(type){
        case 'requires':
            this.requires.push(value)
            break;
        case 'requireObj':
            this.requireObj[value.get('name')] = value
            break;
        case 'addedRequires':
            this.addedRequires = this.addedRequires.concat(value)
    }
}
Mod.prototype.get = function(type){
    switch(type){
        case 'requires':
            return this.requires
        case 'name':
            return this.name
        case 'isFolder':
            return this.isFolder
        case 'path':
            return this.path

    }
}
Mod.prototype.needEdit = function(){
    return !!this.addedRequires.length
}
Mod.mods = {}
Mod.create = function(cfg){
    return this.mods[cfg.name] = new Mod(cfg)
}
Mod.getModFromName = function(modName){
    var targetList = [modName]
    if (modName.slice(-1) == '/') {
        targetList = targetList.concat(modName.slice(0, -1), modName + 'index', modName + 'index.js')
    } else if (modName.slice(-5) == 'index') {
        targetList = targetList.concat(modName.slice(0, -5), modName.slice(0, -6), modName + '.js')
    } else if (modName.slice(-8) == 'index.js') {
        targetList = targetList.concat(modName.slice(0, -3), modName.slice(0, -8), modName.slice(0, -9))
    }
    return this.mods[modName] || null
}

module.exports=Mod

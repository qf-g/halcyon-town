// 数据管理模块（ES6模块化重构）
const DEFAULT_GAME_DATA = {
    resources: {
        coins: 0,
        reputation: 0,
        wheat: 0,
        wood: 0,
        rope: 0,
        hoe: 0,
        'bow-saw': 0,
        eggs: 0
    },
    unlocked: {
        buildings: [],
        actions: ['gather-wheat', 'chop-wood', 'sell-resources']
    },
    buildings: {},
    npcs: {},
    gameTime: {
        day: 1,
        season: 'spring',
        seasonDay: 1,
        lastTimestamp: Date.now()
    },
    settings: {
        soundEnabled: true,
        notificationsEnabled: true
    },
    quests: {},
    achievements: {}
};

// 全局唯一 gameData
window.gameData = window.gameData || JSON.parse(JSON.stringify(DEFAULT_GAME_DATA));
let gameData = window.gameData;

export async function initialize() {
    // 初始化时尝试加载本地存档
    if (!loadGame()) {
        console.log('[initialize] loadGame 失败，调用 saveGame');
        saveGame();
    }
}

export function saveGame() {
    if (!window.gameData.buildings) window.gameData.buildings = {};
    window.gameData.gameTime.lastTimestamp = Date.now();
    window.gameData.saveTime = Date.now();
    localStorage.setItem('halcyon_town_save', JSON.stringify(window.gameData));
    return true;
}

export function loadGame() {
    const savedData = localStorage.getItem('halcyon_town_save');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            for (const key in window.gameData) {
                if (Object.prototype.hasOwnProperty.call(window.gameData, key)) {
                    delete window.gameData[key];
                }
            }
            Object.assign(window.gameData, parsedData);
            if (!window.gameData.buildings) window.gameData.buildings = {};
            window.gameData.gameTime.lastTimestamp = Date.now();
            return true;
        } catch (e) {
            console.error('存档解析失败', e);
            return false;
        }
    }
    return false;
}

export function resetGame() {
    localStorage.removeItem('halcyon_town_save');
    // 不再替换 gameData 引用，改为保持引用不变
    Object.assign(window.gameData, JSON.parse(JSON.stringify(DEFAULT_GAME_DATA)));
    window.gameData.gameTime.lastTimestamp = Date.now();
    // 重置时给予基础物资
    window.gameData.resources.wheat = 0;
    window.gameData.resources.wood = 0;
    window.gameData.resources.stone = 0;
    window.gameData.resources.villager = 0; // 重置流民数量为0
    window.gameData.assignedVillagers = {}; // 清空所有流民分配
    for (const key in window.gameData.resources) {
        if (!['wheat','wood','stone','coins','reputation','rope','hoe','bow-saw','eggs','villager'].includes(key)) {
            window.gameData.resources[key] = 0;
        }
    }
    window.gameData.unlocked = { buildings: [], actions: ['gather-wheat', 'chop-wood', 'sell-resources'] };
    window.gameData.buildings = {};
    saveGame(); // 重置后立即保存，确保localStorage同步
    // 新增：重置后刷新UI
    setTimeout(() => {
        document.dispatchEvent(new CustomEvent('gameReset'));
    }, 0);
    return true;
}

export function getResource(resourceName) {
    return window.gameData.resources[resourceName] || 0;
}

export function setResource(resourceName, value) {
    window.gameData.resources[resourceName] = parseFloat(value.toFixed(5));
    return window.gameData.resources[resourceName];
}

export function addResource(resourceName, amount) {
    if (!window.gameData.resources[resourceName]) window.gameData.resources[resourceName] = 0;
    window.gameData.resources[resourceName] += amount;
    window.gameData.resources[resourceName] = parseFloat(window.gameData.resources[resourceName].toFixed(5));
    document.dispatchEvent(new CustomEvent('resourceChanged', { detail: { resource: resourceName, value: window.gameData.resources[resourceName] } }));
    // 新增：资源变化后自动检查解锁
    document.dispatchEvent(new CustomEvent('checkAllUnlocks'));
    return window.gameData.resources[resourceName];
}

export function spendResource(resourceName, amount) {
    if (!window.gameData.resources[resourceName]) return false;
    if (window.gameData.resources[resourceName] >= amount) {
        window.gameData.resources[resourceName] -= amount;
        window.gameData.resources[resourceName] = parseFloat(window.gameData.resources[resourceName].toFixed(1));
        document.dispatchEvent(new CustomEvent('resourceChanged', { detail: { resource: resourceName, value: window.gameData.resources[resourceName] } }));
        // 新增：资源变化后自动检查解锁
        document.dispatchEvent(new CustomEvent('checkAllUnlocks'));
        return true;
    }
    return false;
}

export function hasResources(requirements) {
    for (const resource in requirements) {
        if (getResource(resource) < requirements[resource]) return false;
    }
    return true;
}

export function spendResources(requirements) {
    if (!hasResources(requirements)) return false;
    for (const resource in requirements) spendResource(resource, requirements[resource]);
    return true;
}

// 建筑相关统一接口
export function getBuildingCount(buildingId) {
    return window.gameData.buildings && window.gameData.buildings[buildingId] ? window.gameData.buildings[buildingId] : 0;
}

export function setBuildingCount(buildingId, count) {
    if (!window.gameData.buildings) window.gameData.buildings = {};
    window.gameData.buildings[buildingId] = count;
    document.dispatchEvent(new CustomEvent('buildingChanged', { detail: { building: buildingId, value: count } }));
    return count;
}

export function addBuilding(buildingId, amount = 1) {
    if (!window.gameData.buildings) window.gameData.buildings = {};
    if (!window.gameData.buildings[buildingId]) window.gameData.buildings[buildingId] = 0;
    window.gameData.buildings[buildingId] += amount;
    document.dispatchEvent(new CustomEvent('buildingChanged', { detail: { building: buildingId, value: window.gameData.buildings[buildingId] } }));
    // 新增：建筑变化后自动检查解锁
    document.dispatchEvent(new CustomEvent('checkAllUnlocks'));
    return window.gameData.buildings[buildingId];
}

export function isUnlocked(type, id) {
    return window.gameData.unlocked[type] && window.gameData.unlocked[type].includes(id);
}

export function unlock(type, id) {
    if (!window.gameData.unlocked[type]) window.gameData.unlocked[type] = [];
    if (!window.gameData.unlocked[type].includes(id)) {
        window.gameData.unlocked[type].push(id);
        return true;
    }
    return false;
}

export function getCurrentDay() {
    return window.gameData.gameTime.day;
}

export function advanceDay() {
    window.gameData.gameTime.day++;
    window.gameData.gameTime.seasonDay++;
    if (window.gameData.gameTime.seasonDay > 30) {
        window.gameData.gameTime.seasonDay = 1;
        switch(window.gameData.gameTime.season) {
            case 'spring': window.gameData.gameTime.season = 'summer'; break;
            case 'summer': window.gameData.gameTime.season = 'autumn'; break;
            case 'autumn': window.gameData.gameTime.season = 'winter'; break;
            case 'winter': window.gameData.gameTime.season = 'spring'; break;
        }
    }
    // 新增：天数推进后自动检查解锁
    document.dispatchEvent(new CustomEvent('checkAllUnlocks'));
    return {
        day: window.gameData.gameTime.day,
        season: window.gameData.gameTime.season,
        seasonDay: window.gameData.gameTime.seasonDay
    };
}

export function getGameData() {
    // 返回深拷贝，防止外部直接修改
    return JSON.parse(JSON.stringify(window.gameData));
}

function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

// 离线收益计算
export function calculateOfflineProgress() {
    const now = Date.now();
    const lastTimestamp = window.gameData.gameTime.lastTimestamp || now;
    const timePassed = Math.max(0, Math.floor((now - lastTimestamp) / 1000)); // 秒
    const minutesPassed = Math.floor(timePassed / 60);
    const daysPassed = Math.floor(minutesPassed / 1); // 1分钟=1天
    let rewards = {};
    if (daysPassed > 0) {
        // 计算每种建筑的每日产出
        for (const buildingId in window.gameData.buildings) {
            const count = window.gameData.buildings[buildingId] || 0;
            if (count > 0) {
                // 产出配置
                const config = getBuildingConfig(buildingId);
                if (config && config.dailyProduction) {
                    for (const resource in config.dailyProduction) {
                        const total = config.dailyProduction[resource] * count * daysPassed;
                        if (!rewards[resource]) rewards[resource] = 0;
                        rewards[resource] += total;
                    }
                }
            }
        }
    }
    return {
        timePassed: minutesPassed, // 单位：分钟
        daysPassed,
        rewards
    };
}

// 获取建筑配置
function getBuildingConfig(buildingId) {
    // 这里假设 CONFIG 只在 game.js 中定义，需同步一份或重构
    // 为避免循环依赖，这里简单写死
    const configs = {
        'farm-plot': { dailyProduction: { wheat: 3 } },
        'sawmill': { dailyProduction: { wood: 2 } },
        'chicken-coop': { dailyProduction: { eggs: 5 } }
    };
    return configs[buildingId] || null;
}

// 离线奖励应用
export function applyOfflineRewards(offline) {
    if (!offline || !offline.rewards) return;
    for (const resource in offline.rewards) {
        addResource(resource, offline.rewards[resource]);
    }
    window.gameData.gameTime.lastTimestamp = Date.now();
    saveGame();
}

// 流民分配相关
export function getAssignedVillager(facilityId) {
    if (!window.gameData.assignedVillagers) window.gameData.assignedVillagers = {};
    return window.gameData.assignedVillagers[facilityId] || 0;
}
export function setAssignedVillager(facilityId, count) {
    if (!window.gameData.assignedVillagers) window.gameData.assignedVillagers = {};
    window.gameData.assignedVillagers[facilityId] = Math.max(0, count);
    document.dispatchEvent(new CustomEvent('resourceChanged', { detail: { resource: 'villager' } }));
    // 移除自动刷新资源面板，避免点击按钮时触发动画
}
export function getTotalAssignedVillager() {
    if (!window.gameData.assignedVillagers) return 0;
    return Object.values(window.gameData.assignedVillagers).reduce((a, b) => a + b, 0);
}
export function getFreeVillager() {
    const total = window.gameData.resources['villager'] || 0;
    return total - getTotalAssignedVillager();
}

// 预留云端存档接口
export async function saveGameToServer() {
    // TODO: 实现与后端API对接
    return false;
}
export async function loadGameFromServer() {
    // TODO: 实现与后端API对接
    return null;
}
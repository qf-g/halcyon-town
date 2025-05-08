// 游戏逻辑模块（ES6模块化重构）
import { getResource, addResource, spendResource, hasResources, spendResources, unlock, isUnlocked, getGameData, saveGame, loadGame, calculateOfflineProgress, applyOfflineRewards, addBuilding, getBuildingCount } from '../data/data.js';
import { showMessage, refreshAllUI } from '../ui/ui.js';
import { checkAllUnlocks } from './unlocks.js';
import { items } from '../data/items.js';

const CONFIG = {
    gathering: {
        wheat: { minYield: 1, maxYield: 1, chance: 1.0 },
        wood: { minYield: 1, maxYield: 1, chance: 1.0 }
    },
    selling: {
        wheat: 1.5, wood: 2.0, eggs: 3.0, rope: 5.0, hoe: 15.0, 'bow-saw': 20.0
    },
    crafting: {
        'make-rope': { name: '制作麻绳', description: '用小麦纤维和木材制作结实的麻绳', inputs: { wheat: 2, wood: 1 }, output: { resource: 'rope', amount: 1 } },
        'develop-hoe': { name: '研发锄头', description: '用麻绳和木材制作简易锄头，用于开垦农田', inputs: { rope: 3, wood: 10 }, output: { resource: 'hoe', amount: 1 } },
        'develop-bow-saw': { name: '研发弓锯', description: '用麻绳和木材制作锯木工具，用于建造锯木厂', inputs: { rope: 2, wood: 8 }, output: { resource: 'bow-saw', amount: 1 } }
    },
    buildings: {
        'farm-plot': { name: '农田', description: '开垦的农田，可自动产出小麦。', cost: { hoe: 1, wood: 10 }, dailyProduction: { wheat: 3 } },
        'sawmill': { name: '锯木厂', description: '可自动加工木材的设施。', cost: { 'bow-saw': 1, wood: 5 }, dailyProduction: { wood: 2 } },
        'chicken-coop': { name: '鸡舍', description: '养鸡的地方，每天产出鸡蛋。', cost: { wood: 50, coins: 200 }, dailyProduction: { eggs: 5 } }
    },
    dailyEventChance: 0.3
};

export function initialize() {
    // 离线收益（不再重复 loadGame）
    const offline = calculateOfflineProgress();
    if (offline && (offline.daysPassed > 0 || Object.values(offline.rewards).some(v => v > 0))) {
        applyOfflineRewards(offline);
        let msg = `你离开了 ${Math.floor(offline.timePassed / 60)} 小时 ${Math.floor(offline.timePassed % 60)} 分钟。`;
        if (offline.daysPassed > 0) msg += `\n过去了 ${offline.daysPassed} 天。`;
        for (const [resource, amount] of Object.entries(offline.rewards)) {
            if (amount > 0) msg += `\n获得了 ${amount.toFixed(1)} 个${resource}`;
        }
        showMessage(msg, 'event');
    }
    refreshAllUI();
}

export function handleAction(actionId) {
    // 只处理 items.js 的 action，彻底去除所有硬编码分支
    const item = items.find(i => i.type === 'action' && i.id === actionId);
    if (item) {
        return handleGenericAction(actionId);
    }
}

// 通用 action 处理
export function handleGenericAction(actionId) {
    const item = items.find(i => i.type === 'action' && i.id === actionId);
    if (!item) return;
    let cost = item.cost || {};
    const produce = item.produce || {};
    // 检查是否为建造类操作，自动用目标建筑buildCost
    if (/^build-/.test(item.id) && item.produce) {
        const targetId = Object.keys(item.produce)[0];
        const target = items.find(i => i.id === targetId && (i.type === 'building' || i.type === 'facility'));
        if (target && target.buildCost) {
            cost = target.buildCost;
        }
    }
    if (!hasResources(cost)) {
        showMessage('资源不足，无法执行操作', 'warning');
        return;
    }
    spendResources(cost);
    // 产出资源或建筑
    for (const key in produce) {
        if (key === 'populationMax') continue; // 人口上限特殊处理
        // 支持 building 和 facility 都能增加建筑数量
        if (items.find(i => (i.type === 'building' || i.type === 'facility') && i.id === key)) {
            addBuilding(key, produce[key]);
        } else {
            addResource(key, produce[key]);
        }
    }
    showMessage(`操作成功，获得：${Object.entries(produce).map(([k,v])=>`${v} ${k}`).join('，')}`,'success');
    checkAllUnlocks();
    saveGame();
    refreshAllUI();
}

export function gatherResource(resourceType) {
    const config = CONFIG.gathering[resourceType];
    if (!config) return;
    if (Math.random() <= config.chance) {
        const amount = Math.floor(Math.random() * (config.maxYield - config.minYield + 1)) + config.minYield;
        addResource(resourceType, amount);
        showMessage(`获得${amount}个${resourceType}`, 'success');
        checkAllUnlocks();
        saveGame();
        refreshAllUI();
    }
}

export function craftItem(recipeId) {
    const recipe = CONFIG.crafting[recipeId];
    if (!recipe) return;
    if (hasResources(recipe.inputs)) {
        spendResources(recipe.inputs);
        addResource(recipe.output.resource, recipe.output.amount);
        showMessage(`获得${recipe.output.amount}个${recipe.output.resource}`, 'success');
        checkAllUnlocks();
        saveGame();
        refreshAllUI();
    }
}

export function buildStructure(buildingId) {
    const building = CONFIG.buildings[buildingId];
    if (!building) return;
    if (hasResources(building.cost)) {
        spendResources(building.cost);
        addBuilding(buildingId, 1);
        unlock('buildings', buildingId);
        showMessage(`建造${building.name}成功`, 'success');
        checkAllUnlocks();
        saveGame();
        refreshAllUI();
    }
}

export function getGameConfig() {
    return CONFIG;
}
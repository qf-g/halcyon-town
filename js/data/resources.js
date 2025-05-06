// 资源管理模块（ES6模块化重构）
import { items } from './items.js';
import { isUnlocked, getResource, getGameData, spendResource, addResource, saveGame } from './data.js';

function getAllResourceItems() {
    return items.filter(i => i.type === 'resource');
}

export function getAllResources() {
    // 返回 {id: config, ...}
    const result = {};
    getAllResourceItems().forEach(item => {
        result[item.id] = item;
    });
    return result;
}

export function getResourceConfig(resourceId) {
    return getAllResourceItems().find(i => i.id === resourceId) || null;
}

export function getResourceName(resourceId) {
    const config = getResourceConfig(resourceId);
    return config ? config.name : resourceId;
}

export function getResourceIcon(resourceId) {
    const config = getResourceConfig(resourceId);
    return config ? config.icon : '📦';
}

export function getResourceSellPrice(resourceId) {
    const config = getResourceConfig(resourceId);
    return config && config.sellPrice ? config.sellPrice : 1.0;
}

export function isResourceUnlocked(resourceId) {
    const config = getResourceConfig(resourceId);
    if (!config) return false;
    if (config.isMainResource) return true;
    if (config.craftable) return true;
    if (config.requiredBuilding) {
        // 需要建筑解锁
        return isUnlocked('buildings', config.requiredBuilding);
    }
    // 默认只要获得过就显示
    return getResource(resourceId) > 0;
}

export function getUnlockedResources() {
    const allResources = getAllResources();
    const unlockedResources = {};
    for (const [resourceId, config] of Object.entries(allResources)) {
        if (isResourceUnlocked(resourceId)) {
            unlockedResources[resourceId] = config;
        }
    }
    return unlockedResources;
}

export function calculateTotalResourceValue() {
    const resources = getGameData().resources;
    let totalValue = resources.coins || 0;
    for (const [resourceId, amount] of Object.entries(resources)) {
        if (resourceId !== 'coins' && resourceId !== 'reputation') {
            const sellPrice = getResourceSellPrice(resourceId);
            totalValue += amount * sellPrice;
        }
    }
    return totalValue;
}

export function sellResource(resourceId, amount) {
    const price = getResourceSellPrice(resourceId);
    const totalValue = price * amount;
    if (spendResource(resourceId, amount)) {
        addResource('coins', totalValue);
        saveGame();
        return { success: true, amount, totalValue };
    }
    return { success: false };
}

export function initialize() {
    // 资源模块初始化（如有需要可扩展）
}
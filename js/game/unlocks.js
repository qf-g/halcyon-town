// 解锁机制模块（ES6模块化重构）
import { isUnlocked, unlock, getCurrentDay, getResource, getBuildingCount } from '../data/data.js';
import { items } from '../data/items.js';

function checkRequirements(requirements) {
    if (!requirements) return true;
    if (requirements.day && getCurrentDay() < requirements.day) return false;
    if (requirements.resources) {
        for (const [resource, amount] of Object.entries(requirements.resources)) {
            if (getResource(resource) < amount) return false;
        }
    }
    if (requirements.buildings) {
        for (const building of requirements.buildings) {
            if (getBuildingCount(building) <= 0) return false;
        }
    }
    return true;
}

export function checkAllUnlocks() {
    let changed = false;
    // 动态解锁所有 action/building
    items.forEach(item => {
        if (item.type === 'action') {
            if (!isUnlocked('actions', item.id) && checkRequirements(item.requirements)) {
                unlock('actions', item.id);
                changed = true;
            }
        } else if (item.type === 'building') {
            if (!isUnlocked('buildings', item.id) && checkRequirements(item.requirements)) {
                unlock('buildings', item.id);
                changed = true;
            }
        }
    });
    if (changed) {
        document.dispatchEvent(new CustomEvent('contentUnlocked'));
    }
}

export function initialize() {
    document.addEventListener('newDay', checkAllUnlocks);
    document.addEventListener('resourceChanged', checkAllUnlocks);
    document.addEventListener('contentUnlocked', checkAllUnlocks);
    document.addEventListener('checkAllUnlocks', checkAllUnlocks);
}
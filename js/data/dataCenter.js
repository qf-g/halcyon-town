// 数据计算中心，负责全局数据统计与业务逻辑，UI只负责调用
import { items } from './items.js';
import { getResource, getBuildingCount, isUnlocked, getAssignedVillager } from './data.js';
import { isResourceUnlocked } from './resources.js';

// 获取应显示的所有基础物资
export function getDisplayResources() {
    // 显示所有资源条目（不管解锁与否、数量是否为零）
    return items.filter(i => i.type === 'resource');
}
// 获取应显示的所有工具
export function getDisplayTools() {
    // 显示所有工具条目（不管解锁与否、数量是否为零）
    return items.filter(i => i.type === 'tool');
}
// 获取应显示的所有建筑
export function getDisplayBuildings() {
    // 显示所有建筑和设施条目（不管解锁与否、数量是否为零）
    return items.filter(i => i.type === 'building' || i.type === 'facility');
}
// 获取所有资源的自动产量（建筑/设施）
export function getAutoProduction() {
    const result = {};
    getDisplayBuildings().forEach(b => {
        const count = getBuildingCount(b.id);
        const assigned = getAssignedVillager(b.id);
        const prod = b.dailyProduction || b.autoYield;
        const actual = Math.min(count, assigned || 0);
        if (prod && actual > 0) {
            for (const [rid, num] of Object.entries(prod)) {
                if (!result[rid]) result[rid] = 0;
                result[rid] += num * actual;
            }
        }
    });
    return result;
}
// 获取资源/工具/建筑的详细信息（供UI悬浮提示）
export function getItemDetail(id) {
    return items.find(i => i.id === id);
}

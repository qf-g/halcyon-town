import { getDisplayResources, getDisplayTools, getDisplayBuildings, getAutoProduction } from './dataCenter.js';
import { items } from './items.js';
import { getBuildingCount, getResource, getFreeVillager, getTotalAssignedVillager, getAssignedVillager } from './data.js';
import { formatNumber } from '../ui/ui.js';

// 资源条目结构化输出，包含产量、图标、名称、数量、悬浮提示
export function getDisplayResourceList(assignedMap = null) {
    const autoProduction = getAutoProduction();
    // 获取当前建筑和分配流民信息
    const buildingMap = {};
    const _assignedMap = assignedMap || {};
    items.forEach(i => {
        if (i.type === 'building' || i.type === 'facility') {
            buildingMap[i.id] = getBuildingCount(i.id) || 0;
            if (!(_assignedMap[i.id] >= 0)) _assignedMap[i.id] = getAssignedVillager(i.id) || 0;
        }
    });
    return getDisplayResources().map(i => {
        // 保证amount为数字（流民特殊处理）
        let amount = i.amount;
        if (typeof amount === 'string' && i.id !== 'villager') {
            amount = getResource(i.id);
        }
        return {
            id: i.id,
            name: i.name,
            icon: i.icon,
            amount: amount,
            production: autoProduction[i.id] || 0,
            description: i.description,
            tooltip: getResourceTooltip(i, autoProduction[i.id] || 0, buildingMap, _assignedMap)
        };
    });
}

export function getDisplayToolList(assignedMap = null) {
    // 工具暂不需要 assignedMap，但为一致性保留参数
    return getDisplayTools().map(i => ({
        id: i.id,
        name: i.name,
        icon: i.icon,
        amount: i.amount,
        description: i.description,
        tooltip: getToolTooltip(i)
    }));
}

// 新增：产出物资分区
export function getDisplayProductList(assignedMap = null) {
    const autoProduction = getAutoProduction();
    const buildingMap = {};
    const _assignedMap = assignedMap || {};
    items.forEach(i => {
        if (i.type === 'building' || i.type === 'facility') {
            buildingMap[i.id] = getBuildingCount(i.id) || 0;
            if (!(_assignedMap[i.id] >= 0)) _assignedMap[i.id] = getAssignedVillager(i.id) || 0;
        }
    });
    return items.filter(i => i.type === 'product').map(i => {
        let amount = i.amount;
        if (typeof amount === 'string') {
            amount = getResource(i.id);
        }
        return {
            id: i.id,
            name: i.name,
            icon: i.icon,
            amount: amount,
            production: autoProduction[i.id] || 0,
            description: i.description,
            tooltip: getResourceTooltip(i, autoProduction[i.id] || 0, buildingMap, _assignedMap)
        };
    });
}

export function getDisplayBuildingList(assignedMap = null) {
    const autoProduction = getAutoProduction();
    return getDisplayBuildings().map(i => {
        const count = getBuildingCount(i.id);
        const assigned = assignedMap ? (assignedMap[i.id] || 0) : getAssignedVillager(i.id);
        return {
            id: i.id,
            name: i.name,
            icon: i.icon,
            count,
            assignedVillager: assigned,
            description: i.description,
            production: i.production,
            tooltip: getBuildingTooltip(i, autoProduction, assigned, count)
        };
    });
}

function getResourceTooltip(item, prod, buildingMap = {}, assignedMap = {}) {
    let content = `<div style='font-weight:bold;'>${item.icon || ''} ${item.name}</div>` +
        `<div style='color:#fff;'>${item.description || ''}</div>` +
        `<div style='color:#b2ffb2;'>当前：${formatNumber(item.amount)}</div>`;
    if (prod) {
        content += `<div style='color:#ffe082;'>自动产量：${formatNumber(prod)}/天</div>`;
    }
    // 新增：产量来源，实时显示分配流民数（无论 assigned 是否为0 都显示）
    const buildings = items.filter(i => (i.type === 'building' || i.type === 'facility') && (i.dailyProduction || i.autoYield));
    let sources = [];
    buildings.forEach(b => {
        const bProd = b.dailyProduction || b.autoYield;
        if (bProd && bProd[item.id]) {
            const count = buildingMap[b.id] || 0;
            const assigned = assignedMap[b.id] || 0;
            if (count > 0) {
                sources.push(`<span style='display:inline-block; min-width:56px; text-align:right;'>${b.icon || ''}${b.name} ＋${formatNumber(bProd[item.id])} × <b>${assigned}</b></span>`);
            }
        }
    });
    if (sources.length > 0) {
        content += `<div style='color:#ffe082; font-size:0.98em;'>产量来源：${sources.join('，')}</div>`;
    }
    return content;
}

function getToolTooltip(item) {
    return `<div style='font-weight:bold;'>${item.icon || ''} ${item.name}</div>` +
        `<div style='color:#fff;'>${item.description || ''}</div>` +
        `<div style='color:#b2ffb2;'>当前：${formatNumber(item.amount)}</div>`;
}

function getBuildingTooltip(item, autoProduction, assigned, count) {
    let prodStr = '';
    if (item.production) {
        prodStr = Object.entries(item.production).map(([rid, num]) => {
            const conf = items.find(i => i.id === rid);
            return `${conf ? conf.icon : ''}${conf ? conf.name : rid} ×${formatNumber(num)}/天`;
        }).join('，');
    }
    return `<div style='font-weight:bold;'>${item.icon || ''} ${item.name}</div>` +
        `<div style='color:#fff;'>${item.description || ''}</div>` +
        `<div style='color:#b2ffb2;'>数量：${formatNumber(count)}</div>` +
        `<div style='color:#b2e0ff;'>分配流民：${assigned || 0}/${count}</div>` +
        (prodStr ? `<div style='color:#ffe082;'>产出：${prodStr}</div>` : '');
}

// 返回资源面板完整结构化数据，UI 只遍历渲染
export function getFullDisplayResourcePanelData(assignedMap = null) {
    // 左列：基础物资+工具+产出物资
    const resourceList = getDisplayResourceList(assignedMap); // 保证传递 assignedMap
    const toolList = getDisplayToolList(assignedMap); // 保证传递 assignedMap
    const productList = getDisplayProductList(assignedMap); // 保证传递 assignedMap
    // 右列：建筑+流民
    const buildingList = getDisplayBuildingList(assignedMap);
    // 流民特殊处理，插入到建筑列表最前面
    const villagerItem = items.find(i => i.id === 'villager' && i.type === 'population');
    let rightSections = [];
    if (villagerItem) {
        const total = getResource('villager') || 0;
        const free = getFreeVillager();
        const assigned = getTotalAssignedVillager();
        const villagerDisplay = {
            id: villagerItem.id,
            name: villagerItem.name,
            icon: villagerItem.icon,
            count: total,
            assignedVillager: assigned,
            description: villagerItem.description,
            tooltip: `<div style='font-weight:bold;'>${villagerItem.icon} ${villagerItem.name}</div><div style='color:#fff;'>${villagerItem.description}</div><div style='color:#b2ffb2;'>总数：${total}，空闲：${free}，已分配：${assigned}</div><div style='color:#b2e0ff;'>分配情况：空闲${free}，已分配${assigned}</div>`
        };
        rightSections = [
            { title: '建筑', items: [villagerDisplay, ...buildingList] }
        ];
    } else {
        rightSections = [
            { title: '建筑', items: buildingList }
        ];
    }
    return {
        left: [
            { title: '基础物资', items: resourceList },
            { title: '工具', items: toolList },
            { title: '产出物资', items: productList }
        ],
        right: rightSections
    };
}

// 通用悬浮提示内容生成（支持资源、工具、建筑、操作按钮）
// 新增 resourceMap/buildingMap 参数，UI 层传递实时数据
export function getTooltipContent(id, { resourceMap = {}, buildingMap = {}, assignedMap = {} } = {}) {
    const item = items.find(i => i.id === id);
    if (!item) return '';
    // 针对流民条目，显示分配到各建筑的详细情况
    if (item.id === 'villager' && item.type === 'population') {
        const total = resourceMap['villager'] || 0;
        const free = total - Object.values(assignedMap).reduce((a, b) => a + b, 0);
        let content = `<div style="font-weight:bold; font-size:1.08em;">${item.icon || ''} ${item.name}</div>`;
        content += `<div style='color:#888; font-size:0.96em; margin-bottom:3px; text-align:left;'>${item.description || ''}</div>`;
        content += `<div style='color:#b2ffb2;'>总数：${total}，空闲：${free}，已分配：${total - free}</div>`;
        // 分配到各建筑明细
        const buildingList = items.filter(i => (i.type === 'building' || i.type === 'facility'));
        let assignDetails = buildingList.map(b => {
            const assigned = assignedMap[b.id] || 0;
            if (assigned > 0) {
                return `<div style='color:#4fa3e3; font-size:0.98em; text-align:left;'>${b.icon || ''}${b.name}：<span style='float:right;'>${assigned}</span></div>`;
            }
            return '';
        }).filter(Boolean);
        if (assignDetails.length > 0) {
            content += `<div style='color:#b2e0ff; font-size:0.98em; text-align:left; margin-top:4px;'>分配明细：<br>${assignDetails.join('')}</div>`;
        } else {
            content += `<div style='color:#b2e0ff; font-size:0.98em; text-align:left; margin-top:4px;'>当前没有分配到任何建筑。</div>`;
        }
        return `<div style='overflow:hidden; min-width:220px; max-width:320px;'>${content}</div>`;
    }
    let content = `<div style="font-weight:bold; font-size:1.08em;">${item.icon || ''} ${item.name}</div>`;
    content += `<div style='color:#888; font-size:0.96em; margin-bottom:3px; text-align:left;'>${item.description || ''}</div>`;
    // 1. 获得内容
    if (item.type === 'action' && item.produce && Object.keys(item.produce).length > 0) {
        content += `<div style='color:#b2ffb2; font-size:0.98em; text-align:left;'>获得：`;
        content += Object.entries(item.produce).map(([rid, num]) => {
            const conf = items.find(i => i.id === rid);
            return `<span style='display:inline-block; min-width:56px; text-align:left;'>${conf ? conf.icon : ''}${conf ? conf.name : rid}</span><span style='float:right; min-width:56px; text-align:right;'>×${formatNumber(num)}</span>`;
        }).join('<br>');
        content += `</div>`;
    }
    // 2. 自动产量和产量来源
    if (item.type === 'resource') {
        // 自动产量
        const autoProduction = getAutoProduction();
        const prod = autoProduction[item.id] || 0;
        content += `<div style='color:#ffe082; text-align:left;'>自动产量：<span style='float:right; min-width:56px; text-align:right;'>${prod ? (prod > 0 ? '+' : '') + formatNumber(prod) : '0'}/天</span></div>`;
        // 产量来源
        const buildings = items.filter(i => (i.type === 'building' || i.type === 'facility') && (i.dailyProduction || i.autoYield));
        let sources = [];
        buildings.forEach(b => {
            const bProd = b.dailyProduction || b.autoYield;
            if (bProd && bProd[item.id]) {
                const count = buildingMap[b.id] || 0;
                const assigned = assignedMap[b.id] || 0;
                if (count > 0) {
                    sources.push(`<span style='display:inline-block; min-width:56px; text-align:left;'>${b.icon || ''}${b.name}</span><span style='float:right; min-width:56px; text-align:right;'>＋${formatNumber(bProd[item.id])} × <b>${assigned}</b></span>`);
                }
            }
        });
        if (sources.length > 0) {
            content += `<div style='color:#ffe082; font-size:0.98em; text-align:left;'>产量来源：<br>${sources.join('<br>')}</div>`;
        }
    }
    if (item.type === 'building' || item.type === 'facility') {
        // 自动产量
        const prod = item.dailyProduction || item.autoYield;
        const assigned = (assignedMap && assignedMap[item.id]) || 0;
        const count = (buildingMap && buildingMap[item.id]) || 0;
        if (prod) {
            content += `<div style='color:#ffe082; font-size:0.98em; text-align:left;'>产量：`;
            content += Object.entries(prod).map(([rid, num]) => {
                const conf = items.find(i => i.id === rid);
                const actual = assigned * num;
                return `<span style='display:inline-block; min-width:56px; text-align:left;'>${conf ? conf.icon : ''}${conf ? conf.name : rid}</span><span style='float:right; min-width:56px; text-align:right;'>＋${formatNumber(num)} × ${assigned} = <b>${formatNumber(actual)}</b>/天</span>`;
            }).join('<br>');
            content += `</div>`;
        }
        // 分配流民
        content += `<div style='color:#4fa3e3; font-size:1em; text-align:left;'>已分配流民：<span style='float:right; min-width:56px; text-align:right;'>${assigned}/${count}</span></div>`;
    }
    // 3. 需要
    if (item.type === 'action') {
        let costObj = item.cost || {};
        if (/^build-/.test(item.id) && item.produce) {
            const targetId = Object.keys(item.produce)[0];
            const target = items.find(i => i.id === targetId && (i.type === 'building' || i.type === 'facility'));
            if (target && target.buildCost) {
                costObj = target.buildCost;
            }
        }
        if (costObj && Object.keys(costObj).length > 0) {
            let costStr = Object.entries(costObj).map(([rid, num]) => {
                const conf = items.find(i => i.id === rid);
                let cur = 0;
                if (conf) {
                    if (conf.type === 'resource' || conf.type === 'tool') cur = resourceMap[rid] || 0;
                    else if (conf.type === 'building' || conf.type === 'facility') cur = buildingMap[rid] || 0;
                }
                let enough = cur >= num;
                return `<div style='${enough ? "color:#b2ffb2;" : "color:#ffb2b2;"} font-size:0.95em; text-shadow:0 1px 2px #222; margin-bottom:1px; display:flex; justify-content:space-between;'><span style='text-align:left;'>${conf ? conf.icon : ''}${conf ? conf.name : rid}</span><span style='min-width:56px; text-align:right; display:inline-block;'>${formatNumber(cur)}/${formatNumber(num)}</span></div>`;
            }).join('');
            content += `<div style='color:#ffe082; font-size:0.96em; text-align:left;'>需要：${costStr}</div>`;
        }
    }
    // 4. 当前数量
    if (item.type === 'resource' || item.type === 'tool') {
        let amount = resourceMap[item.id] || 0;
        content += `<div style='color:#b2ffb2; text-align:left;'>当前：<span style='float:right; min-width:56px; text-align:right;'>${formatNumber(amount)}</span></div>`;
    }
    if (item.type === 'building' || item.type === 'facility') {
        let count = (buildingMap && buildingMap[item.id]) || 0;
        content += `<div style='color:#b2ffb2; text-align:left;'>数量：<span style='float:right; min-width:56px; text-align:right;'>${formatNumber(count)}</span></div>`;
    }
    return `<div style='overflow:hidden; min-width:220px; max-width:320px;'>${content}</div>`;
}

// 悬浮提示窗管理模块
import { items } from '../data/items.js';
import { getFullDisplayResourcePanelData, getTooltipContent as getTooltipContentFromDisplayData } from '../data/displayData.js';

// 缓存变量
let lastTooltipId = null;
let lastTooltipContent = '';
let lastTooltipDataKey = '';
let tooltipEventBound = false;

function getCurrentResourceAndBuildingMap() {
    const resourceMap = {};
    const buildingMap = {};
    const assignedMap = {};
    for (const i of items) {
        if (i.type === 'resource' || i.type === 'tool') resourceMap[i.id] = window.gameData?.resources?.[i.id] || 0;
        if (i.type === 'building' || i.type === 'facility') {
            buildingMap[i.id] = window.gameData?.buildings?.[i.id] || 0;
            assignedMap[i.id] = window.gameData?.assignedVillagers?.[i.id] || 0;
        }
    }
    return { resourceMap, buildingMap, assignedMap };
}

function getTooltipDataKey(id, resourceMap, buildingMap) {
    return id + '|' + JSON.stringify(resourceMap) + '|' + JSON.stringify(buildingMap);
}

function refreshTooltipIfNeeded(force = false, changedId = null) {
    const tooltip = document.getElementById('button-tooltip');
    if (!tooltip) return '';
    const id = lastTooltipId;
    if (!id) return '';
    
    if (changedId && id !== changedId) {
        const { resourceMap, buildingMap } = getCurrentResourceAndBuildingMap();
        const item = items.find(i => i.id === id);
        if (item && (item.type === 'resource' || item.type === 'tool')) {
            const buildings = items.filter(i => (i.type === 'building' || i.type === 'facility') && (i.dailyProduction || i.autoYield));
            let related = false;
            buildings.forEach(b => {
                const prod = b.dailyProduction || b.autoYield;
                if (prod && prod[id] && b.id === changedId) related = true;
            });
            if (!related && id !== changedId) return '';
        } else if (item && (item.type === 'building' || item.type === 'facility')) {
            if (id !== changedId) return '';
        }
    }
    
    const { resourceMap, buildingMap, assignedMap } = getCurrentResourceAndBuildingMap();
    const dataKey = getTooltipDataKey(id, resourceMap, buildingMap) + '|' + JSON.stringify(assignedMap);
    if (dataKey !== lastTooltipDataKey || force) {
        lastTooltipContent = getTooltipContentFromDisplayData(id, { resourceMap, buildingMap, assignedMap });
        lastTooltipDataKey = dataKey;
    }
    
    // 返回内容而不是直接修改DOM
    return lastTooltipContent;
}

function onResourceChanged(e) {
    const changedId = e.detail?.resource;
    refreshTooltipIfNeeded(false, changedId);
}
function onBuildingChanged(e) {
    const changedId = e.detail?.building;
    refreshTooltipIfNeeded(false, changedId);
}

function showTooltip(e) {
    const target = e.currentTarget;
    const id = target.id || target.dataset.resource || target.dataset.building;
    if (!id) return;
    
    // 立即更新ID，避免使用旧数据
    lastTooltipId = id;
    lastTooltipContent = '';
    lastTooltipDataKey = '';
    
    let tooltip = document.getElementById('button-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'button-tooltip';
        tooltip.className = 'button-tooltip';
        document.body.appendChild(tooltip);
    }
    
    // 获取目标元素位置
    const rect = target.getBoundingClientRect();
    
    // 先隐藏tooltip并移除方向类
    tooltip.classList.remove('visible');
    tooltip.classList.remove('flipped');
    
    // 获取最新的内容 - 即使tooltip不可见也要更新内容
    const { resourceMap, buildingMap, assignedMap } = getCurrentResourceAndBuildingMap();
    const tooltipContent = getTooltipContentFromDisplayData(id, { resourceMap, buildingMap, assignedMap });
    tooltip.innerHTML = tooltipContent;
    lastTooltipContent = tooltipContent;
    lastTooltipDataKey = getTooltipDataKey(id, resourceMap, buildingMap) + '|' + JSON.stringify(assignedMap);
    
    // 临时设置位置以计算尺寸
    tooltip.style.visibility = 'hidden';
    tooltip.style.display = 'block';
    
    // 计算尺寸
    const tooltipHeight = tooltip.offsetHeight || 0;
    const tooltipWidth = tooltip.offsetWidth || 0;
    
    // 计算可用空间
    const spaceAbove = rect.top;
    const needFlip = (spaceAbove - tooltipHeight - 10) < 0;
    
    // 根据是否需要翻转设置位置和样式
    if (needFlip) {
        // 向下弹出
        tooltip.classList.add('flipped');
        tooltip.style.top = (rect.bottom + 10 + window.scrollY) + 'px';
    } else {
        // 向上弹出
        tooltip.style.top = (rect.top - 10 + window.scrollY) + 'px';
    }
    
    // 处理水平方向上可能超出的情况
    const leftOffset = rect.left + rect.width / 2;
    let finalLeft = leftOffset;
    
    // 防止超出左边
    if (finalLeft - tooltipWidth/2 < 10) {
        finalLeft = tooltipWidth/2 + 10;
    }
    
    // 防止超出右边
    if (finalLeft + tooltipWidth/2 > window.innerWidth - 10) {
        finalLeft = window.innerWidth - tooltipWidth/2 - 10;
    }
    
    tooltip.style.left = finalLeft + 'px';
    tooltip.style.visibility = '';
    
    // 最后才显示tooltip
    tooltip.classList.add('visible');
    
    // 绑定资源变化事件
    if (!tooltipEventBound) {
        document.addEventListener('resourceChanged', onResourceChanged);
        document.addEventListener('buildingChanged', onBuildingChanged);
        tooltipEventBound = true;
    }
}

export function hideButtonTooltip() {
    const tooltip = document.getElementById('button-tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
    lastTooltipId = null;
    lastTooltipContent = '';
    lastTooltipDataKey = '';
    if (tooltipEventBound) {
        document.removeEventListener('resourceChanged', onResourceChanged);
        document.removeEventListener('buildingChanged', onBuildingChanged);
        tooltipEventBound = false;
    }
}

export function bindTooltipEvents() {
    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(btn => {
        btn.removeEventListener('mouseenter', showTooltip);
        btn.removeEventListener('mouseleave', hideButtonTooltip);
        btn.removeEventListener('mousemove', updateTooltipOnMove);
        btn.addEventListener('mouseenter', showTooltip);
        btn.addEventListener('mouseleave', hideButtonTooltip);
        btn.addEventListener('mousemove', updateTooltipOnMove);
    });
    const resourceItems = document.querySelectorAll('.resource-item, .resource-item.building-item');
    resourceItems.forEach(item => {
        item.removeEventListener('mouseenter', showTooltip);
        item.removeEventListener('mouseleave', hideButtonTooltip);
        item.removeEventListener('mousemove', updateTooltipOnMove);
        item.addEventListener('mouseenter', showTooltip);
        item.addEventListener('mouseleave', hideButtonTooltip);
        item.addEventListener('mousemove', updateTooltipOnMove);
    });
}

// 新增函数: 在鼠标移动时即时更新tooltip内容
function updateTooltipOnMove() {
    // 使用节流函数防止过于频繁更新
    if (!this._throttleTimer) {
        this._throttleTimer = setTimeout(() => {
            updateAllTooltips(true);
            this._throttleTimer = null;
        }, 100);
    }
}

export function updateAllTooltips(force = false) {
    const tooltip = document.getElementById('button-tooltip');
    if (tooltip && tooltip.classList.contains('visible')) {
        // 优先检测当前真实悬停的元素
        const hovered = document.querySelector('.action-button:hover, .resource-item:hover, .resource-item.building-item:hover');
        if (hovered || force) {
            const id = hovered?.id || hovered?.dataset.resource || hovered?.dataset.building || lastTooltipId;
            if (id && id !== lastTooltipId) {
                // 如果ID发生变化，强制更新内容
                lastTooltipId = id;
                lastTooltipContent = '';
                lastTooltipDataKey = '';
                force = true;
            }
            
            if (id) {
                const { resourceMap, buildingMap, assignedMap } = getCurrentResourceAndBuildingMap();
                const dataKey = getTooltipDataKey(id, resourceMap, buildingMap) + '|' + JSON.stringify(assignedMap);
                if (dataKey !== lastTooltipDataKey || force) {
                    lastTooltipContent = getTooltipContentFromDisplayData(id, { resourceMap, buildingMap, assignedMap });
                    lastTooltipDataKey = dataKey;
                    tooltip.innerHTML = lastTooltipContent;
                }
            }
        }
    }
}

export { getTooltipContentFromDisplayData as getTooltipContent };

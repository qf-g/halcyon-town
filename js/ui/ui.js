// 游戏UI管理模块（ES6模块化重构）
import { getGameData, getResource, getBuildingCount, isUnlocked, resetGame, loadGame, saveGame } from '../data/data.js';
import { getResourceName, getResourceIcon, getResourceConfig, getUnlockedResources, getResourceSellPrice } from '../data/resources.js';
import { getGameConfig } from '../game/game.js';
import { exportSave, importSave, resetAndBackup } from '../data/saveManager.js';

// UI相关元素引用
let elements = {
    messageArea: null,
    feedbackArea: null,
    resourcesContainer: null,
    actionButtons: null,
    modal: null
};

// 启动高频刷新基础物资显示
let fastResourceInterval = null;
const autoProdBuffer = {};
export function startFastResourceUpdate() {
    if (fastResourceInterval) clearInterval(fastResourceInterval);
    fastResourceInterval = setInterval(async () => {
        // 统计所有建筑的自动产量
        const { items } = await import('../data/items.js');
        const { getBuildingCount, addResource, getResource } = await import('../data/data.js');
        const autoProduction = {};
        items.filter(i => i.type === 'building').forEach(building => {
            const count = getBuildingCount(building.id);
            if (count > 0 && building.dailyProduction) {
                for (const [rid, num] of Object.entries(building.dailyProduction)) {
                    if (!autoProduction[rid]) autoProduction[rid] = 0;
                    autoProduction[rid] += num * count;
                }
            }
        });
        // 游戏一天=60秒（main.js定时advanceDay），所以1天=60秒=600次tick
        // 每0.1秒tick一次
        for (const [rid, daily] of Object.entries(autoProduction)) {
            const perTick = daily / 600; // 600 tick/天
            if (!autoProdBuffer[rid]) autoProdBuffer[rid] = 0;
            autoProdBuffer[rid] += perTick;
            if (autoProdBuffer[rid] >= 0.01) {
                // 只加整数部分，保留小数部分
                const addVal = Math.floor(autoProdBuffer[rid] * 100) / 100;
                addResource(rid, addVal);
                autoProdBuffer[rid] -= addVal;
            }
        }
        // UI刷新
        updateResourceValue('coins', getResource('coins'));
        updateResourceValue('reputation', getResource('reputation'));
        const resources = document.querySelectorAll('.resource-item:not(.building-item)');
        resources.forEach(item => {
            const rid = item.dataset.resource;
            if (rid) {
                const amount = getResource(rid);
                const amountSpan = item.querySelector('.resource-amount');
                if (amountSpan) amountSpan.textContent = Number(amount).toFixed(1);
            }
        });
    }, 100); // 0.1秒刷新
}

export function initialize() {
    elements.messageArea = document.getElementById('message-area');
    elements.feedbackArea = document.getElementById('feedback-area');
    elements.resourcesContainer = document.getElementById('resources-container');
    elements.actionButtons = document.getElementById('action-buttons');
    elements.modal = document.getElementById('modal');
    refreshAllUI();
    startFastResourceUpdate();
    bindSettingsButton();
}

export function showMessage(message, type = 'info') {
    if (!elements.messageArea) return;
    const messageElement = document.createElement('p');
    messageElement.className = `message ${type}`;
    messageElement.innerHTML = message;
    elements.messageArea.appendChild(messageElement);
    elements.messageArea.scrollTop = elements.messageArea.scrollHeight;
    const MAX_MESSAGES = 20;
    while (elements.messageArea.children.length > MAX_MESSAGES) {
        elements.messageArea.removeChild(elements.messageArea.firstChild);
    }
    setTimeout(() => {
        messageElement.classList.add('highlight');
        setTimeout(() => {
            messageElement.classList.remove('highlight');
        }, 300);
    }, 10);
}

export function refreshAllUI() {
    refreshResourcesUI();
    refreshButtonsUI();
    updateDayDisplay();
    bindTooltipEvents(); // 统一绑定悬浮提示
    updateAllTooltips(); // 自动刷新所有可见tooltip内容
}

export function refreshResourcesUI() {
    updateMainResources();
    updateResourcesList();
    updateAllTooltips();
}

function updateMainResources() {
    updateResourceValue('coins', getResource('coins'));
    updateResourceValue('reputation', getResource('reputation'));
    updateDayDisplay();
}

function updateResourceValue(resourceId, value) {
    const resourceElement = document.getElementById(resourceId);
    if (!resourceElement) return;
    const valueElement = resourceElement.querySelector('.resource-value');
    if (valueElement) {
        valueElement.textContent = Number(value).toFixed(1);
    }
}

let updateResourcesListLock = false;
function updateResourcesList() {
    if (updateResourcesListLock) return;
    updateResourcesListLock = true;
    if (!elements.resourcesContainer) return;
    elements.resourcesContainer.innerHTML = '';
    // 新增：两列容器
    const columnsDiv = document.createElement('div');
    columnsDiv.className = 'resource-columns';
    // 左列：基础物资
    const resourceCol = document.createElement('div');
    resourceCol.className = 'resource-column';
    const resourceTitle = document.createElement('div');
    resourceTitle.className = 'resource-category-title';
    resourceTitle.textContent = '基础物资';
    resourceCol.appendChild(resourceTitle);
    const resourceGrid = document.createElement('div');
    resourceGrid.className = 'resource-grid';
    // 右列：建筑
    const buildingCol = document.createElement('div');
    buildingCol.className = 'resource-column';
    const buildingTitle = document.createElement('div');
    buildingTitle.className = 'resource-category-title';
    buildingTitle.textContent = '建筑';
    buildingCol.appendChild(buildingTitle);
    const buildingGrid = document.createElement('div');
    buildingGrid.className = 'resource-grid';
    const resources = getUnlockedResources();
    import('../data/items.js').then(({ items }) => {
        // 统计所有建筑的产量
        const buildingCounts = {};
        items.filter(i => i.type === 'building').forEach(building => {
            if (!isUnlocked('buildings', building.id)) return;
            buildingCounts[building.id] = getBuildingCount(building.id);
        });
        const autoProduction = {};
        items.filter(i => i.type === 'building').forEach(building => {
            if (!isUnlocked('buildings', building.id)) return;
            const count = buildingCounts[building.id] || 0;
            if (building.dailyProduction) {
                for (const [rid, num] of Object.entries(building.dailyProduction)) {
                    if (!autoProduction[rid]) autoProduction[rid] = 0;
                    autoProduction[rid] += num * count;
                }
            }
        });
        for (const [resourceId, config] of Object.entries(resources)) {
            if (config.isMainResource) continue;
            const amount = getResource(resourceId) || 0;
            if (amount === 0 && getResourceConfig(resourceId)?.requiredBuilding) continue;
            const resourceItem = document.createElement('div');
            resourceItem.className = 'resource-item';
            resourceItem.dataset.resource = resourceId;
            // 主内容一行
            const mainLine = document.createElement('div');
            mainLine.className = 'resource-main-line';
            // 左侧：图标+文本
            const infoLeft = document.createElement('div');
            infoLeft.className = 'resource-info-left';
            const iconSpan = document.createElement('span');
            iconSpan.className = 'resource-icon';
            iconSpan.textContent = config.icon;
            const nameSpan = document.createElement('span');
            nameSpan.className = 'resource-name';
            nameSpan.textContent = config.name;
            infoLeft.appendChild(iconSpan);
            infoLeft.appendChild(nameSpan);
            // 右侧：总量(+产量)
            const infoRight = document.createElement('div');
            infoRight.className = 'resource-info-right';
            const amountSpan = document.createElement('span');
            amountSpan.className = 'resource-amount';
            amountSpan.textContent = formatNumber(amount);
            infoRight.appendChild(amountSpan);
            const prodValue = autoProduction[resourceId] ? autoProduction[resourceId].toFixed(1) : '';
            if (prodValue && Number(prodValue) !== 0) {
                const prodSpan = document.createElement('span');
                prodSpan.className = 'resource-auto-production';
                prodSpan.textContent = (autoProduction[resourceId] > 0 ? '+' : '') + prodValue + '/天';
                prodSpan.classList.add(autoProduction[resourceId] > 0 ? 'positive' : (autoProduction[resourceId] < 0 ? 'negative' : ''));
                infoRight.appendChild(prodSpan);
            }
            mainLine.appendChild(infoLeft);
            mainLine.appendChild(infoRight);
            resourceItem.appendChild(mainLine);
            resourceGrid.appendChild(resourceItem);
        }
        items.filter(i => i.type === 'building').forEach(building => {
            if (!isUnlocked('buildings', building.id)) return;
            const count = getBuildingCount(building.id);
            const buildingItem = document.createElement('div');
            buildingItem.className = 'resource-item building-item';
            buildingItem.dataset.building = building.id;
            // 主内容一行
            const mainLine = document.createElement('div');
            mainLine.className = 'resource-main-line';
            // 左侧：图标+名称
            const infoLeft = document.createElement('div');
            infoLeft.className = 'resource-info-left';
            const iconSpan = document.createElement('span');
            iconSpan.className = 'resource-icon';
            iconSpan.textContent = building.icon || '';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'resource-name';
            nameSpan.textContent = building.name;
            infoLeft.appendChild(iconSpan);
            infoLeft.appendChild(nameSpan);
            // 右侧：数量（不显示产量）
            const infoRight = document.createElement('div');
            infoRight.className = 'resource-info-right';
            const countSpan = document.createElement('span');
            countSpan.className = 'resource-amount';
            countSpan.textContent = count;
            infoRight.appendChild(countSpan);
            mainLine.appendChild(infoLeft);
            mainLine.appendChild(infoRight);
            buildingItem.appendChild(mainLine);
            buildingGrid.appendChild(buildingItem);
        });
        // 挂载到两列
        resourceCol.appendChild(resourceGrid);
        buildingCol.appendChild(buildingGrid);
        columnsDiv.appendChild(resourceCol);
        columnsDiv.appendChild(buildingCol);
        elements.resourcesContainer.appendChild(columnsDiv);
        // 关键：建筑渲染后重新绑定 tooltip 事件
        bindTooltipEvents();
        startFastResourceUpdate(); // 保证每次资源面板刷新后都重新绑定高频刷新
        updateResourcesListLock = false;
    });
}

export function refreshButtonsUI() {
    if (!elements.actionButtons) return;
    const unlockedActions = getGameData().unlocked.actions || [];
    const buttons = elements.actionButtons.querySelectorAll('.action-button');
    buttons.forEach(btn => {
        const id = btn.id;
        if (unlockedActions.includes(id)) {
            btn.classList.remove('locked');
            btn.disabled = false;
            btn.style.opacity = '';
            btn.style.pointerEvents = '';
            btn.style.filter = '';
        } else {
            btn.classList.add('locked');
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.pointerEvents = 'none';
            btn.style.filter = 'grayscale(1)';
        }
    });
    updateAllTooltips();
}

export function updateDayDisplay() {
    const dayCountElement = document.getElementById('day-count');
    if (!dayCountElement) return;
    const valueElement = dayCountElement.querySelector('.resource-value');
    if (!valueElement) return;
    const gameTime = getGameData().gameTime;
    const seasonNames = { 'spring': '春', 'summer': '夏', 'autumn': '秋', 'winter': '冬' };
    valueElement.textContent = `第${gameTime.day}天 (${seasonNames[gameTime.season]}季)`;
}

export function formatNumber(number) {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    number = parseFloat(number);
    if (isNaN(number)) return '0.0';
    if (number < 1000) return number.toFixed(1);
    const magnitude = Math.floor(Math.log10(number) / 3);
    const suffix = suffixes[Math.min(magnitude, suffixes.length - 1)];
    const scaled = number / Math.pow(1000, magnitude);
    return scaled.toFixed(1) + suffix;
}

// 通用悬浮提示内容生成（支持资源、建筑、操作按钮）
export async function getTooltipContent(id) {
    const { items } = await import('../data/items.js');
    const item = items.find(i => i.id === id);
    if (!item) return '';
    let content = `<div style="font-weight:bold; font-size:1.08em;">${item.icon || ''} ${item.name}</div>`;
    if (item.type === 'action') {
        // 操作按钮：小字显示描述、效果、当前数量、合成需求（带当前/需求对比）
        content += `<div style='color:#fff; font-size:1.05em; margin-bottom:3px; text-shadow:0 1px 2px #222;'>${item.description || '点击按钮执行操作'}</div>`;
        // 效果
        if (item.produce && Object.keys(item.produce).length > 0) {
            content += `<div style='color:#b2ffb2; font-size:1em;'>获得：`;
            content += Object.entries(item.produce).map(([rid, num]) => {
                const conf = items.find(i => i.id === rid);
                return `${conf ? conf.icon : ''}${conf ? conf.name : rid} ×${num}`;
            }).join('，');
            content += `</div>`;
        }
        // 当前数量（如果产出资源/建筑）
        if (item.produce) {
            for (const rid of Object.keys(item.produce)) {
                const conf = items.find(i => i.id === rid);
                if (conf && (conf.type === 'resource' || conf.type === 'building')) {
                    const { getResource, getBuildingCount } = await import('../data/data.js');
                    let val = conf.type === 'resource' ? getResource(rid) : getBuildingCount(rid);
                    content += `<div style='color:#fff; font-size:0.98em; text-shadow:0 1px 2px #222;'>当前${conf.name}：${val}</div>`;
                }
            }
        }
        // 合成/消耗需求（带当前/需求对比，红色不足，绿色足够）
        if (item.cost && Object.keys(item.cost).length > 0) {
            const { getResource, getBuildingCount } = await import('../data/data.js');
            content += `<div style='color:#ffe082; font-size:0.98em;'>需要：`;
            content += Object.entries(item.cost).map(([rid, num]) => {
                const conf = items.find(i => i.id === rid);
                let cur = conf ? (conf.type === 'resource' ? getResource(rid) : getBuildingCount(rid)) : 0;
                let enough = cur >= num;
                return `<span style='${enough ? "color:#b2ffb2;" : "color:#ffb2b2;"} text-shadow:0 1px 2px #222;'>${conf ? conf.icon : ''}${conf ? conf.name : rid} ${cur}/${num}</span>`;
            }).join('，');
            content += `</div>`;
        }
    } else if (item.type === 'building') {
        // 建筑：显示产出效率、数量
        const { getBuildingCount } = await import('../data/data.js');
        const count = getBuildingCount(item.id);
        content += `<div style='color:#fff; font-size:1.05em; text-shadow:0 1px 2px #222;'>${item.description || ''}</div>`;
        content += `<div style='color:#b2ffb2; font-size:1em;'>数量：${count}</div>`;
        if (item.dailyProduction) {
            content += `<div style='color:#ffe082; font-size:0.98em;'>产出：`;
            content += Object.entries(item.dailyProduction).map(([rid, num]) => {
                const conf = items.find(i => i.id === rid);
                return `${conf ? conf.icon : ''}${conf ? conf.name : rid} ×${num}/天`;
            }).join('，');
            content += `</div>`;
        }
    } else if (item.type === 'resource') {
        // 资源：显示描述、当前数量
        const { getResource } = await import('../data/data.js');
        const amount = getResource(item.id) || 0;
        content += `<div style='color:#fff; font-size:1.05em; text-shadow:0 1px 2px #222;'>${item.description || ''}</div>`;
        content += `<div style='color:#b2ffb2; font-size:1em;'>当前：${amount}</div>`;
    }
    return content;
}

// 显示悬浮提示
async function showTooltip(e) {
    const target = e.currentTarget;
    const id = target.id || target.dataset.resource || target.dataset.building;
    if (!id) return;
    const content = await getTooltipContent(id);
    let tooltip = document.getElementById('button-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'button-tooltip';
        tooltip.className = 'button-tooltip';
        document.body.appendChild(tooltip);
    }
    const rect = target.getBoundingClientRect();
    tooltip.innerHTML = content;
    tooltip.style.left = rect.left + rect.width / 2 + 'px';
    tooltip.style.top = (rect.top - 10) + window.scrollY + 'px';
    tooltip.classList.add('visible');
}

export function hideButtonTooltip() {
    const tooltip = document.getElementById('button-tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

// 资源、建筑、操作按钮统一绑定悬浮提示
export function bindTooltipEvents() {
    // 操作按钮
    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(btn => {
        btn.removeEventListener('mouseenter', showTooltip);
        btn.removeEventListener('mouseleave', hideButtonTooltip);
        btn.addEventListener('mouseenter', showTooltip);
        btn.addEventListener('mouseleave', hideButtonTooltip);
    });
    // 资源和建筑
    const resourceItems = document.querySelectorAll('.resource-item');
    resourceItems.forEach(item => {
        item.removeEventListener('mouseenter', showTooltip);
        item.removeEventListener('mouseleave', hideButtonTooltip);
        item.addEventListener('mouseenter', showTooltip);
        item.addEventListener('mouseleave', hideButtonTooltip);
    });
}

// 在资源刷新、按钮点击等时自动刷新当前可见的tooltip内容
export async function updateAllTooltips() {
    const tooltip = document.getElementById('button-tooltip');
    if (tooltip && tooltip.classList.contains('visible')) {
        // 找到当前悬停的元素
        const hovered = document.querySelector('.action-button:hover, .resource-item:hover');
        if (hovered) {
            const id = hovered.id || hovered.dataset.resource || hovered.dataset.building;
            if (id) {
                tooltip.innerHTML = await getTooltipContent(id);
            }
        }
    }
}

// 设置下拉菜单及存档相关功能
export function showSettingsDropdown() {
    let dropdown = document.getElementById('settings-dropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'settings-dropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.top = '48px';
        dropdown.style.right = '32px';
        dropdown.style.background = '#fff';
        dropdown.style.border = '1px solid #ccc';
        dropdown.style.borderRadius = '8px';
        dropdown.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
        dropdown.style.zIndex = 99999;
        dropdown.style.minWidth = '160px';
        dropdown.innerHTML = `
            <button id="export-save-btn" class="secondary-btn" style="width:100%;margin:0;">导出存档</button>
            <label style="width:100%;display:block;margin:0;cursor:pointer;">
                <span style="display:block;padding:8px 16px;">导入存档</span>
                <input type="file" id="import-save-file" accept="application/json" style="display:none;" />
            </label>
            <button id="reset-game-btn" class="secondary-btn" style="width:100%;margin:0;">重置游戏</button>
        `;
        document.body.appendChild(dropdown);
    }
    dropdown.style.display = 'block';
    // 绑定事件
    document.getElementById('export-save-btn').onclick = () => {
        exportSave();
        dropdown.style.display = 'none';
    };
    document.getElementById('import-save-file').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        importSave(file, () => {
            showMessage('存档导入成功，游戏将自动刷新', 'success');
            setTimeout(() => window.location.reload(), 1200);
        }, () => {
            showMessage('导入失败，文件格式错误', 'error');
        });
        dropdown.style.display = 'none';
    };
    document.getElementById('reset-game-btn').onclick = () => {
        resetAndBackup();
        dropdown.style.display = 'none';
    };
    // 点击外部关闭
    setTimeout(() => {
        document.addEventListener('mousedown', hideDropdownOnClick, { once: true });
    }, 0);
}
function hideDropdownOnClick(e) {
    const dropdown = document.getElementById('settings-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
    }
}
export function bindSettingsButton() {
    const btn = document.querySelector('.settings-button');
    if (btn) {
        btn.onclick = (e) => {
            e.stopPropagation();
            showSettingsDropdown();
        };
    }
}
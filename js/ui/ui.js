// 游戏UI管理模块（ES6模块化重构）
import { getGameData, getResource, getBuildingCount, isUnlocked, resetGame, loadGame, saveGame, addResource, getFreeVillager, getTotalAssignedVillager, getAssignedVillager, setAssignedVillager } from '../data/data.js';
import { getResourceName, getResourceIcon, getResourceConfig, getUnlockedResources, getResourceSellPrice } from '../data/resources.js';
import { getGameConfig } from '../game/game.js';
import { exportSave, importSave, resetAndBackup } from '../data/saveManager.js';
import { getDisplayResources, getDisplayTools, getDisplayBuildings, getAutoProduction } from '../data/dataCenter.js';
import { getDisplayResourceList, getDisplayToolList, getDisplayBuildingList, getFullDisplayResourcePanelData } from '../data/displayData.js';
import { items } from '../data/items.js';
import { bindTooltipEvents, updateAllTooltips, hideButtonTooltip } from './tooltip.js';

// UI相关元素引用
let elements = {
    messageArea: null,
    feedbackArea: null,
    resourcesContainer: null,
    actionButtons: null,
    modal: null
};

// 拖拽状态标记，用于临时暂停高频更新
let isDraggingSection = false;

// 启动高频刷新基础物资显示
let fastResourceInterval = null;
export const autoProdBuffer = {};
export function startFastResourceUpdate() {
    if (fastResourceInterval) clearInterval(fastResourceInterval);
    fastResourceInterval = setInterval(() => {
        // 如果处于拖拽状态，暂停DOM更新以提高拖拽流畅性
        if (isDraggingSection) return;

        // 直接调用数据中心的自动产量统计
        const autoProduction = getAutoProduction();
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

// 导出拖拽状态控制函数供main.js使用
export function setDraggingState(isDragging) {
    isDraggingSection = isDragging;

    // 拖拽开始时强制隐藏所有tooltip
    if (isDragging) {
        hideButtonTooltip();
    }
}

// 夜间模式：初始化时自动应用
function applyDarkModeSetting(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    // 存储到 localStorage
    localStorage.setItem('halcyon_town_dark_mode', isDark ? '1' : '0');
    // 若有全局设置，也同步
    try {
        const gd = window.gameData || {};
        if (gd.settings) gd.settings.darkMode = isDark;
    } catch(e) {}
}
function getDarkModeSetting() {
    // 优先 localStorage，其次 gameData.settings
    const local = localStorage.getItem('halcyon_town_dark_mode');
    if (local !== null) return local === '1';
    try {
        const gd = window.gameData || {};
        if (gd.settings && typeof gd.settings.darkMode === 'boolean') return gd.settings.darkMode;
    } catch(e) {}
    return false;
}

export function initialize() {
    elements.messageArea = document.getElementById('message-area');
    elements.feedbackArea = document.getElementById('feedback-area');
    elements.resourcesContainer = document.getElementById('resources-container');
    elements.actionButtons = document.getElementById('action-buttons');
    elements.modal = document.getElementById('modal');
    // 新增：显示全屏起始页面
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.display = 'flex';
        // 事件处理函数
        const hideStartScreen = () => {
            startScreen.style.display = 'none';
            startScreen.style.pointerEvents = 'none'; // 确保彻底禁用点击事件
            startScreen.style.zIndex = '-1'; // 将z-index设为负值，确保不会挡住其他元素
            document.removeEventListener('mousedown', hideStartScreen, true);
            document.removeEventListener('wheel', hideStartScreen, true);
        };
        // 只要点击或滚动就关闭
        document.addEventListener('mousedown', hideStartScreen, true);
        document.addEventListener('wheel', hideStartScreen, true);
    }
    refreshAllUI();
    startFastResourceUpdate();
    bindSettingsButton();
    // 初始化夜间模式
    applyDarkModeSetting(getDarkModeSetting());
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
    // 构造最新的 assignedMap 并传递给 displayData
    const { resourceMap, buildingMap, assignedMap } = getCurrentResourceAndBuildingMap();
    const panelData = getFullDisplayResourcePanelData(assignedMap);
    const columnsDiv = document.createElement('div');
    columnsDiv.className = 'resource-columns';
    // 左列
    const leftCol = document.createElement('div');
    leftCol.className = 'col';
    panelData.left.forEach(section => {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'section-title';
        titleDiv.textContent = section.title;
        leftCol.appendChild(titleDiv);
        const gridDiv = document.createElement('div');
        gridDiv.className = 'resource-grid';
        section.items.forEach(config => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'resource-item';
            itemDiv.dataset.resource = config.id;
            const mainLine = document.createElement('div');
            mainLine.className = 'resource-main-line';
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
            const infoRight = document.createElement('div');
            infoRight.className = 'resource-info-right';
            const amountSpan = document.createElement('span');
            amountSpan.className = 'resource-amount';
            // 平滑显示：加上 autoProdBuffer
            const rid = config.id;
            const buffer = autoProdBuffer[rid] || 0;
            amountSpan.textContent = formatNumber(config.amount !== undefined ? config.amount : getResource(rid) + buffer);
            infoRight.appendChild(amountSpan);
            // 自动产量显示
            if (typeof config.production === 'number' && config.production !== 0) {
                const prodSpan = document.createElement('span');
                prodSpan.className = 'resource-auto-production';
                prodSpan.textContent = (config.production > 0 ? '+' : '') + config.production + '/天';
                prodSpan.classList.add(config.production > 0 ? 'positive' : 'negative');
                infoRight.appendChild(prodSpan);
            }
            mainLine.appendChild(infoLeft);
            mainLine.appendChild(infoRight);
            itemDiv.appendChild(mainLine);
            gridDiv.appendChild(itemDiv);
        });
        leftCol.appendChild(gridDiv);
    });
    // 右列
    const rightCol = document.createElement('div');
    rightCol.className = 'col';
    panelData.right.forEach(section => {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'section-title';
        titleDiv.textContent = section.title;
        rightCol.appendChild(titleDiv);
        const gridDiv = document.createElement('div');
        gridDiv.className = 'resource-grid';
        section.items.forEach(config => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'resource-item building-item';
            itemDiv.dataset.building = config.id;
            itemDiv.style.position = 'relative';
            const mainLine = document.createElement('div');
            mainLine.className = 'resource-main-line';
            const infoLeft = document.createElement('div');
            infoLeft.className = 'resource-info-left';
            const iconSpan = document.createElement('span');
            iconSpan.className = 'resource-icon';
            iconSpan.textContent = config.icon || '';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'resource-name';
            nameSpan.textContent = config.name;
            infoLeft.appendChild(iconSpan);
            infoLeft.appendChild(nameSpan);
            const infoRight = document.createElement('div');
            infoRight.className = 'resource-info-right';
            // 针对流民条目只显示分配信息，不显示加减按钮
            if (config.id === 'villager') {
                const villagerSpan = document.createElement('span');
                villagerSpan.className = 'assigned-villager-info';
                const labelContainer = document.createElement('span');
                labelContainer.className = 'label-container';
                const labelSpan = document.createElement('span');
                labelSpan.className = 'label';
                labelSpan.textContent = '分配流民：';
                labelContainer.appendChild(labelSpan);
                villagerSpan.appendChild(labelContainer);
                const valueSpan = document.createElement('span');
                valueSpan.className = 'value';
                // 正确显示“已分配/总数量”
                valueSpan.textContent = `${getTotalAssignedVillager()}/${getResource('villager')}`;
                villagerSpan.appendChild(valueSpan);
                infoRight.appendChild(villagerSpan);
                mainLine.appendChild(infoLeft);
                mainLine.appendChild(infoRight);
                itemDiv.appendChild(mainLine);
                gridDiv.appendChild(itemDiv);
                // 监听资源变化，实时刷新分配数据
                const updateVillagerValue = () => {
                    valueSpan.textContent = `${getTotalAssignedVillager()}/${getResource('villager')}`;
                };
                document.addEventListener('resourceChanged', updateVillagerValue);
                document.addEventListener('buildingChanged', updateVillagerValue);
                return; // 跳过后续加减按钮渲染
            }
            const villagerSpan = document.createElement('span');
            villagerSpan.className = 'assigned-villager-info';
            const labelContainer = document.createElement('span');
            labelContainer.className = 'label-container';
            const labelSpan = document.createElement('span');
            labelSpan.className = 'label';
            labelSpan.textContent = '分配流民：';
            labelContainer.appendChild(labelSpan);
            villagerSpan.appendChild(labelContainer);
            const valueSpan = document.createElement('span');
            valueSpan.className = 'value';
            valueSpan.textContent = `${config.assignedVillager ?? 0}/${config.count ?? 0}`;
            villagerSpan.appendChild(valueSpan);
            infoRight.appendChild(villagerSpan);
            // --- 浮现的加减按钮 ---
            const slideBtns = document.createElement('div');
            slideBtns.className = 'slide-btns-anim';
            // - 按钮
            const minusBtn = document.createElement('button');
            minusBtn.textContent = '-';
            minusBtn.onmousedown = (e) => {
                e.stopPropagation();
            };
            minusBtn.onclick = (e) => {
                e.stopPropagation();
                const assigned = getAssignedVillager(config.id);
                if (assigned > 0) {
                    setAssignedVillager(config.id, assigned - 1);
                    const valueSpan = villagerSpan.querySelector('.value');
                    if (valueSpan) {
                        valueSpan.textContent = `${assigned - 1}/${config.count ?? 0}`;
                    }
                    itemDiv.classList.add('active');
                    updateAllTooltips(true);
                    document.dispatchEvent(new CustomEvent('resourceChanged', { detail: { resource: 'villager' } }));
                    updateLeftResourceAutoProduction();
                }
            };
            const plusBtn = document.createElement('button');
            plusBtn.textContent = '+';
            plusBtn.onmousedown = (e) => {
                e.stopPropagation();
            };
            plusBtn.onclick = (e) => {
                e.stopPropagation();
                const assigned = getAssignedVillager(config.id);
                const total = config.count;
                const require = (config.require && config.require.villager) ? config.require.villager : 1;
                const free = getFreeVillager();
                if (free > 0 && assigned < total * require) {
                    setAssignedVillager(config.id, assigned + 1);
                    const valueSpan = villagerSpan.querySelector('.value');
                    if (valueSpan) {
                        valueSpan.textContent = `${assigned + 1}/${config.count ?? 0}`;
                    }
                    itemDiv.classList.add('active');
                    updateAllTooltips(true);
                    document.dispatchEvent(new CustomEvent('resourceChanged', { detail: { resource: 'villager' } }));
                    updateLeftResourceAutoProduction();
                }
            };
            slideBtns.appendChild(minusBtn);
            slideBtns.appendChild(plusBtn);
            infoRight.appendChild(slideBtns);
            mainLine.appendChild(infoLeft);
            mainLine.appendChild(infoRight);
            itemDiv.appendChild(mainLine);
            itemDiv.addEventListener('mouseenter', () => {
                itemDiv.classList.add('active');
            });
            itemDiv.addEventListener('mouseleave', () => {
                itemDiv.classList.remove('active');
            });
            gridDiv.appendChild(itemDiv);
        });
        rightCol.appendChild(gridDiv);
    });
    columnsDiv.appendChild(leftCol);
    columnsDiv.appendChild(rightCol);
    elements.resourcesContainer.appendChild(columnsDiv);
    bindTooltipEvents();
    startFastResourceUpdate();
    updateResourcesListLock = false;
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

// 获取所有资源和建筑的当前数量，返回 { resourceMap, buildingMap, assignedMap }
function getCurrentResourceAndBuildingMap() {
    const resourceMap = {};
    const buildingMap = {};
    const assignedMap = {};
    // 资源
    for (const i of items) {
        if (i.type === 'resource' || i.type === 'tool') resourceMap[i.id] = getResource(i.id) || 0;
        if (i.type === 'building' || i.type === 'facility') {
            buildingMap[i.id] = getBuildingCount(i.id) || 0;
            assignedMap[i.id] = getAssignedVillager(i.id) || 0;
        }
    }
    return { resourceMap, buildingMap, assignedMap };
}

// 设置下拉菜单及存档相关功能
export function showSettingsDropdown() {
    let dropdown = document.getElementById('settings-dropdown');
    const btn = document.querySelector('.settings-button');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'settings-dropdown';
        dropdown.className = 'settings-dropdown';
        document.body.appendChild(dropdown);
    }
    // 每次都刷新内容和事件
    dropdown.innerHTML = `
        <button id="reset-game-btn" class="secondary-btn">⚠️ 重置游戏</button>
        <button id="dark-mode-toggle-btn" class="secondary-btn">🌓 夜间/日间模式</button>
    `;
    dropdown.style.display = 'block';

    // 定位到按钮下方，并使右边与按钮右边对齐
    if (btn) {
        const rect = btn.getBoundingClientRect();
        dropdown.style.position = 'absolute';
        dropdown.style.minWidth = '140px';
        dropdown.style.maxWidth = '140px';
        dropdown.style.display = 'block';
        // 直接用 minWidth 作为宽度基准，不依赖 offsetWidth
        const dropdownWidth = 140;
        dropdown.style.top = (window.scrollY + rect.bottom + 4) + 'px';
        dropdown.style.left = (window.scrollX + rect.right - dropdownWidth) + 'px';
        dropdown.style.right = '';
    }

    // 夜间模式按钮初始化
    const darkModeBtn = dropdown.querySelector('#dark-mode-toggle-btn');
    if (darkModeBtn) {
        const isDark = getDarkModeSetting();
        darkModeBtn.textContent = isDark ? '🌞 日间模式' : '🌙 夜间模式';
        darkModeBtn.onclick = () => {
            applyDarkModeSetting(!getDarkModeSetting());
            darkModeBtn.textContent = getDarkModeSetting() ? '🌞 日间模式' : '🌙 夜间模式';
        };
    }
    const resetBtn = dropdown.querySelector('#reset-game-btn');
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (confirm('⚠️ 确认要重置游戏吗？此操作不可撤销，所有进度将丢失！')) {
                resetAndBackup();
                dropdown.style.display = 'none';
            }
        };
    }
    // 点击外部关闭
    setTimeout(() => {
        function hideDropdownOnClick(e) {
            if (dropdown && !dropdown.contains(e.target) && e.target !== btn) {
                dropdown.style.display = 'none';
                document.removeEventListener('mousedown', hideDropdownOnClick, true);
            }
        }
        document.addEventListener('mousedown', hideDropdownOnClick, true);
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
        // 防止重复绑定
        if (!btn._settingsBound) {
            btn.onclick = (e) => {
                e.stopPropagation();
                showSettingsDropdown();
            };
            btn.classList.add('settings-button');
            btn.removeAttribute('style');
            btn.onmouseenter = null;
            btn.onmouseleave = null;
            btn._settingsBound = true;
        }
    }
}

// 新增：同步刷新左侧基础物资的自动产量
function updateLeftResourceAutoProduction() {
    const autoProduction = getAutoProduction();
    document.querySelectorAll('.resource-item:not(.building-item)').forEach(item => {
        const rid = item.dataset.resource;
        if (!rid) return;
        const prod = autoProduction[rid] || 0;
        let prodSpan = item.querySelector('.resource-auto-production');
        if (prod !== 0) {
            if (!prodSpan) {
                // 如果没有产量元素，动态创建并插入
                prodSpan = document.createElement('span');
                prodSpan.className = 'resource-auto-production';
                // 插入到 .resource-info-right 内部
                const infoRight = item.querySelector('.resource-info-right');
                if (infoRight) infoRight.appendChild(prodSpan);
            }
            prodSpan.textContent = (prod > 0 ? '+' : '') + prod + '/天';
            prodSpan.classList.toggle('positive', prod > 0);
            prodSpan.classList.toggle('negative', prod < 0);
        } else {
            // 没有产量时移除元素
            if (prodSpan && prodSpan.parentNode) {
                prodSpan.parentNode.removeChild(prodSpan);
            }
        }
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

export { bindTooltipEvents, updateAllTooltips, hideButtonTooltip };
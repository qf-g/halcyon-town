// Halcyon Town - 游戏主入口（ES6模块化重构）
import { initialize as initData, saveGame, advanceDay } from './js/data/data.js';
import { initialize as initUI, refreshAllUI, refreshButtonsUI, showMessage } from './js/ui/ui.js';
import { initialize as initLogic, handleAction } from './js/game/game.js';
import { initialize as initResources } from './js/data/resources.js';
import { initialize as initEvents } from './js/game/events.js';
import { initialize as initUnlocks } from './js/game/unlocks.js';
import { items } from './js/data/items.js';
import { getAllResources, sellResource } from './js/data/resources.js';
import { formatNumber } from './js/ui/ui.js';

// 操作中心分区顺序存储键
const ACTION_SECTION_ORDER_KEY = 'halcyon_action_section_order_v1';

// 默认分区定义
const DEFAULT_SECTIONS = [
    { key: 'gather', title: '采集', col: 1 },
    { key: 'build', title: '建筑', col: 1 },
    { key: 'craft', title: '合成', col: 2 }
    // 可扩展更多分区
];

function getSectionOrder() {
    try {
        const str = localStorage.getItem(ACTION_SECTION_ORDER_KEY);
        if (str) {
            const arr = JSON.parse(str);
            // 兼容老数据，补全缺失分区
            const keys = arr.map(s => s.key);
            DEFAULT_SECTIONS.forEach(def => {
                if (!keys.includes(def.key)) arr.push(def);
            });
            return arr;
        }
    } catch (e) {}
    return [...DEFAULT_SECTIONS];
}

function saveSectionOrder(order) {
    localStorage.setItem(ACTION_SECTION_ORDER_KEY, JSON.stringify(order));
}

// 等待DOM加载完成
window.addEventListener('DOMContentLoaded', async () => {
    // 移除预加载遮罩，恢复内容可见（兼容新版预加载主题方案）
    const preloadDark = document.getElementById('preload-dark');
    if (preloadDark) preloadDark.remove();
    const preloadTheme = document.getElementById('preload-theme');
    if (preloadTheme) preloadTheme.remove();
    Array.from(document.body.children).forEach(el => el.style.visibility = '');

    try {
        // 初始化各模块
        await initData();
        await initUI();
        await initResources();
        await initUnlocks();
        await initLogic();
        await initEvents();

        // 动态生成操作按钮
        renderActionButtons();

        // 初始化按钮功能
        initializeButtons();

        // 新增：渲染交易市场面板
        renderMarketPanel();

        // 自动保存
        setInterval(() => {
            saveGame();
        }, 60 * 1000); // 每1分钟自动保存

        // 日推进
        setInterval(() => {
            advanceDay();
        }, 60 * 1000);
    } catch (error) {
        showMessage('游戏加载失败，请刷新页面重试。', 'error');
        console.error('游戏加载失败:', error);
    }

    // 事件监听
    setupEventListeners();
});

function setupEventListeners() {
    document.addEventListener('gameReset', () => {
        refreshAllUI();
    });
    document.addEventListener('gameLoaded', () => {
        refreshAllUI();
    });
    document.addEventListener('gameSaved', () => {
        const saveStatus = document.getElementById('save-status');
        if (saveStatus) {
            saveStatus.textContent = '已保存 ' + new Date().toLocaleTimeString();
            setTimeout(() => {
                saveStatus.textContent = '自动保存';
            }, 3000);
        }
    });
    document.addEventListener('contentUnlocked', () => {
        refreshButtonsUI();
    });
}

function renderActionButtons() {
    const actionCol1 = document.getElementById('action-col-1');
    const actionCol2 = document.getElementById('action-col-2');
    if (!actionCol1 || !actionCol2) return;
    actionCol1.innerHTML = '';
    actionCol2.innerHTML = '';
    // 分类分组
    // 不再过滤解锁，全部显示
    const actions = items.filter(item => item.type === 'action');
    const gatherAndRecruitActions = actions.filter(item => item.id === 'gather-wheat' || item.id === 'recruit-villager');
    const gatherActions = actions.filter(item => /^(gather-|chop-|mine-)/.test(item.id) && item.id !== 'gather-wheat');
    const craftActions = actions.filter(item => /^craft-/.test(item.id));
    const buildActions = actions.filter(item => /^build-/.test(item.id));
    // 其它分组可扩展

    // 分区内容映射
    const sectionContent = {
        gather: (function() {
            const list = gatherAndRecruitActions.concat(gatherActions);
            if (!list.length) return null;
            return createSectionButtons(list);
        })(),
        build: (function() {
            if (!buildActions.length) return null;
            return createSectionButtons(buildActions);
        })(),
        craft: (function() {
            if (!craftActions.length) return null;
            return createSectionButtons(craftActions);
        })()
        // 可扩展更多分区
    };

    // 渲染分区，按顺序
    const order = getSectionOrder();
    // 按列分组
    const col1Sections = order.filter(section => section.col === 1);
    const col2Sections = order.filter(section => section.col === 2);

    // 渲染列1
    if (col1Sections.length === 0) {
        actionCol1.appendChild(createEmptyDropZone(1));
    } else {
        col1Sections.forEach((section, idx) => {
            const content = sectionContent[section.key];
            if (!content) return;
            const wrapper = document.createElement('div');
            wrapper.className = 'action-section-draggable';
            wrapper.setAttribute('draggable', 'true');
            wrapper.dataset.sectionKey = section.key;
            wrapper.dataset.index = idx;
            // 拖拽事件
            wrapper.addEventListener('dragstart', onSectionDragStart);
            wrapper.addEventListener('dragover', onSectionDragOver);
            wrapper.addEventListener('drop', onSectionDrop);
            wrapper.addEventListener('dragend', onSectionDragEnd);
            // 标题
            const titleRow = document.createElement('div');
            titleRow.className = 'section-title'; // 修改为使用资源中心标题样式
            titleRow.textContent = section.title;
            wrapper.appendChild(titleRow);
            // 按钮区
            wrapper.appendChild(content);
            actionCol1.appendChild(wrapper);
        });
    }
    // 渲染列2
    if (col2Sections.length === 0) {
        actionCol2.appendChild(createEmptyDropZone(2));
    } else {
        col2Sections.forEach((section, idx) => {
            const content = sectionContent[section.key];
            if (!content) return;
            const wrapper = document.createElement('div');
            wrapper.className = 'action-section-draggable';
            wrapper.setAttribute('draggable', 'true');
            wrapper.dataset.sectionKey = section.key;
            wrapper.dataset.index = idx;
            // 拖拽事件
            wrapper.addEventListener('dragstart', onSectionDragStart);
            wrapper.addEventListener('dragover', onSectionDragOver);
            wrapper.addEventListener('drop', onSectionDrop);
            wrapper.addEventListener('dragend', onSectionDragEnd);
            // 标题
            const titleRow = document.createElement('div');
            titleRow.className = 'section-title'; 
            titleRow.textContent = section.title;
            wrapper.appendChild(titleRow);
            // 按钮区
            wrapper.appendChild(content);
            actionCol2.appendChild(wrapper);
        });
    }
}

// 禁用拖拽相关空函数，避免报错
function onSectionDragStart() {}
function onSectionDragOver() {}
function onSectionDrop() {}
function onSectionDragEnd() {}

// 新增：空白可放置区
function createEmptyDropZone(col) {
    const zone = document.createElement('div');
    zone.className = 'empty-drop-zone';
    zone.style.height = '60px';
    zone.style.display = 'flex';
    zone.style.alignItems = 'center';
    zone.style.justifyContent = 'center';
    zone.style.border = '2px dashed #bbb';
    zone.style.borderRadius = '8px';
    zone.style.margin = '10px 0';
    zone.textContent = '拖动分区到此处';
    zone.dataset.col = col;
    // 只允许放置
    zone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', function(e) {
        this.classList.remove('drag-over');
    });
    zone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        onEmptyZoneDrop(col);
    });
    return zone;
}

// 新增：处理拖到空白区
function onEmptyZoneDrop(targetCol) {
    if (!dragSectionKey) return;
    let order = getSectionOrder();
    const fromIdx = order.findIndex(s => s.key === dragSectionKey);
    if (fromIdx === -1) return;
    // 移动到目标列末尾
    const [moved] = order.splice(fromIdx, 1);
    moved.col = targetCol;
    order.push(moved);
    saveSectionOrder(order);
    renderActionButtons();
}

function createSectionButtons(list) {
    const btnGrid = document.createElement('div');
    btnGrid.className = 'action-section-buttons';
    btnGrid.style.display = 'flex';
    btnGrid.style.flexWrap = 'wrap';
    btnGrid.style.gap = '10px';
    for (let i = 0; i < list.length; i += 2) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '10px';
        row.style.width = '100%';
        for (let j = 0; j < 2; j++) {
            const item = list[i + j];
            if (item) {
                const btn = document.createElement('button');
                btn.id = item.id;
                btn.className = `action-button ${item.buttonClass || ''}`;
                btn.innerHTML = `${item.icon ? `<span class=\"icon\">${item.icon}</span>` : ''}<span class=\"name\">${item.name}</span>`;
                btn.setAttribute('data-tooltip', item.description);
                btn.style.flex = '1 1 0';
                btn.style.minWidth = '100px';
                btn.style.maxWidth = '45%';
                btn.style.fontSize = '0.75rem';
                btn.style.justifyContent = 'flex-start';
                btn.style.textAlign = 'left';
                btn.style.paddingLeft = '8px';
                row.appendChild(btn);
            } else {
                const empty = document.createElement('div');
                empty.style.flex = '1 1 0';
                row.appendChild(empty);
            }
        }
        btnGrid.appendChild(row);
    }
    return btnGrid;
}

// 新增：渲染交易市场面板
function renderMarketPanel() {
    const marketContainer = document.getElementById('market-container');
    if (!marketContainer) return;
    marketContainer.innerHTML = '';

    // --- 集市分区 ---
    const marketSection = document.createElement('div');
    marketSection.className = 'market-section';
    // 标题
    const marketTitle = document.createElement('div');
    marketTitle.className = 'section-title';
    marketTitle.textContent = '集市（金币买卖资源）';
    marketSection.appendChild(marketTitle);
    // 资源列表
    const marketGrid = document.createElement('div');
    marketGrid.className = 'resource-grid';
    // 只展示 type 为 'product' 的产出物资
    const resources = items.filter(r => r.type === 'product');
    resources.forEach(res => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'market-item';
        itemDiv.dataset.resource = res.id;
        // 左侧
        const infoLeft = document.createElement('div');
        infoLeft.className = 'market-info-left';
        const iconSpan = document.createElement('span');
        iconSpan.className = 'market-icon';
        iconSpan.textContent = res.icon;
        const nameSpan = document.createElement('span');
        nameSpan.className = 'market-name';
        nameSpan.textContent = res.name;
        infoLeft.appendChild(iconSpan);
        infoLeft.appendChild(nameSpan);
        // 右侧
        const infoRight = document.createElement('div');
        infoRight.className = 'market-info-right';
        // 数量
        const amountSpan = document.createElement('span');
        amountSpan.className = 'market-amount';
        amountSpan.textContent = formatNumber(window.gameData.resources[res.id] || 0);
        infoRight.appendChild(amountSpan);
        // 单价
        const priceSpan = document.createElement('span');
        priceSpan.className = 'market-price';
        priceSpan.textContent = `单价: ${res.sellPrice || 1} 金币`;
        infoRight.appendChild(priceSpan);
        // 按钮区（初始隐藏，悬浮显示）
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'market-actions';
        // 卖出按钮
        const sellBtn = document.createElement('button');
        sellBtn.className = 'market-action';
        sellBtn.textContent = '卖出';
        sellBtn.onclick = () => {
            const result = sellResource(res.id, 1);
            if (result.success) {
                showMessage(`卖出1个${res.name}，获得${result.totalValue}金币`, 'success');
                renderMarketPanel();
                refreshAllUI && refreshAllUI();
            } else {
                showMessage(`资源不足，无法卖出${res.name}`,'warning');
            }
        };
        actionsDiv.appendChild(sellBtn);
        // 买入按钮（消耗金币，获得资源）
        const buyBtn = document.createElement('button');
        buyBtn.className = 'market-action';
        buyBtn.textContent = '买入';
        buyBtn.onclick = () => {
            const price = res.sellPrice || 1;
            if ((window.gameData.resources.coins || 0) >= price) {
                window.gameData.resources.coins -= price;
                window.gameData.resources[res.id] = (window.gameData.resources[res.id] || 0) + 1;
                showMessage(`花费${price}金币，买入1个${res.name}`,'success');
                renderMarketPanel();
                refreshAllUI && refreshAllUI();
            } else {
                showMessage('金币不足，无法购买','warning');
            }
        };
        actionsDiv.appendChild(buyBtn);
        infoRight.appendChild(actionsDiv);
        itemDiv.appendChild(infoLeft);
        itemDiv.appendChild(infoRight);
        marketGrid.appendChild(itemDiv);
    });
    marketSection.appendChild(marketGrid);
    marketContainer.appendChild(marketSection);

    // --- 证券分区 ---
    const stockSection = document.createElement('div');
    stockSection.className = 'market-section';
    const stockTitle = document.createElement('div');
    stockTitle.className = 'section-title';
    stockTitle.textContent = '证券（世界股票交易）';
    stockSection.appendChild(stockTitle);
    // 股票列表（使用 items.js 中 type 为 'stock' 的数据）
    const stockGrid = document.createElement('div');
    stockGrid.className = 'resource-grid';
    const stocks = items.filter(i => i.type === 'stock');
    stocks.forEach(stock => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'market-item';
        itemDiv.dataset.stock = stock.id;
        const infoLeft = document.createElement('div');
        infoLeft.className = 'market-info-left';
        const iconSpan = document.createElement('span');
        iconSpan.className = 'market-icon';
        iconSpan.textContent = stock.icon;
        const nameSpan = document.createElement('span');
        nameSpan.className = 'market-name';
        nameSpan.textContent = stock.name;
        infoLeft.appendChild(iconSpan);
        infoLeft.appendChild(nameSpan);
        const infoRight = document.createElement('div');
        infoRight.className = 'market-info-right';
        const priceSpan = document.createElement('span');
        priceSpan.className = 'market-amount';
        priceSpan.textContent = `${stock.basePrice} 金币`;
        infoRight.appendChild(priceSpan);
        // 按钮区
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'market-actions';
        // 买入按钮
        const buyBtn = document.createElement('button');
        buyBtn.className = 'market-action';
        buyBtn.textContent = '买入';
        buyBtn.onclick = () => {
            if ((window.gameData.resources.coins || 0) >= stock.basePrice) {
                window.gameData.resources.coins -= stock.basePrice;
                window.gameData.resources[stock.id] = (window.gameData.resources[stock.id] || 0) + 1;
                showMessage(`买入1股${stock.name}`,'success');
                renderMarketPanel();
                refreshAllUI && refreshAllUI();
            } else {
                showMessage('金币不足，无法买入股票','warning');
            }
        };
        actionsDiv.appendChild(buyBtn);
        // 卖出按钮
        const sellBtn = document.createElement('button');
        sellBtn.className = 'market-action';
        sellBtn.textContent = '卖出';
        sellBtn.onclick = () => {
            if ((window.gameData.resources[stock.id] || 0) > 0) {
                window.gameData.resources[stock.id] -= 1;
                window.gameData.resources.coins += stock.basePrice;
                showMessage(`卖出1股${stock.name}`,'success');
                renderMarketPanel();
                refreshAllUI && refreshAllUI();
            } else {
                showMessage('你没有持有该股票','warning');
            }
        };
        actionsDiv.appendChild(sellBtn);
        infoRight.appendChild(actionsDiv);
        itemDiv.appendChild(infoLeft);
        itemDiv.appendChild(infoRight);
        stockGrid.appendChild(itemDiv);
    });
    stockSection.appendChild(stockGrid);
    marketContainer.appendChild(stockSection);
}

function initializeButtons() {
    const actionButtons = document.getElementById('action-buttons');
    if (!actionButtons) return;
    actionButtons.addEventListener('click', function(e) {
        const button = e.target.closest('.action-button');
        if (button && !button.classList.contains('locked')) {
            button.classList.add('active');
            setTimeout(() => {
                button.classList.remove('active');
            }, 200);
            // 调用操作逻辑
            handleAction(button.id);
        }
    });
    // 只调用UI层统一的tooltip绑定
    import('./js/ui/ui.js').then(ui => {
        if (ui && ui.bindTooltipEvents) ui.bindTooltipEvents();
    });
}

// 打字机动画效果（优化：一行打印完立刻去除光标，后两行直接显示）
function typewriterLine(element, text, speed = 80, callback) {
    element.textContent = '';
    let i = 0;
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            removeCaret(element);
            if (callback) callback();
        }
    }
    type();
}

function removeCaret(element) {
    element.style.borderRight = 'none';
    element.style.animation = 'none';
}

function expandFromCenter(element, text, speed = 40, callback) {
    element.textContent = '';
    const len = text.length;
    let left = Math.floor((len - 1) / 2);
    let right = left + 1;
    let arr = new Array(len).fill(' ');
    function render() {
        element.textContent = arr.join('');
    }
    function expand() {
        if (left >= 0) {
            arr[left] = text[left];
            left--;
        }
        if (right < len) {
            arr[right] = text[right];
            right++;
        }
        render();
        if (left >= 0 || right < len) {
            setTimeout(expand, speed);
        } else if (callback) {
            callback();
        }
    }
    expand();
}

window.addEventListener('DOMContentLoaded', () => {
    const title = document.getElementById('typewriter-title');
    const subtitle = document.getElementById('typewriter-subtitle');
    const welcome = document.querySelector('.start-welcome');
    const author = document.querySelector('.start-author');
    // 初始仅前两行隐藏
    if (title) title.textContent = '';
    if (subtitle) subtitle.textContent = '';
    if (welcome) welcome.textContent = '在文字与光影中，遇见生活的另一种可能。';
    if (author) author.textContent = '作者：轻风';
    // 仅前两行打字动画
    if (title && subtitle) {
        typewriterLine(title, '欢迎来到栖迟之墟', 80, () => {
            setTimeout(() => {
                typewriterLine(subtitle, '「衡门之下，可以栖迟」', 60);
            }, 300);
        });
    }
});

window.addEventListener('beforeunload', () => {
    saveGame();
});

window.addEventListener('error', (e) => {
    showMessage('游戏发生错误: ' + (e.error?.message || e.message), 'error');
});
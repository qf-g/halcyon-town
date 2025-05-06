// Halcyon Town - 游戏主入口（ES6模块化重构）
import { initialize as initData, saveGame, advanceDay } from './js/data/data.js';
import { initialize as initUI, refreshAllUI, refreshButtonsUI, showMessage } from './js/ui/ui.js';
import { initialize as initLogic, handleAction } from './js/game/game.js';
import { initialize as initResources } from './js/data/resources.js';
import { initialize as initEvents } from './js/game/events.js';
import { initialize as initUnlocks } from './js/game/unlocks.js';
import { items } from './js/data/items.js';

// 等待DOM加载完成
window.addEventListener('DOMContentLoaded', async () => {
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
    const actionButtons = document.getElementById('action-buttons');
    if (!actionButtons) return;
    actionButtons.innerHTML = '';
    // 展示所有 type 为 action 的按钮
    items.filter(item => item.type === 'action').forEach(item => {
        const btn = document.createElement('button');
        btn.id = item.id;
        btn.className = `action-button ${item.buttonClass || ''}`;
        btn.innerHTML = `${item.icon ? `<span class="icon">${item.icon}</span>` : ''}<span class="name">${item.name}</span>`;
        btn.setAttribute('data-tooltip', item.description);
        // 不再根据 item.unlocked 设置按钮状态，全部按钮都渲染出来，状态交给 refreshButtonsUI 控制
        actionButtons.appendChild(btn);
    });
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

window.addEventListener('beforeunload', () => {
    saveGame();
});

window.addEventListener('error', (e) => {
    showMessage('游戏发生错误: ' + (e.error?.message || e.message), 'error');
});
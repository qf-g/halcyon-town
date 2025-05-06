// 存档管理独立模块
// 提供导出、导入、保存、重置等接口
import { getGameData, resetGame, saveGame, loadGame } from './data.js';

export function exportSave(filenamePrefix = 'halcyon_town_save') {
    const data = getGameData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenamePrefix}_${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

export function importSave(file, onSuccess, onError) {
    // 导入前自动导出当前存档
    exportSave('halcyon_town_backup_before_import');
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = JSON.parse(evt.target.result);
            localStorage.setItem('halcyon_town_save', JSON.stringify(data));
            alert('导入成功！如有多个游戏页面请全部关闭，仅保留一个页面后刷新。');
            setTimeout(() => window.location.reload(), 200);
        } catch (e) {
            alert('导入失败，文件格式错误：' + e.message);
            if (onError) onError();
        }
    };
    reader.readAsText(file);
}

export function resetAndBackup() {
    // 重置前自动导出当前存档
    exportSave('halcyon_town_backup');
    resetGame();
    window.location.reload();
}

export function autoSave() {
    saveGame();
}

// 事件管理模块（ES6模块化重构）
import { addResource, spendResource, getResource, getGameData } from '../data/data.js';

const SEASON_EVENTS = {
    spring: [
        {
            id: 'spring-flowers',
            title: '春花绽放',
            description: '春天的花朵盛开，吸引了蜜蜂和游客。',
            effect: () => {
                addResource('reputation', 2);
                return '村民们欣赏你农场的美丽花朵，你获得了2点声望！';
            },
            weight: 3
        },
        {
            id: 'spring-rain',
            title: '春雨绵绵',
            description: '温和的春雨滋润了土地。',
            effect: () => {
                addResource('wheat', 4);
                return '雨水滋润了农作物，你额外收获了4单位小麦！';
            },
            weight: 4
        }
    ],
    summer: [
        {
            id: 'summer-heat',
            title: '炎炎夏日',
            description: '夏日炎炎，阳光明媚，适合晾晒。',
            effect: () => {
                addResource('wood', 3);
                return '木材在阳光下快速晾干，你获得了3单位额外木材！';
            },
            weight: 3
        },
        {
            id: 'summer-drought',
            title: '夏季干旱',
            description: '持续高温让土地干燥，作物生长缓慢。',
            effect: () => {
                const hasEnoughWheat = getResource('wheat') >= 2;
                if (hasEnoughWheat) {
                    spendResource('wheat', 2);
                    return '干旱导致部分作物枯萎，你失去了2单位小麦。';
                }
                return '幸好你没有太多作物，损失不大。';
            },
            weight: 2
        }
    ],
    autumn: [
        {
            id: 'autumn-harvest',
            title: '丰收之秋',
            description: '秋天是丰收的季节，农作物长势良好。',
            effect: () => {
                addResource('wheat', 6);
                return '秋季丰收，你额外获得了6单位小麦！';
            },
            weight: 4
        },
        {
            id: 'autumn-trade',
            title: '秋季集市',
            description: '附近的村民组织了秋季集市，这是交易的好机会。',
            effect: () => {
                addResource('coins', 15);
                return '你在集市上卖出了一些农产品，获得了15枚金币！';
            },
            weight: 3
        }
    ],
    winter: [
        {
            id: 'winter-snow',
            title: '冬雪纷飞',
            description: '大雪覆盖了农场，户外活动变得困难。',
            effect: () => {
                const woodLoss = Math.min(2, getResource('wood'));
                if (woodLoss > 0) {
                    spendResource('wood', woodLoss);
                    addResource('reputation', 1);
                    return `你用${woodLoss}单位木材取暖，并帮助邻居，获得了1点声望。`;
                }
                return '寒冷的冬天让农场活动减少。';
            },
            weight: 3
        },
        {
            id: 'winter-festival',
            title: '冬季庆典',
            description: '村民们在寒冷的冬天组织了一场温馨的庆典。',
            effect: () => {
                addResource('reputation', 3);
                return '你参加了村庄的冬季庆典，结交了新朋友，获得了3点声望！';
            },
            weight: 2
        }
    ]
};

const NPC_EVENTS = [
    {
        id: 'old-farmer-advice',
        title: '老农的建议',
        description: '村里的老农来访，分享了他的种植经验。',
        condition: () => getResource('wheat') >= 10,
        effect: () => {
            addResource('reputation', 2);
            return '你从老农那里学到了新知识，获得2点声望！';
        },
        weight: 2
    }
    // 其它NPC事件可继续扩展
];

function selectAndTriggerEvent(eventsPool) {
    let totalWeight = eventsPool.reduce((sum, event) => sum + (event.weight || 1), 0);
    let randomValue = Math.random() * totalWeight;
    let selectedEvent = eventsPool[0];
    for (const event of eventsPool) {
        randomValue -= (event.weight || 1);
        if (randomValue <= 0) {
            selectedEvent = event;
            break;
        }
    }
    const resultMessage = selectedEvent.effect();
    // 通过自定义事件通知UI
    if (resultMessage) {
        document.dispatchEvent(new CustomEvent('gameEvent', {
            detail: {
                title: selectedEvent.title,
                description: selectedEvent.description,
                message: resultMessage,
                type: 'event'
            }
        }));
    }
    return selectedEvent;
}

export function triggerSeasonEvent(season) {
    const eventsPool = SEASON_EVENTS[season];
    if (!eventsPool || eventsPool.length === 0) return null;
    return selectAndTriggerEvent(eventsPool);
}

export function tryTriggerNPCEvent() {
    const validEvents = NPC_EVENTS.filter(event => !event.condition || event.condition());
    if (validEvents.length === 0) return null;
    if (Math.random() < 0.3) {
        return selectAndTriggerEvent(validEvents);
    }
    return null;
}

export function checkDailyEvent() {
    const gameData = getGameData();
    const currentSeason = gameData.gameTime.season;
    if (Math.random() < 0.6) {
        triggerSeasonEvent(currentSeason);
    } else if (Math.random() < 0.3) {
        tryTriggerNPCEvent();
    }
}

// 监听新的一天事件，尝试触发每日事件
export function initialize() {
    document.addEventListener('newDay', checkDailyEvent);
}
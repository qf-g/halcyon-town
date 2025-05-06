export const items = [
    // 一级材料
    {
        id: 'wheat',
        type: 'resource',
        name: '小麦',
        description: '面包的梦想从这里开始。',
        icon: '🌾',
        sellPrice: 1.5,
        gatherAmount: 3,
        autoYield: 5
    },
    {
        id: 'wood',
        type: 'resource',
        name: '木材',
        description: '盖房造船全靠它。',
        icon: '🪵',
        sellPrice: 2.0,
        gatherAmount: 2,
        autoYield: 3
    },
    {
        id: 'stone',
        type: 'resource',
        name: '石头',
        description: '硬邦邦，砌墙好材料。',
        icon: '🪨',
        sellPrice: 2,
        gatherAmount: 2,
        autoYield: 3
    },
    // 二级材料/工具
    {
        id: 'hoe',
        type: 'tool',
        name: '锄头',
        description: '开荒种地的好帮手。',
        icon: '⛏️',
        craft: { wood: 8, stone: 4 },
        durability: 60,
        usePerCycle: 1
    },
    {
        id: 'pickaxe',
        type: 'tool',
        name: '镐子',
        description: '采石场必备工具。',
        icon: '⛏️',
        craft: { wood: 6, stone: 8 },
        durability: 60,
        usePerCycle: 1
    },
    {
        id: 'bow-saw',
        type: 'tool',
        name: '弓锯',
        description: '锯木厂专用工具。',
        icon: '🪚',
        craft: { wood: 10, stone: 2 },
        durability: 60,
        usePerCycle: 1
    },
    // 流民
    {
        id: 'villager',
        type: 'population',
        name: '流民',
        description: '可以分配到设施工作的劳动力。',
        icon: '🧑‍🌾',
        recruitCost: { wheat: 30 },
        wheatConsumePerCycle: 5,
        efficiencyPenalty: 0.2
    },
    // 建筑
    {
        id: 'farm-field',
        type: 'facility',
        name: '田地',
        description: '自动产出小麦，需要1流民和1锄头。',
        icon: '🌱',
        buildCost: { wood: 20, stone: 10 },
        autoYield: { wheat: 5 },
        require: { villager: 1, hoe: 1 },
        cycle: 10
    },
    {
        id: 'quarry',
        type: 'facility',
        name: '采石场',
        description: '自动产出石头，需要1流民和1镐子。',
        icon: '⛏️',
        buildCost: { wood: 15, stone: 20 },
        autoYield: { stone: 3 },
        require: { villager: 1, pickaxe: 1 },
        cycle: 10
    },
    {
        id: 'sawmill',
        type: 'facility',
        name: '锯木厂',
        description: '自动产出木材，需要1流民和1弓锯。',
        icon: '🏭',
        buildCost: { wood: 30, stone: 10 },
        autoYield: { wood: 3 },
        require: { villager: 1, 'bow-saw': 1 },
        cycle: 10
    },
    // 操作
    {
        id: 'gather-wheat',
        type: 'action',
        name: '采集小麦',
        description: '动动手，收获满满。',
        icon: '🌾',
        cost: {},
        produce: { wheat: 1 }
    },
    {
        id: 'chop-wood',
        type: 'action',
        name: '伐木',
        description: '砍一砍，木材到手。',
        icon: '🪓',
        cost: {},
        produce: { wood: 1 }
    },
    {
        id: 'mine-stone',
        type: 'action',
        name: '采石',
        description: '敲敲打打，石头到家。',
        icon: '⛏️',
        cost: {},
        produce: { stone: 1 }
    },
    {
        id: 'craft-hoe',
        type: 'action',
        name: '合成锄头',
        description: '用木材和石头合成锄头。',
        icon: '⛏️',
        cost: { wood: 8, stone: 4 },
        produce: { hoe: 1 }
    },
    {
        id: 'craft-pickaxe',
        type: 'action',
        name: '合成镐子',
        description: '用木材和石头合成镐子。',
        icon: '⛏️',
        cost: { wood: 6, stone: 8 },
        produce: { pickaxe: 1 }
    },
    {
        id: 'craft-bow-saw',
        type: 'action',
        name: '合成弓锯',
        description: '用木材和石头合成弓锯。',
        icon: '🪚',
        cost: { wood: 10, stone: 2 },
        produce: { 'bow-saw': 1 }
    },
    {
        id: 'recruit-villager',
        type: 'action',
        name: '招募流民',
        description: '消耗小麦招募新的流民。',
        icon: '🧑‍🌾',
        cost: { wheat: 30 },
        produce: { villager: 1 }
    },
    {
        id: 'build-farm-field',
        type: 'action',
        name: '建造田地',
        description: '建造田地用于自动产出小麦。',
        icon: '🌱',
        cost: { wood: 20, stone: 10 },
        produce: { 'farm-field': 1 }
    },
    {
        id: 'build-quarry',
        type: 'action',
        name: '建造采石场',
        description: '建造采石场用于自动产出石头。',
        icon: '⛏️',
        cost: { wood: 15, stone: 20 },
        produce: { quarry: 1 }
    },
    {
        id: 'build-sawmill',
        type: 'action',
        name: '建造锯木厂',
        description: '建造锯木厂用于自动产出木材。',
        icon: '🏭',
        cost: { wood: 30, stone: 10 },
        produce: { sawmill: 1 }
    }
];

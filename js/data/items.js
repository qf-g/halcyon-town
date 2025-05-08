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
        buildCost: { wood: 20, stone: 10, hoe: 1 },
        autoYield: { wheat: 20 },
        require: { villager: 1, hoe: 1 },
        cycle: 10
    },
    {
        id: 'quarry',
        type: 'facility',
        name: '采石场',
        description: '自动产出石头，需要1流民和1镐子。',
        icon: '⛏️',
        buildCost: { wood: 15, stone: 20, pickaxe: 1 },
        autoYield: { stone: 10 },
        require: { villager: 1, pickaxe: 1 },
        cycle: 10
    },
    {
        id: 'sawmill',
        type: 'facility',
        name: '锯木厂',
        description: '自动产出木材，需要1流民和1弓锯。',
        icon: '🏭',
        buildCost: { wood: 30, stone: 10, 'bow-saw': 1 },
        autoYield: { wood: 10 },
        require: { villager: 1, 'bow-saw': 1 },
        cycle: 10
    },
    {
        id: 'chicken-coop',
        type: 'facility',
        name: '鸡舍',
        description: '自动产出鸡蛋，需要1流民和1小麦作为饲料。',
        icon: '🐔',
        buildCost: { wood: 1000, stone: 300 },
        autoYield: { egg: 10 },
        require: { villager: 1, wheat: 1 },
        cycle: 10
    },
    {
        id: 'bee-house',
        type: 'facility',
        name: '蜂房',
        description: '自动产出蜂蜜，需要1流民和1小麦作为蜜蜂饲料。',
        icon: '🐝',
        buildCost: { wood: 1000, stone: 300 },
        autoYield: { honey: 8 },
        require: { villager: 1, wheat: 1 },
        cycle: 10
    },
    {
        id: 'herb-garden',
        type: 'facility',
        name: '草药园',
        description: '种植草药，草药可用于制作药剂或交易。',
        icon: '🌿',
        buildCost: { wood: 800, stone: 200 },
        autoYield: { herb: 6 },
        require: { villager: 1 },
        cycle: 10
    },
    // 产出物资
    {
        id: 'egg',
        type: 'product',
        name: '鸡蛋',
        description: '新鲜的鸡蛋，可食用或交易。',
        icon: '🥚',
        sellPrice: 8
    },
    {
        id: 'honey',
        type: 'product',
        name: '蜂蜜',
        description: '香甜的蜂蜜，可食用或交易。',
        icon: '🍯',
        sellPrice: 12
    },
    {
        id: 'herb',
        type: 'product',
        name: '草药',
        description: '可用于制作药剂或交易的草药。',
        icon: '🌿',
        sellPrice: 15
    },
    // 集市
    {
        id: 'market',
        type: 'market',
        name: '集市',
        description: '可以交易产出物资（如鸡蛋、蜂蜜、草药），不可交易基础物资。',
        icon: '🏪',
        // 交易规则：仅允许 type: 'product' 的物品
        tradeableTypes: ['product']
    },
    // 虚拟公司证券市场
    {
        id: 'stock-eco',
        type: 'stock',
        name: '绿野能源',
        description: '虚拟公司股票，可买卖，价格波动。',
        icon: '📈',
        basePrice: 100
    },
    {
        id: 'stock-food',
        type: 'stock',
        name: '丰收食品',
        description: '虚拟公司股票，可买卖，价格波动。',
        icon: '📊',
        basePrice: 120
    },
    {
        id: 'stock-tech',
        type: 'stock',
        name: '曙光科技',
        description: '虚拟公司股票，可买卖，价格波动。',
        icon: '💻',
        basePrice: 150
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
        description: '要致富，先撸树。',
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
    },
    {
        id: 'build-chicken-coop',
        type: 'action',
        name: '建造鸡舍',
        description: '建造鸡舍用于自动产出鸡蛋。',
        icon: '🐔',
        cost: { wood: 1000, stone: 300 },
        produce: { 'chicken-coop': 1 }
    },
    {
        id: 'build-bee-house',
        type: 'action',
        name: '建造蜂房',
        description: '建造蜂房用于自动产出蜂蜜。',
        icon: '🐝',
        cost: { wood: 1000, stone: 300 },
        produce: { 'bee-house': 1 }
    },
    {
        id: 'build-herb-garden',
        type: 'action',
        name: '建造草药园',
        description: '建造草药园用于种植草药。',
        icon: '🌿',
        cost: { wood: 800, stone: 200 },
        produce: { 'herb-garden': 1 }
    }
];

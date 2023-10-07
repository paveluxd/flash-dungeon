//Misc vars -> move to game obj?
let playerObj, enemyObj, combatState
let rewardPool = []


//Game state
class GameState{
    constructor(){
        this.stage = 1
        this.encounter = 1

        // this.enemyLifeBase = 6 //N + other mods
        this.bossFrequency = 5 //Every Nth stage
    }
}

//
class CombatState {
    constructor(){
        this.turn = 1

        this.dmgDoneByEnemy = 0
        this.dmgTakenByEnemy = 0

        this.dmgDoneByPlayer = 0
        this.dmgTakenByPlayer = 0

        this.enemyAction = []
        this.playerAction = []
    }
}

//
class PlayerObj {
    constructor(){
        //Life
        this.baseLife       = 20            //Lvl 1 char life
        this.flatLife       = this.baseLife //Life cap
        this.life           = this.baseLife //Current life

        //Power
        this.basePower      = 0
        this.flatPower      = this.basePower
        this.power          = this.basePower

        //Def
        this.baseDef        = 0
        this.flatDef        = this.baseDef
        this.def            = this.baseDef

        //Dice
        this.baseDice       = 6 //needed as ref in case flat dice is modified by item
        this.flatDice       = this.baseDice
        this.dice           = this.baseDice

        this.roll           = 0
        this.rollBonus      = 0

        //Temporary buffs
        this.piercing       = false
        this.swordDmgMod    = 0

        //Inventory
        this.inventorySlots = 20 
        this.inventory      = [] //Items gained as rewards
        this.startingItems  = [
            "bow",
            'woolen boots',
            'iron dagger',
            'healing potion',
            'scroll of fortification',
            "curse of weakness",
        ]

        //Slots
        //Equipment slots
        this.baseSlots      = 6
        this.equipmentSlots = this.baseSlots

        //Actions
        this.actionSlots    = this.baseSlots
        this.actions        = [] //Actions gained from items
        this.tempActions    = [] //Temporary actions

        // this.draftActions   = [] //Draft actions gained from items

        //Sub-stats
        this.gold           = 0

        //Progression
        this.exp            = 0
        this.lvl            = 1
        this.treeNodes      = []
        this.treePoints     = 0
    }
}

//
class EnemyObj {
    
    constructor(){
        //Choose enemy profile
        let profiles = ['balanced', 'tank', 'assassin', 'minion'] //'minion'
        let randomEnemyProfile = rarr(profiles)
        let powerMod, defMod, diceMod, imgPath, lifeMod
        // el('enemyImg').classList.remove('boss')

        
        if(randomEnemyProfile === 'balanced'){
            lifeMod  = 1
            powerMod = 1
            defMod   = 1
            diceMod  = 1

            this.profile = 'balanced'
            imgPath  = `balanced/${rng(17,1)}`
        }
        else if(randomEnemyProfile === 'tank'){
            lifeMod  = 0.5
            powerMod = 0.25
            defMod   = 3
            diceMod  = 0.25

            this.profile = 'tank'
            imgPath  = `tank/${rng(1,1)}`
        }
        else if(randomEnemyProfile === 'assassin'){
            lifeMod  = 0.25
            powerMod = 3
            defMod   = 0.25
            diceMod  = 1

            this.profile = 'assassin'
            imgPath  = `assassin/${rng(1,1)}`
        }
        else if(randomEnemyProfile === 'minion'){
            lifeMod  = 0.1
            powerMod = 0.5
            defMod   = 0.5
            diceMod  = 0.5

            this.profile = 'minion'
            imgPath  = `minion/${rng(1,1)}`
        }

        //Set boss mods
        if(gameState.stage % gameState.bossFrequency === 0){//boss
            lifeMod  += 0.5
            powerMod += 0.25
            defMod   += 0.25
            diceMod  += 0.25

            this.profile = 'boss'
            imgPath  = `boss/${rng(12,1)}`
            // el('enemyImg').classList.add('boss')//Swaps image to boss
        }


        //Set stats
        // mod(0.5) -> Get +1 every 2 stages
        this.life    = 4 + Math.round((8   + gameState.stage) * lifeMod ) //+ rng(4)
        this.power   = 0 + Math.round((0.2 * gameState.stage) * powerMod) 
        this.def     = 0 + Math.round((0.2 * gameState.stage) * defMod  )
        this.dice    = 4 + Math.round((0.2 * gameState.stage) * diceMod )
        
        //Misc
        this.flatLife = this.life
        this.level    = gameState.stage
        // this.image    = `./img/enemy/${imgPath}.png`
        this.poisoned = false
        this.poisonStacks = 0
        this.crit = false
    }
}

//Classes
class ItemObj {
    constructor(itemName, iLvl){

        //Static properties taken from reference
        this.actions = []

        //Finds item by item name property
        let itemData = findByProperty(itemsRef, 'itemName', itemName)
        
        
        //set iLvl to stage val
        if(iLvl === undefined && gameState !== undefined){
            iLvl = gameState.stage
        }else{
            iLvl = 1
        } 

        //Gen variable properties
        let props = [
            {key:'itemName'    ,val: upp(itemName)},
            {key:'itemType'    ,val: 'generic'},
            {key:'itemId'      ,val: "it" + Math.random().toString(8).slice(2)},//gens unique id
            {key:'equipped'    ,val: false},
            {key:'passiveStats',val: []},
            // {key:'durability'  ,val: 10},
            // {key:'cost'        ,val: 12}, 
        ]

        
        //Resolve props via default value above, or value from reference object
        props.forEach(property => {

            // console.log(property.key, property.val);

            if(itemData[property.key] === undefined || itemData[property.key] === ''){
                this[property.key] = property.val //if no prop, set it to extra props value
            }
            else {
                this[property.key] = itemData[property.key] //if exists in ref, set it as ref.
            }
        })


        //Gen item actions
        if(itemData.actions.length === 0){
            itemData.actions = []
        }

        if(itemData.actions !== undefined){
            itemData.actions.forEach(actionKey =>{
                this.actions.push(new ActionObj(actionKey))
            })
        }   
    }
}

//
class ActionObj {
    constructor(actionKey){
        //Static props
        this.actionKey = actionKey
        

        //Variable properties generated
        let props = [
            {key:'actionName'  ,val: upp(actionKey)},
            {key:'actionId'    ,val: "ac" + Math.random().toString(8).slice(2)},//gens unique id
            {key:'actionCharge',val: 10},
            {key:'actionMod'   ,val: 0},
            {key:'cooldown'    ,val: undefined},
            {key:'actionType'  ,val: 'generic'},
            {key:'desc'        ,val: ''},
            {key:'passiveStats',val: []},
            {key:'keyId'       ,val: '???'}
        ]

        //Resolves extra props
        props.forEach(property => {

            // console.log(property)

            //Find action by actionName
            let actionData = findByProperty(actionsRef, 'actionName', actionKey)

            if(typeof actionData[property.key] === 'undefined' || actionData[property.key] === ''){
                this[property.key] = property.val //if no prop, set it to extra props vlaue
            }
            else {
                this[property.key] = actionData[property.key] //if exists in ref, set it as red.
            }

            //Set action charge of all passive items to 1.
            if(actionData.actionType === 'passive' && property.key === 'actionCharge'){
                this.actionCharge = 1 
            } 
        })
    }
}

//Rewards
let rewardRef = [
    {rewardType:'Item'    ,freq: 1, desc: 'Get random item (requires empty slot)'}, 
    // {rewardType:'Action'  ,freq: 1, desc: 'Get random item (requires empty slot)'}, 

    // {rewardType:'Train'   ,freq: 1, desc: 'Increase maximum life'},
    // {rewardType:'Enhance' ,freq: 1, desc: 'Increase defence'},
    // {rewardType:'Power'   ,freq: 1, desc: 'Increase power by 1'},
    // {rewardType:'Heal'    ,freq: 1, desc: 'Restore life'},
    // {rewardType:'Repair'  ,freq: 1, desc: 'Repair random item'},
    // {rewardType:'Bag'     ,freq: 1, desc: 'Gain an additional actions slot'},
    // {rewardType:'Gold'    ,freq: 1, desc: 'Gold rewad'},
]

//Ene actions
let eneActionRef = {
    Attack:      {        action: 'Attack'     ,desc: `Attack`},
    Block:       {rate:1, action: 'Block'      ,desc: `Block`},
    Multistrike: {rate:2, action: 'Multistrike',desc: `Multistrike`},
    Fortify:     {rate:3, action: 'Fortify'    ,desc: `Armor up!`},
    Empower:     {rate:2, action: 'Empower'    ,desc: `More POWER!`},
    Rush:        {rate:2, action: 'Rush'       ,desc: `Larger dice!`},

    Sleep:       {rate:1, action: 'Sleep'      ,desc: `Zzzz...`,},
    Detonate:    {rate:1, action: 'Detonate'   ,desc: `Detonate on death`},
    Recover:     {        action: 'Recover'    ,desc: `Recover`},
    Crit:        {rate:1, action: 'Crit'       ,desc: `Prepares to crit next turn`},

    // "poi att":  {rate:1,   desc: `Will attack with poison for ${dmgVal}`},
    // "fire att": {rate:1,   desc: `Will attack with fire for ${dmgVal}`},
    
    // "recover":  {rate:1,   desc: `Will recover lost stats`},
    // "def break":{rate:1,   desc: `Will reduce your def by ${dmgVal}`},
    // "buff":     {rate:1,   desc: `Will use random buff spell`},
    // "debuff":   {rate:1,   desc: `Will use random debuff spell`},
    

    // "recruits": {rate:1,   desc: `Will call reinforcements`},
    
    // "spell":    {rate:1,   desc: `Will cast a <random spell>`},
    // "reflect":  {rate:1,   desc: `Will reflect any spell or attack to character that targets this`},
    // "disarm":   {rate:1,   desc: `Will steal item used against it during the next turn`},
    // "theft":    {rate:1,   desc: `Will steal random item`},   
    // "command":  {rate:1,   desc: `Will redirect actions of all enemies on you`},
    // "consume":  {rate:1,   desc: `Enemy will consume a random consumable from targets inventory`},
    // "escape":   {rate:1,   desc: `Will escape`},
    //"crit":
}

//Tree -> Nodes
let treeRef = [
    //Core stats
    {id:'add-life'      ,desc:'add 10 base life'         , passiveStats:[{stat:'life', value:10}],},
    {id:'percent-life'  ,desc:'increse base life by 25%' , passiveStats:[{stat:'life%', value:25}],},

    {id:'add-def'       ,desc:'gain 1 basse def'         ,nodeType:'baseDef'     ,nodeMod: 1   },
    {id:'add-power'     ,desc:'gain 1 base power'        ,nodeType:'basePower'   ,nodeMod: 1   },
    {id:'add-dice'      ,desc:'gain 2 to base dice'      ,nodeType:'baseDice'    ,nodeMod: 2   },
    {id:'add-inventory'},


    //Recovery
    {id:'add-regen-per-turn'}, //Regen N life per turn or combat.
    {id:'add-regen-per-combat'},
    
    {id:'add-leech'}, //Recover % of damage dealt
    
    
    //On hit effects
    {id:'ext-dmg'}, //Deal +1 damage
    {id:"ext-def-break-dmg"}, //Break 1 def on hit.


    //Extra defences
    {id:'add-def-per-power'}, //+1 def per point of power.


    //Action specific
    {id:'improve-barrier'}, //improve barrier by 25%


    //Cooldown actions
    {id:'less-cd'}, //Cooldowns recover 1 turn faster


    //Extra actions


    //Gold


    //Exp


    //Aaction charge
    {id:'chance-save-ac'}, //20% chance to not loose actionCharge on use <item type>


    //Ideas
    //All fireballs that you draft have +5 charge.
]

//Convert action id to strings
actionsRef.forEach(action => {
    action.keyId = `a${action.keyId}`
})
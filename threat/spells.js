let DEBUGMODE = false;

let borders = {
  taunt: [3, '#ffa500'],
};

function getThreatCoefficient(values) {
  if (typeof values === 'number') {
    values = { 0: values };
  }
  if (!(0 in values)) values[0] = 1;
  return function (spellSchool = 0) {
    if (spellSchool in values) return values[spellSchool];
    return values[0];
  };
}

const preferredSpellSchools = {
  Mage: 16, // Frost
  Priest: 2, // Holy
  Paladin: 2, // Holy
  Warlock: 32, // Shadow
  // Others will be defaulted to 1 = physical
};

const baseThreatCoefficients = {
  Rogue: getThreatCoefficient(0.71),
  // Others will be defaulted to 1
};

const buffNames = {
  1038: 'Blessing of Salvation',//拯救祝福
  25895: 'Greater Blessing of Salvation',//强效拯救
  25909: 'Tranquil Air Totem',//萨满宁静图腾
  71: 'Defensive Stance',//防御姿态
  2457: 'Battle Stance',//战斗姿态
  2458: 'Berserker Stance',//狂暴姿态
  5487: 'Bear Form',//熊形态
  9634: 'Dire Bear Form',//巨熊形态
  768: 'Cat Form',//猎豹形态
  25780: 'Righteous Fury',//正义之怒
};

const buffMultipliers = {
  1038: getThreatCoefficient(0.7), // BoS
  25895: getThreatCoefficient(0.7), // GBoS
  25909: getThreatCoefficient(0.8), // Tranquil Air Totem Aura
  71: getThreatCoefficient(1.3), // Defensive Stance
  2457: getThreatCoefficient(0.8), // Battle Stance
  2458: getThreatCoefficient(0.8), // Berserker Stance
  5487: getThreatCoefficient(1.3), // Bear Form
  9634: getThreatCoefficient(1.3), // Dire Bear Form
  768: getThreatCoefficient(0.71), // Cat Form
  25780: getThreatCoefficient({ 2: 1.6 }), // Righteous Fury
  26400: getThreatCoefficient(0.3), // Fetish of the Sand Reaver 奥术环绕
};

// The leaf elements are functions (buffs,rank) => threatCoefficient
const talents = {
  Warrior: {
    'Defiance': {
      maxRank: 5,
      coeff: function (buffs, rank = 5) {
        if (!(71 in buffs)) return getThreatCoefficient(1);
        return getThreatCoefficient(1.43);
      },
    },
  },
  Druid: {
    'Feral Instinct': {
      maxRank: 5,
      coeff: function (buffs, rank = 5) {
        if (!(5487 in buffs) && !(9634 in buffs))
          return getThreatCoefficient(1);
        return getThreatCoefficient((1.3 + 0.03 * rank) / 1.3);
      },
    },
  },
  Mage: {
    'Arcane Subtlety': {
      maxRank: 2,
      coeff: (_, rank = 2) => getThreatCoefficient({ 64: 1 - 0.2 * rank }),
    },
    'Burning Soul': {
      maxRank: 2,
      coeff: (_, rank = 2) => getThreatCoefficient({ 4: 1 - 0.15 * rank }),
    },
    'Frost Channeling': {
      maxRank: 3,
      coeff: (_, rank = 3) => getThreatCoefficient({ 16: 1 - 0.1 * rank }),
    },
  },
  Paladin: {
    'Improved Righteous Fury': {
      maxRank: 3,
      coeff: function (buffs, rank = 3) {
        if (!(25780 in buffs)) return getThreatCoefficient(1);
        let amp = 1 + Math.floor((rank * 50) / 3) / 100;
        return getThreatCoefficient({ 2: (1 + 0.6 * amp) / 1.6 });
      },
    },
  },
  Priest: {
    'Silent Resolve': {
      maxRank: 5,
      coeff: (_, rank = 5) => getThreatCoefficient(1 - 0.04 * rank),
    },
    'Shadow Affinity': {
      maxRank: 3,
      coeff: (_, rank = 3) =>
        getThreatCoefficient({ 32: 1 - Math.floor((rank * 25) / 3) / 100 }),
    },
  },
  Shaman: {
    'Healing Grace': {
      maxRank: 3,
      coeff: (_, rank = 3, spellId) =>
        getThreatCoefficient(
          1 -
            0.05 *
              rank *
              (spellId in
                {
                  // 次级治疗波
                  8004: true,
                  8008: true,
                  8010: true,
                  10466: true,
                  10467: true,
                  10468: true, // Lesser Healing Wave
                  25420: true,
                  // 治疗波
                  331: true,
                  332: true,
                  547: true,
                  913: true,
                  939: true,
                  959: true,
                  8005: true,
                  10395: true,
                  10396: true,
                  25357: true, // Healing Wave
                  25391: true,
                  25396: true,
                  // 治疗链
                  1064: true,
                  10622: true,
                  10623: true, // Chain Heal
                  25422: true,
                  25423: true,
                  // 大地之盾
                  32594: true
                })
        ),
    },
  },
};

// These make dots green-bordered
const invulnerabilityBuffs = {
  498: 'Divine Protection',//圣佑术1
  5573: 'Divine Protection',//圣佑术2
  642: 'Divine Shield',//圣盾术1
  1020: 'Divine Shield',//圣盾术2
  1022: 'Blessing of Protection',//保护祝福1
  5599: 'Blessing of Protection',//保护祝福2
  10278: 'Blessing of Protection',//保护祝福3
  11958: 'Ice Block',//急速冷却
  3169: 'LIP', // Limited Invulnerability Potion //无敌
  19752: 'Divine Intervention',//神圣干涉
  6724: 'Light of Elune',//月神之光
};
// These make dots yellow-bordered
const aggroLossBuffs = {
  118: true,//变形术1
  12824: true,//变形术2
  12825: true,//变形术3
  28272: true,//变猪术
  28271: true,//变龟术
  12826: true, // Mages' Polymorph 变形术4
  23023: true, // Razorgore Conflagrate 燃烧
  23310: true, //时间流逝
  23311: true,
  23312: true, // Chromaggus Time Lapse 时间流逝
  22289: true, // Brood Power: Green 雏龙之语：绿色
  20604: true, // Lucifron Dominate Mind 统御意志
  24327: true, // Hakkar's Cause Insanity 疯狂
  23603: true, // Nefarian: Wild Polymorph 狂野变形
  26580: true, // Princess Yauj: Fear 恐惧
};
// These make dots orange
const fixateBuffs = {
  355: true, // Taunt 嘲讽
  1161: true, // Challenging Shout 挑战怒吼
  5209: true, // Challenging Roar 挑战咆哮
  6795: true, // Growl 低吼
  694: true, // 惩戒痛击1
  7400: true, // 惩戒痛击2
  7402: true, // 惩戒痛击3
  20559: true, // 惩戒痛击4
  20560: true, // Mocking Blow 惩戒痛击5
  25266: true, // 惩戒痛击6
  29060: true, // Deathknight Understudy Taunt 嘲讽
};
// These make a dot in the graph on application and removal
// Also used for event filtering in fetchWCLreport
const notableBuffs = {
  23397: true, // Nefarian's warrior class call 狂暴
  23398: true, // Druid class call 自然变形
};
for (let k in buffMultipliers) notableBuffs[k] = true;
for (let k in invulnerabilityBuffs) notableBuffs[k] = true;
for (let k in aggroLossBuffs) notableBuffs[k] = true;
for (let k in fixateBuffs) notableBuffs[k] = true;

const auraImplications = {
  Warrior: {
    // 2457战斗之态，2458狂暴姿态，71防御姿态
    7384: 2457,
    7887: 2457,
    11584: 2457,
    11585: 2457, //Overpower 压制
    100: 2457,
    6178: 2457,
    11578: 2457, //Charge 冲锋
    6343: 2457,
    8198: 2457,
    8204: 2457,
    8205: 2457,
    11580: 2457,
    11581: 2457,
    25264: 2457, //Thunderclap 雷霆一击
    694: 2457,
    7400: 2457,
    7402: 2457,
    20559: 2457,
    20560: 2457,
    25266: 2457, //Mocking Blow 惩戒痛击
    20230: 2457, //Retaliation 反击风暴
    12292: 2457, //Sweeping Strikes 死亡之愿
    20252: 2458,
    20617: 2458,
    20616: 2458,
    25272: 2457,
    25275: 2457, //Intercept 拦截
    1680: 2458, //Whirlwind 旋风斩
    18499: 2458, //Berserker Rage 狂暴之怒
    1719: 2458, //Recklessness 鲁莽
    6552: 2458,
    6554: 2458, //Pummel 拳击
    355: 71, //Taunt 嘲讽
    676: 71, //Disarm 缴械
    6572: 71,
    6574: 71,
    7379: 71,
    11600: 71,
    11601: 71,
    25288: 71,
    25269: 71,
    30357: 71, //Revenge 复仇
    2565: 71, //Shield Block 盾牌格挡
    871: 71, //Shield Wall 盾墙
    30022: 71 //毁灭打击
  },
  Druid: {
    // 768猎豹形态， 9634巨熊形态
    6807: 9634,
    6808: 9634,
    6809: 9634,
    8972: 9634,
    9745: 9634,
    9880: 9634,
    9881: 9634, 
    26996: 9634, //Maul 重殴
    779: 9634,
    780: 9634,
    769: 9634,
    9754: 9634,
    9908: 9634, 
    26997: 9634, //Swipe 横扫
    99: 9634,
    1735: 9634,
    9490: 9634,
    9747: 9634,
    9898: 9634,
    26998: 9634, //Demoralizing Roar 挫志咆哮
    6795: 9634, //Growl 低吼
    5229: 9634, //Enrage 激怒
    17057: 9634, //Furor 激怒
    33987: 9634, // 裂伤
    33745: 9634, // 割伤
    8983: 9634, //Bash 猛击
    27011: 9634, //精灵之火
    27000: 768, //Claw 爪击
    27002: 768, //Shred 撕碎7
    9904: 768, //Rake 斜掠
    24248: 768, //Ferocious Bite 凶猛撕咬6
    27005: 768, //Ravage 毁灭5
    27008: 768, //Rip 割裂
    27006: 768, //Pounce 突袭
    9913: 768, //Prowl 潜行
    9846: 768, //Tiger's Fury 猛虎之怒
    33357: 768, //Dash 急奔3
    33983: 768, // 裂伤3
  },
};

const threatFunctions = {
  sourceThreatenTarget(
    ev,
    fight,
    amount,
    useThreatCoeffs = true,
    extraCoeff = 1
  ) {
    // extraCoeff is only used for tooltip text
    let a = fight.eventToUnit(ev, 'source');
    let b = fight.eventToUnit(ev, 'target');
    if (!a || !b) return;
    let coeff = (useThreatCoeffs ? a.threatCoeff(ev.ability) : 1) * extraCoeff;
    b.addThreat(a.key, amount, ev.timestamp, ev.ability.name, coeff);
  },
  unitThreatenEnemiesSplit(ev, unit, fight, amount, useThreatCoeffs = true) {
    let u = fight.eventToUnit(ev, unit);
    if (!u) return;
    let coeff = useThreatCoeffs ? u.threatCoeff(ev.ability) : 1;
    let [_, enemies] = fight.eventToFriendliesAndEnemies(ev, unit);
    let numEnemies = 0;
    for (let k in enemies) {
      if (enemies[k].alive) numEnemies += 1;
    }
    for (let k in enemies) {
      enemies[k].addThreat(
        u.key,
        amount / numEnemies,
        ev.timestamp,
        ev.ability.name,
        coeff
      );
    }
  },
  unitLeaveCombat(ev, unit, fight, text) {
    let u = fight.eventToUnit(ev, unit);
    if (!u) return;
    for (let k in fight.units) {
      if (!('threat' in fight.units[k]) || !(u.key in fight.units[k].threat))
        continue;
      fight.units[k].setThreat(u.key, 0, ev.timestamp, text);
    }
  },
  threatWipe(sources, targets, time, text) {
    for (let a in sources) {
      let source = sources[a];
      for (let targetKey in targets) {
        source.setThreat(targetKey, 0, time, text);
      }
    }
  },
  concat() {
    return (ev, fight) => {
      for (let i = 0; i < arguments.length; ++i) {
        // Arguments is from outer func
        arguments[i](ev, fight);
      }
    };
  },
};

function handler_invisibility(ev, fight) {
  if (ev.type !== 'cast') return;
  threatFunctions.unitLeaveCombat(ev, 'source', fight, ev.ability.name);
}

function handler_soulshatter(ev, fight) {
  if (ev.type !== 'cast') return;
  threatFunctions.unitLeaveCombat(ev, 'source', fight, ev.ability.name);
}

function handler_vanish(ev, fight) {
  if (ev.type !== 'cast') return;
  threatFunctions.unitLeaveCombat(ev, 'source', fight, ev.ability.name);
}
function handler_mindcontrol(ev, fight) {
  // Event target resets threat on everything on debuff apply and deapply.
  // Not sure if this is the real behaviour...
  if (ev.type === 'applydebuff') {
    threatFunctions.unitLeaveCombat(ev, 'target', fight, ev.ability.name);
  } else if (ev.type === 'removedebuff') {
    threatFunctions.unitLeaveCombat(
      ev,
      'target',
      fight,
      ev.ability.name + ' fades'
    );
  }
}

function handler_energize(ev, fight) {
  if (ev.type !== 'energize') return;
  let diff = ev.resourceChange - ev.waste;
  // Not sure if threat should be given to "target" instead...
  threatFunctions.unitThreatenEnemiesSplit(
    ev,
    'source',
    fight,
    ev.resourceChangeType === 0 ? diff / 2 : diff * 5,
    false
  );
}
function handler_energizeCoeff(ev, fight) {
  if (ev.type !== 'energize') return;
  let diff = ev.resourceChange - ev.waste;
  // Not sure if threat should be given to "target" instead...
  threatFunctions.unitThreatenEnemiesSplit(
    ev,
    'source',
    fight,
    ev.resourceChangeType === 0 ? diff / 2 : diff * 5,
    true
  );
}

function handler_basic(ev, fight) {
  switch (ev.type) {
    case 'damage':
      threatFunctions.sourceThreatenTarget(
        ev,
        fight,
        ev.amount + (ev.absorbed || 0)
      );
      break;
    case 'heal':
      if (ev.sourceIsFriendly !== ev.targetIsFriendly) return;
      threatFunctions.unitThreatenEnemiesSplit(
        ev,
        'source',
        fight,
        ev.amount / 2
      );
      break;
    case 'energize':
      if (DEBUGMODE) console.log('Unhandled energize.', ev);
      handler_energize(ev, fight);
      break;
    case 'applybuff':
    case 'refreshbuff':
    case 'applybuffstack':
      if (DEBUGMODE) console.log('Unhandled buff.', ev);
      if (ev.sourceIsFriendly !== ev.targetIsFriendly) return;
      threatFunctions.unitThreatenEnemiesSplit(ev, 'source', fight, 60);
      break;
    case 'applydebuff':
    case 'applydebuffstack':
    case 'refreshdebuff':
      if (DEBUGMODE) console.log('Unhandled buff.', ev);
      if (ev.sourceIsFriendly !== ev.targetIsFriendly) return;
      threatFunctions.sourceThreatenTarget(ev, fight, 120);
      break;
    case 'death':
    case 'combatantinfo':
    case 'encounterstart':
    case 'encounterend':
    case 'begincast':
    case 'removebuffstack':
    case 'removedebuffstack':
    case 'extraattacks':
      break;
    default:
      if (DEBUGMODE) console.log('Unhandled event.', ev);
  }
}

function handler_mark(ev, fight) {
  if (ev.type !== 'cast') return;
  if ('target' in ev && ev.target.id === -1) return; // Target is environment
  let a = fight.eventToUnit(ev, 'source');
  let b = fight.eventToUnit(ev, 'target');
  if (!a || !b) return;
  a.targetAttack(b.key, ev.timestamp, ev.ability.name);
  if (ev.ability.guid === 1 || ev.ability.guid < 0) {
    a.target = b;
  }
}

function handler_markSourceOnMiss(border) {
  return (ev, fight) => {
    if (ev.type !== 'damage') return;
    if (ev.hitType !== 0 && ev.hitType <= 6) return;
    let a = fight.eventToUnit(ev, 'source');
    let b = fight.eventToUnit(ev, 'target');
    if (!a || !b) return;
    b.addMark(a.key, ev.timestamp, 'Missed ' + ev.ability.name, border);
  };
}

function handler_markSourceOnDebuff(border) {
  return (ev, fight) => {
    if (!['applydebuff', 'applydebuffstack', 'refreshdebuff'].includes(ev.type))
      return;
    let a = fight.eventToUnit(ev, 'source');
    let b = fight.eventToUnit(ev, 'target');
    if (!a || !b) return;
    let s = ev.ability.name;
    //if (ev.type === "removedebuff") s += " fades";
    b.addMark(a.key, ev.timestamp, s, border);
  };
}

function handler_zero() {}

function handler_castCanMiss(threatValue) {
  return (ev, fight) => {
    let t = ev.type;
    if (t === 'cast') {
      threatFunctions.sourceThreatenTarget(ev, fight, threatValue);
    } else if (t === 'damage') {
      threatFunctions.sourceThreatenTarget(ev, fight, -threatValue);
    }
  };
}

function handler_castCanMissNoCoefficient(threatValue) {
  return (ev, fight) => {
    let t = ev.type;
    if (t === 'cast') {
      threatFunctions.sourceThreatenTarget(ev, fight, threatValue, false);
    } else if (t === 'damage') {
      threatFunctions.sourceThreatenTarget(ev, fight, -threatValue, false);
    }
  };
}

function handler_modDamage(multiplier) {
  return (ev, fight) => {
    if (ev.type !== 'damage') return;
    threatFunctions.sourceThreatenTarget(
      ev,
      fight,
      ev.amount + (ev.absorbed || 0),
      true,
      multiplier
    );
  };
}
function handler_modHeal(multiplier) {
  return (ev, fight) => {
    if (ev.type !== 'heal') return;
    threatFunctions.unitThreatenEnemiesSplit(
      ev,
      'source',
      fight,
      (multiplier * ev.amount) / 2
    );
  };
}

function handler_modDamagePlusThreat(multiplier, bonus) {
  return (ev, fight) => {
    if (ev.type !== 'damage' || ev.hitType > 6 || ev.hitType === 0) return;
    threatFunctions.sourceThreatenTarget(
      ev,
      fight,
      multiplier * (ev.amount + (ev.absorbed || 0)) + bonus
    );
  };
}

function handler_damage(ev, fight) {
  if (ev.type !== 'damage') return;
  threatFunctions.sourceThreatenTarget(
    ev,
    fight,
    ev.amount + (ev.absorbed || 0)
  );
}

function handler_heal(ev, fight) {
  if (ev.type !== 'heal') return;
  threatFunctions.unitThreatenEnemiesSplit(ev, 'source', fight, ev.amount / 2);
}

// TODO
function handler_threatOnHuiMie() {
  return (ev, fight) => {
    console.log('fk', ev, ev.hitType, ev.amount)
    if (ev.type !== 'damage' || ev.hitType > 6 || ev.hitType === 0) return;
    threatFunctions.sourceThreatenTarget(
      ev,
      fight,
      ev.amount + 176
    );
  };
}

function handler_threatOnHit(threatValue) {
  return (ev, fight) => {
    if (threatValue === 222){
      console.log('fk', ev)
    }
    if (ev.type !== 'damage' || ev.hitType > 6 || ev.hitType === 0) return;
    threatFunctions.sourceThreatenTarget(
      ev,
      fight,
      ev.amount + (ev.absorbed || 0) + threatValue
    );
  };
}

function handler_bossDropThreatOnHit(pct) {
  return (ev, fight) => {
    // hitType 0=miss, 7=dodge, 8=parry, 10 = immune, 14=resist, ...
    // https://discordapp.com/channels/383596811517952002/673932163736928256/714590608819486740
    // [00:27] ResultsMayVary: Just to expand on this. Spell threat drops (resists) cause threat loss. Physical misses (dodges/parries) do not cause threat drops.
    if (
      ev.type !== 'damage' ||
      (ev.hitType > 6 && ev.hitType !== 10 && ev.hitType !== 14) ||
      ev.hitType === 0
    )
      return;
    let a = fight.eventToUnit(ev, 'source');
    let b = fight.eventToUnit(ev, 'target');
    if (!a || !b) return;
    a.checkTargetExists(b.key, ev.timestamp);
    a.setThreat(
      b.key,
      a.threat[b.key].currentThreat * pct,
      ev.timestamp,
      ev.ability.name
    );
  };
}
function handler_bossDropThreatOnDebuff(pct) {
  return (ev, fight) => {
    if (ev.type !== 'applydebuff') return;
    let a = fight.eventToUnit(ev, 'source');
    let b = fight.eventToUnit(ev, 'target');
    if (!a || !b) return;
    a.checkTargetExists(b.key, ev.timestamp);
    a.setThreat(
      b.key,
      a.threat[b.key].currentThreat * pct,
      ev.timestamp,
      ev.ability.name
    );
  };
}
function handler_bossDropThreatOnCast(pct) {
  return (ev, fight) => {
    if (ev.type !== 'cast') return;
    let a = fight.eventToUnit(ev, 'source');
    let b = fight.eventToUnit(ev, 'target');
    if (!a || !b) return;
    a.checkTargetExists(b.key, ev.timestamp);
    a.setThreat(
      b.key,
      a.threat[b.key].currentThreat * pct,
      ev.timestamp,
      ev.ability.name
    );
  };
}
function handler_bossThreatWipeOnCast(ev, fight) {
  if (ev.type !== 'cast') return;
  let u = fight.eventToUnit(ev, 'source');
  if (!u) return;
  for (let k in u.threat) {
    u.setThreat(k, 0, ev.timestamp, ev.ability.name);
  }
}
function handler_bossPartialThreatWipeOnCast(pct) {
  return (ev, fight) => {
    if (ev.type !== 'cast') return;
    let u = fight.eventToUnit(ev, 'source');
    if (!u) return;
    for (let k in u.threat) {
      u.setThreat(
        k,
        u.threat[k].currentThreat * pct,
        ev.timestamp,
        ev.ability.name
      );
    }
  };
}

function handler_threatOnDebuff(threatValue) {
  return (ev, fight) => {
    let t = ev.type;
    if (t !== 'applydebuff' && t !== 'refreshdebuff') return;
    threatFunctions.sourceThreatenTarget(ev, fight, threatValue);
  };
}

function handler_threatOnDebuffOrDamage(threatValue) {
  return (ev, fight) => {
    let t = ev.type;
    if (t === 'applydebuff') {
      threatFunctions.sourceThreatenTarget(ev, fight, threatValue);
    } else if (t === 'damage') {
      threatFunctions.sourceThreatenTarget(
        ev,
        fight,
        ev.amount + (ev.absorbed || 0)
      );
    }
  };
}

function handler_threatOnBuff(threatValue) {
  return (ev, fight) => {
    let t = ev.type;
    if (t !== 'applybuff' && t !== 'refreshbuff') return;
    threatFunctions.unitThreatenEnemiesSplit(ev, 'source', fight, threatValue);
  };
}

function handler_taunt(ev, fight) {
  if (ev.type !== 'applydebuff') return;
  let u = fight.eventToUnit(ev, 'target');
  let v = fight.eventToUnit(ev, 'source');
  if (!u || !v) return;
  if (!('threat' in u)) return;
  let maxThreat = 0;
  for (let k in u.threat) {
    maxThreat = Math.max(maxThreat, u.threat[k].currentThreat);
  }
  u.setThreat(v.key, maxThreat, ev.timestamp, ev.ability.name);
  u.target = v;
}

function handler_timelapse(ev, fight) {
  if (ev.type !== 'applydebuff') return;
  let u = fight.eventToUnit(ev, 'source');
  let v = fight.eventToUnit(ev, 'target');
  if (!u || !v) return;
  u.setThreat(
    v.key,
    u.threat[v.key].currentThreat * v.threatCoeff(),
    ev.timestamp,
    ev.ability.name
  );
}

const spellFunctions = {
  // Boss技能
  18670: handler_bossDropThreatOnHit(0.5), // Broodlord Knock Away 击退
  23339: handler_bossDropThreatOnHit(0.5), // BWL Wing Buffet 龙翼打击
  18392: handler_bossDropThreatOnCast(0), // Onyxia Fireball 火球术
  19633: handler_bossDropThreatOnHit(0.75), // Onyxia Knock Away 击退
  20534: handler_bossDropThreatOnCast(0), // Majordomo Teleport 传送
  20566: handler_bossThreatWipeOnCast, // Wrath of Ragnaros 拉格纳罗斯之怒
  23138: handler_bossThreatWipeOnCast, // Gate of Shazzrah 沙斯拉尔之门
  22289: handler_bossDropThreatOnDebuff(0.5), // Brood Power: Green 雏龙之语：绿色
  24408: handler_bossThreatWipeOnCast, // Bloodlord Mandokir's Charge 冲锋
  24690: handler_bossDropThreatOnDebuff(0), // Hakkar's Aspect of Arlokk 娅尔罗的守护
  //20604: handler_mindcontrol, // Lucifron Dominate Mind
  '-1': handler_bossThreatWipeOnCast, // Custom threat drop, currently for High Priestess Arlokk
  23310: handler_timelapse, // 时间流逝
  23311: handler_timelapse,
  23312: handler_timelapse, // 时间流逝
  800: function (ev, fight) {
    // Twin Emperors' Twin Teleport
    if (ev.type !== 'applybuff') return;
    let u = fight.eventToUnit(ev, 'source');
    for (let k in u.threat) {
      u.setThreat(k, 0, ev.timestamp, ev.ability.name);
    }
  }, // 双子传送
  26102: handler_bossDropThreatOnHit(0), // Ouro's Sand Blast 沙尘爆裂
  26580: handler_bossDropThreatOnHit(0), // Yauj's Fear 恐惧
  26561: handler_bossThreatWipeOnCast, // Vem's Berserker Charge 狂暴冲锋
  11130: handler_bossDropThreatOnHit(0.5), // Qiraji Champion's Knock Away, need to confirm pct 击退
  28408: handler_bossThreatWipeOnCast, // Kel'Thuzad's Chains of Kel'Thuzad 克尔苏加德锁链
  29060: handler_taunt, // Deathknight Understudy Taunt 嘲讽
  28835: handler_bossPartialThreatWipeOnCast(0.5), // Mark of Zeliek 4dk印记
  28834: handler_bossPartialThreatWipeOnCast(0.5), // Mark of Mograine 4dk印记
  28833: handler_bossPartialThreatWipeOnCast(0.5), // Mark of Blaumeux 4dk印记
  28832: handler_bossPartialThreatWipeOnCast(0.5), // Mark of Korth'azz 4dk印记

  17624: handler_vanish, // Flask of Petrification 石化

  // Paladin 圣骑士
  // 强效王者
  25898: handler_threatOnBuff(60), // GBoK
  // 强效光明
  27145: handler_threatOnBuff(60), // GBoL
  // 强效力量
  27141: handler_threatOnBuff(60), // GBoM3
  // 强效拯救
  25895: handler_threatOnBuff(60), // GBoS
  // 强效庇护
  27169: handler_threatOnBuff(60), // GBoSanc
  // 强效智慧
  27143: handler_threatOnBuff(60), // GBoW3
  // 智慧祝福
  27142: handler_threatOnBuff(60), // BoW7
  // 正义圣印
  20293: threatFunctions.concat(handler_threatOnBuff(58), handler_damage), // Seal of Righteousness r8
  // 正义审判
  20286: handler_damage, // Judgement of Righteousness
  // 奉献
  26573: handler_damage, // Consecration r1
  20116: handler_damage, // Consecration r2
  20922: handler_damage, // Consecration r3
  20923: handler_damage, // Consecration r4
  20924: handler_damage, // Consecration r5
  27173: handler_damage, // Consecration r7
  // 愤怒之锤
  27180: handler_damage, // Hammer of Wrath
  // 神圣之盾
  20925: handler_modDamage(1.2), // Holy Shield r1
  20927: handler_modDamage(1.2), // Holy Shield r2
  20928: handler_modDamage(1.2), // Holy Shield r3
  27179: handler_modDamage(1.2), // Holy Shield r3
  // 虔诚光环
  465: handler_zero, // Devotion Aura r1
  10290: handler_zero, // Devotion Aura r2
  643: handler_zero, // Devotion Aura r3
  10291: handler_zero, // Devotion Aura r4
  1032: handler_zero, // Devotion Aura r5
  10292: handler_zero, // Devotion Aura r6
  10293: handler_zero, // Devotion Aura r7
  27149: handler_zero, // Devotion Aura r8
  // 专注光环
  19746: handler_zero, // Concentration Aura
  // 火焰抗性光环
  19891: handler_zero, // Fire Resistance Aura r1
  19899: handler_zero, // Fire Resistance Aura r2
  19900: handler_zero, // Fire Resistance Aura r3
  27153: handler_zero, // Fire Resistance Aura r4
  // 冰霜抗性光环
  19888: handler_zero, // Frost Resistance Aura r1
  19897: handler_zero, // Frost Resistance Aura r2
  19898: handler_zero, // Frost Resistance Aura r3
  27152: handler_zero, // Frost Resistance Aura r4
  // 暗影抗性光环
  19876: handler_zero, // Shadow Resistance Aura r1
  19895: handler_zero, // Shadow Resistance Aura r2
  19896: handler_zero, // Shadow Resistance Aura r3
  27151: handler_zero, // Shadow Resistance Aura r4
  // 惩罚光环
  7294: handler_damage, // Retribution Aura r1
  10298: handler_damage, // Retribution Aura r2
  10299: handler_damage, // Retribution Aura r3
  10300: handler_damage, // Retribution Aura r4
  10301: handler_damage, // Retribution Aura r5
  27150: handler_damage, // Retribution Aura r6
  // 圣洁光环
  20218: handler_zero, // Sanctity Aura
  // Paladin heals have .25 coefficient. Sources:
  // cha#0438 2018-12-04 https://discordapp.com/channels/383596811517952002/456930992557654037/519502645858271243
  //     [15:17] chaboi: but there is a grain of truth in that shitpost since paladin healing threat did get specifically nerfed by blizzard early on so they wouldnt be able to tank dungeons via just healing themselves
  //     [15:18] chaboi: which is why paladin healing threat is 0.5, which is much lower than the other healers even if they talent into threat reduc
  // 4man Onyxia https://classic.warcraftlogs.com/reports/TFqN9Z1HCxnLPypG
  //     Paladin doesn't pull threat when he should at usual .5 heal coefficient.
  // 圣光术
  635: handler_modHeal(0.5), // Holy Light r1
  639: handler_modHeal(0.5), // Holy Light r2
  647: handler_modHeal(0.5), // Holy Light r3
  1026: handler_modHeal(0.5), // Holy Light r4
  1042: handler_modHeal(0.5), // Holy Light r5
  3472: handler_modHeal(0.5), // Holy Light r6
  10328: handler_modHeal(0.5), // Holy Light r7
  10329: handler_modHeal(0.5), // Holy Light r8
  25292: handler_modHeal(0.5), // Holy Light r9
  27135: handler_modHeal(0.5), // Holy Light r10
  27136: handler_modHeal(0.5), // Holy Light r11
  // 圣光闪现
  19750: handler_modHeal(0.5), // Flash of Light r1
  19939: handler_modHeal(0.5), // Flash of Light r2
  19940: handler_modHeal(0.5), // Flash of Light r3
  19941: handler_modHeal(0.5), // Flash of Light r4
  19942: handler_modHeal(0.5), // Flash of Light r5
  19943: handler_modHeal(0.5), // Flash of Light r6
  27137: handler_modHeal(0.5), // Flash of Light r7
  // 圣疗术
  633: handler_modHeal(.5), // Lay on Hands r1 - Generates a total threat of heal * .5 instead of heal * .25
  2800: handler_modHeal(.5), // Lay on Hands r2
  10310: handler_modHeal(.5), // Lay on Hands r3
  27154: handler_modHeal(.5), // Lay on Hands r4
  // 神圣震击
  25914: handler_modHeal(0.5), // Holy Shock r1
  25913: handler_modHeal(0.5), // Holy Shock r2
  25903: handler_modHeal(0.5), // Holy Shock r3
  27174: handler_modHeal(0.5), // Holy Shock r4
  33072: handler_modHeal(0.5), // Holy Shock r5
  // 烈焰惩戒者
  19968: handler_modHeal(0.5), // Holy Light that appears in logs
  // 噩运猎弓
  19993: handler_modHeal(0.5), // Flash of Light that appears in logs

  // Mage 法师
  10181: handler_damage, // Frostbolt
  66: handler_invisibility,

  // Rogue 
  // 盗贼消失等级1，2，3
  1856: handler_vanish,
  1857: handler_vanish, // Vanish
  26889: handler_vanish, 
  // 盗贼佯攻等级1,2,3,4,5,6
  1966: handler_castCanMissNoCoefficient(-150), // Feint r1
  6768: handler_castCanMissNoCoefficient(-240), // Feint r2
  8637: handler_castCanMissNoCoefficient(-390), // Feint r3
  11303: handler_castCanMissNoCoefficient(-600), // Feint r4
  25302: handler_castCanMissNoCoefficient(-800), // Feint r5
  27448: handler_castCanMissNoCoefficient(-1000), // Feint r6

  // Priest
  // 盾
  6788: handler_zero, // Weakened Soul
  // 心灵震爆
  8092: handler_threatOnHit(40), // Mind Blast r1
  8102: handler_threatOnHit(77), // Mind Blast r2
  8103: handler_threatOnHit(121), // Mind Blast r3
  8104: handler_threatOnHit(180), // Mind Blast r4
  8105: handler_threatOnHit(236), // Mind Blast r5
  8106: handler_threatOnHit(303), // Mind Blast r6
  10945: handler_threatOnHit(380), // Mind Blast r7
  10946: handler_threatOnHit(460), // Mind Blast r8
  10947: handler_threatOnHit(540), // Mind Blast r9
  25372: handler_threatOnHit(620), // Mind Blast r10
  25375: handler_threatOnHit(700), // Mind Blast r11
  // 神圣新星
  15237: handler_zero, // Holy Nova r1
  15430: handler_zero, // Holy Nova r2
  15431: handler_zero, // Holy Nova r3
  27799: handler_zero, // Holy Nova r4
  27800: handler_zero, // Holy Nova r5
  27801: handler_zero, // Holy Nova r6
  25331: handler_zero, // Holy Nova r7
  23455: handler_zero, // Holy Nova r1
  23458: handler_zero, // Holy Nova r2
  23459: handler_zero, // Holy Nova r3
  27803: handler_zero, // Holy Nova r4
  27804: handler_zero, // Holy Nova r5
  27805: handler_zero, // Holy Nova r6

  // Warlock
  // 诅咒增幅
  18288: handler_zero, // Amplify Curse
  // 厄运诅咒
  603: handler_threatOnDebuffOrDamage(120), // Curse of Doom
  // 疲劳诅咒
  18223: handler_zero, // Curse of Exhaustion
  // 鲁莽诅咒
  704: handler_threatOnDebuff(2 * 14), // CoR r1
  7658: handler_threatOnDebuff(2 * 28), // CoR r2
  7659: handler_threatOnDebuff(2 * 42), // CoR r3
  11717: handler_threatOnDebuff(2 * 56), // CoR r4
  27226: handler_threatOnDebuff(2 * 70), // CoR r5
  // 暗影诅咒，70移除
  // 17862: handler_threatOnDebuff(2 * 44), // CoS r1
  // 17937: handler_threatOnDebuff(2 * 56), // CoS r2
  // 语言诅咒
  1714: handler_threatOnDebuff(2 * 26), // CoT r1
  11719: handler_threatOnDebuff(2 * 50), // CoT r2
  // 虚弱诅咒
  702: handler_threatOnDebuff(2 * 4), // CoW r1
  1108: handler_threatOnDebuff(2 * 12), // CoW r2
  6205: handler_threatOnDebuff(2 * 22), // CoW r3
  7646: handler_threatOnDebuff(2 * 32), // CoW r4
  11707: handler_threatOnDebuff(2 * 42), // CoW r5
  11708: handler_threatOnDebuff(2 * 52), // CoW r6
  27224: handler_threatOnDebuff(2 * 62), // CoW r7
  30909: handler_threatOnDebuff(2 * 72), // CoW r8
  // 元素诅咒
  1490: handler_threatOnDebuff(2 * 32), // CotE r1
  11721: handler_threatOnDebuff(2 * 46), // CotE r2
  11722: handler_threatOnDebuff(2 * 60), // CotE r3
  27228: handler_threatOnDebuff(2 * 92), // CotE r4
  // 生命分流
  1454: handler_zero, // Life Tap r1
  1455: handler_zero, // Life Tap r2
  1456: handler_zero, // Life Tap r3
  11687: handler_zero, // Life Tap r4
  11688: handler_zero, // Life Tap r5
  11689: handler_zero, // Life Tap r6
  27222: handler_zero, // Life Tap r7
  // 生命分流，有点问题
  31818: handler_zero, // Life Tap script
  // 吸取法力
  5138: handler_zero, // Drain Mana r1
  6226: handler_zero, // Drain Mana r2
  11703: handler_zero, // Drain Mana r3
  11704: handler_zero, // Drain Mana r4
  27221: handler_zero, // Drain Mana r5
  30908: handler_zero, // Drain Mana r6
  // 吸取生命
  689: handler_damage, // Drain Life r1 
  699: handler_damage, // Drain Life r2
  709: handler_damage, // Drain Life r3
  7651: handler_damage, // Drain Life r4
  11699: handler_damage, // Drain Life r5
  11700: handler_damage, // Drain Life r6
  27219: handler_damage, // Drain Life r7
  27220: handler_damage, // Drain Life r8
  // 生命虹吸
  18265: handler_threatOnDebuffOrDamage(2 * 30), // Siphon Life r1
  18879: handler_threatOnDebuffOrDamage(2 * 38), // Siphon Life r2
  18880: handler_threatOnDebuffOrDamage(2 * 48), // Siphon Life r3
  18881: handler_threatOnDebuffOrDamage(2 * 58), // Siphon Life r4
  27264: handler_threatOnDebuffOrDamage(2 * 58), // Siphon Life r5
  30911: handler_threatOnDebuffOrDamage(2 * 58), // Siphon Life r6
  // 放逐
  710: handler_threatOnDebuff(2 * 28), // Banish r1
  18647: handler_threatOnDebuff(2 * 48), // Banish r2
  // 恐惧
  5782: handler_threatOnDebuff(2 * 8), // Fear r1
  6213: handler_threatOnDebuff(2 * 32), // Fear r2
  6215: handler_threatOnDebuff(2 * 56), // Fear r3
  // 腐蚀术
  172: handler_damage, // Corruption r1
  6222: handler_damage, // Corruption r2
  6223: handler_damage, // Corruption r3
  7648: handler_damage, // Corruption r4
  11671: handler_damage, // Corruption r5
  11672: handler_damage, // Corruption r6
  25311: handler_damage, // Corruption r7
  27216: handler_damage, // Corruption r8
  // 痛苦诅咒
  980: handler_damage, // CoA r1
  1014: handler_damage, // CoA r2
  6217: handler_damage, // CoA r3
  11711: handler_damage, // CoA r4
  11712: handler_damage, // CoA r5
  11713: handler_damage, // CoA r6
  27218: handler_damage, // CoA r7
  // 死亡缠绕
  6789: handler_damage, // Death Coil r1
  17925: handler_damage, // Death Coil r2
  17926: handler_damage, // Death Coil r3
  27223: handler_damage, // Death Coil r4
  // 吸取灵魂
  1120: handler_damage, // Drain Soul r1
  8288: handler_damage, // Drain Soul r2
  8289: handler_damage, // Drain Soul r3
  11675: handler_damage, // Drain Soul r4
  27217: handler_damage, // Drain Soul r5
  // 群恐
  5484: handler_threatOnDebuff(2 * 40), // Howl of Terror r1
  17928: handler_threatOnDebuff(2 * 54), // Howl of Terror r2
  // 灼热之痛
  5676: handler_modDamage(2), // Searing Pain r1
  17919: handler_modDamage(2), // Searing Pain r2
  17920: handler_modDamage(2), // Searing Pain r3
  17921: handler_modDamage(2), // Searing Pain r4
  17922: handler_modDamage(2), // Searing Pain r5
  17923: handler_modDamage(2), // Searing Pain r6
  27210: handler_modDamage(2), // Searing Pain r7
  30459: handler_modDamage(2), // Searing Pain r8
  // 暗影箭
  27209: handler_damage,

  // 灵魂碎裂
  29858: handler_soulshatter,

  // Shaman
  8042: handler_modDamage(2), // Earth Shock r1 地震术
  8044: handler_modDamage(2), // Earth Shock r2
  8045: handler_modDamage(2), // Earth Shock r3
  8046: handler_modDamage(2), // Earth Shock r4
  10412: handler_modDamage(2), // Earth Shock r5
  10413: handler_modDamage(2), // Earth Shock r6
  10414: handler_modDamage(2), // Earth Shock r7
  25454: handler_modDamage(2), // Earth Shock r8

  // From ResultsMayVary https://resultsmayvary.github.io/ClassicThreatPerSecond/
  1: handler_damage,
  /* Consumables */
  11374: handler_threatOnDebuff(90, 'Gift of Arthas'), //阿尔萨斯的礼物
  /* Damage/Weapon Procs */
  20007: handler_zero, //("Heroic Strength (Crusader)"), 神圣力量，十字军
  18138: handler_damage, //("Shadow Bolt (Deathbringer Proc)"), 暗影箭
  24388: handler_damage, //("Brain Damage (Lobotomizer Proc)"), 脑部损伤
  23267: handler_damage, //("Firebolt (Perdition's Proc)"), 火球术
  18833: handler_damage, //("Firebolt (Alcor's Proc)"), 火焰箭

  21992: threatFunctions.concat(handler_damage, handler_threatOnDebuff(63)), // Thunderfury 雷霆之怒，风剑
  27648: handler_threatOnDebuff(135, 'Thunderfury'), // 雷霆之怒

  /* Thorn Effects */
  26992: handler_damage, //("Thorns"),  //Thorns (Rank 7) 荆棘术
  17275: handler_damage, //("Heart of the Scale"), //Heart of the Scale 龙鳞之心
  22600: handler_damage, //("Force Reactive Disk"), //Force Reactive 力反馈盾牌
  11350: handler_zero, //("Oil of Immolation"),   //Oil of Immolation (buff) 火焰之盾
  11351: handler_damage, //("Oil of Immolation"), //Oil of Immolation (dmg) 火焰之盾

  /* Explosives */
  13241: handler_damage, //("Goblin Sapper Charge"), //Goblin Sapper Charge

  /* Zero Threat Abilities */
  71: handler_zero, // Defensive Stance 防御姿态
  2457: handler_zero, // Battle Stance 战斗姿态
  2458: handler_zero, // Berserker Stance 狂暴姿态
  10610: handler_zero, //("Windfury Totem"), //Windfury Totem 风怒
  20572: handler_zero, //("Blood Fury"), //Blood Fury 兽人血性狂怒
  26296: handler_zero, //("Berserking (Troll racial)"), //Berserking (Troll racial) 巨魔狂暴
  26635: handler_zero, //("Berserking (Troll racial)"), //Berserking (Troll racial) 巨魔狂暴
  22850: handler_zero, //("Sanctuary"), //Sanctuary 庇护，护甲提高300
  9515: handler_zero, //("Summon Tracking Hound"), //Summon Tracking Hound 召唤追踪犬

  /* Consumable Buffs (zero-threat) */
  10667: handler_zero, //("Rage of Ages"), //Rage of Ages 远古之怒
  25804: handler_zero, //("Rumsey Rum Black Label"), //Rumsey Rum Black Label 黑标朗姆酒
  17038: handler_zero, //("Winterfall Firewater"), //Winterfall Firewater 冬泉火酒
  8220: handler_zero, //("Savory Deviate Delight (Flip Out)"), //Savory Deviate Delight (Flip Out) 精神错乱
  17543: handler_zero, //("Fire Protection"), //Fire Protection 防护火焰
  17548: handler_zero, //("Greater Shadow Protection Potion"), //Greater Shadow Protection Potion 防护暗影
  18125: handler_zero, //("Blessed Sunfruit"), //Blessed Sunfruit 神圣太阳果
  17538: handler_zero, //("Elixir of the Mongoose"), //Elixir of the Mongoose 猫鼬
  11359: handler_zero, //("Restorative Potion (Restoration) Buff"), //Restorative Potion (Restoration) Buff 恢复
  23396: handler_zero, //("Restorative Potion (Restoration) Dispel"), //Restorative Potion (Restoration) Dispel 恢复

  /* Physical */
  12721: handler_damage, //("Deep Wounds"), 重伤
  6552: handler_threatOnHit(76, 'Pummel (Rank 1)'), //TODO: Verify these values ingame 拳击
  6554: handler_threatOnHit(116, 'Pummel (Rank 2)'), // 拳击

  23881: handler_damage, //("Bloodthirst"), //Rank 1 嗜血
  23892: handler_damage, //("Bloodthirst"), //Rank 2
  23893: handler_damage, //("Bloodthirst"), //Rank 3
  23894: handler_damage, //("Bloodthirst"), //Rank 4
  25251: handler_damage, //("Bloodthirst"), //Rank 5
  30335: handler_damage, //("Bloodthirst"), //Rank 6
  23888: handler_zero, //("Bloodthirst"),   //Buff 嗜血
  23885: handler_zero, //("Bloodthirst"),   //Buff 嗜血
  23891: handler_heal, // BT heal buff 嗜血

  // 致死打击
  30330: handler_damage, // Rank 6

  //Heroic Strike 英勇打击
  78: handler_threatOnHit(16, 'Heroic Strike'),
  284: handler_threatOnHit(39, 'Heroic Strike'),
  285: handler_threatOnHit(59, 'Heroic Strike'),
  1608: handler_threatOnHit(78, 'Heroic Strike'),
  11564: handler_threatOnHit(98, 'Heroic Strike'),
  11565: handler_threatOnHit(118, 'Heroic Strike'),
  11566: handler_threatOnHit(137, 'Heroic Strike'),
  11567: handler_threatOnHit(145, 'Heroic Strike'),
  25286: handler_threatOnHit(175, 'Heroic Strike'),
  29707: handler_threatOnHit(184, 'Heroic Strike'),
  30324: handler_threatOnHit(193, 'Heroic Strike'), // (AQ)

  //Shield Slam 盾牌猛击
  23922: handler_threatOnHit(178, 'Shield Slam (Rank 1)'), //Rank 1
  23923: handler_threatOnHit(203, 'Shield Slam (Rank 2)'), //Rank 2
  23924: handler_threatOnHit(229, 'Shield Slam (Rank 3)'), //Rank 3
  23925: handler_threatOnHit(254, 'Shield Slam (Rank 4)'), //Rank 4
  25258: handler_threatOnHit(280, 'Shield Slam (Rank 5)'), //Rank 5
  30356: handler_threatOnHit(304, 'Shield Slam (Rank 6)'), //Rank 6

  // Shield Bash 盾击
  72: handler_modDamagePlusThreat(1.5, 36),
  1671: handler_modDamagePlusThreat(1.5, 96),
  1672: handler_modDamagePlusThreat(1.5, 96),
  20704: handler_modDamagePlusThreat(1.5, 191), // THREAT UNKNOWN

  //Revenge 复仇
  11601: handler_modDamagePlusThreat(2.25, 243), //Rank 5
  25288: handler_modDamagePlusThreat(2.25, 270), //Rank 6 (AQ)
  30357: handler_modDamagePlusThreat(2.25, 270), //Rank 8 (AQ)
  12798: handler_zero, //("Revenge Stun"),           //Revenge Stun 复仇昏迷

  //Cleave 顺劈斩
  845: handler_threatOnHit(10, 'Cleave'), //Rank 1
  7369: handler_threatOnHit(40, 'Cleave'), //Rank 2
  11608: handler_threatOnHit(60, 'Cleave'), //Rank 3
  11609: handler_threatOnHit(70, 'Cleave'), //Rank 4
  20569: handler_threatOnHit(100, 'Cleave'), //Rank 5
  25231: handler_threatOnHit(124, 'Cleave'), //Rank 6

  //Whirlwind 旋风斩
  1680: handler_modDamage(1.25), //("Whirlwind"), //Whirlwind
  // 雷霆
  6343: handler_modDamage(2.5), // Thunder Clap r1
  8198: handler_modDamage(2.5), // Thunder Clap r2
  8204: handler_modDamage(2.5), // Thunder Clap r3
  8205: handler_modDamage(2.5), // Thunder Clap r4
  11580: handler_modDamage(2.5), // Thunder Clap r5
  11581: handler_modDamage(2.5), // Thunder Clap r6
  25264: handler_modDamage(2.5), // Thunder Clap r7

  //Hamstring 断筋
  1715: handler_modDamagePlusThreat(1.25, 20), // R1
  7372: handler_threatOnHit(101), // R2, from outdated sheet
  7373: handler_threatOnHit(145, 'Hamstring'),
  25212: handler_threatOnHit(190, 'Hamstring'),

  //Intercept 拦截
  20252: handler_modDamage(2), //Intercept
  20253: handler_zero, //("Intercept Stun"),         //Intercept Stun (Rank 1) 拦截昏迷
  20616: handler_modDamage(2), //Intercept (Rank 2)
  20614: handler_zero, //("Intercept Stun"),         //Intercept Stun (Rank 2)
  20617: handler_modDamage(2), //Intercept (Rank 3)
  20615: handler_zero, //("Intercept Stun"),         //Intercept Stun (Rank 3)
  25272: handler_modDamage(2), //Intercept (Rank 4)
  25273: handler_zero, //("Intercept Stun"),         //Intercept Stun (Rank 4)

  //Execute 斩杀
  20647: handler_modDamage(1.25, 'Execute'),
  25236: handler_modDamage(1.25, 'Execute'), //Rank 7

  /* Abilities */
  //Sunder Armor 破甲攻击
  7386: handler_castCanMiss(45), // Rank 1
  11597: handler_castCanMiss(261, 'Sunder Armor'), //Rank 5
  25225: handler_castCanMiss(301, 'Sunder Armor'), //Rank 6

  // 毁灭打击
  30022: handler_threatOnHuiMie(), //Rank 3

  //Battle Shout 战斗怒吼
  11551: handler_threatOnBuff(52, 'Battle Shout'), //Rank 6
  25289: handler_threatOnBuff(60, 'Battle Shout'), //Rank 7 (AQ)
  2048: handler_threatOnBuff(68, 'Battle Shout'), //Rank 8 (AQ)

  //命令怒吼
  469: handler_threatOnBuff(68, 'Health Shout'),

  //Demo Shout 挫志怒吼
  11556: handler_threatOnDebuff(43, 'Demoralizing Shout'), //Rank 5
  25203: handler_threatOnDebuff(56, 'Demoralizing Shout'), //Rank 7

  // 暴怒
  30033: handler_threatOnBuff(40, 'Fury Shout'), //Rank 3

  //Mocking Blow 惩戒痛击
  25266: threatFunctions.concat(
    handler_damage,
    handler_markSourceOnMiss(borders.taunt)
  ), //("Mocking Blow"),

  //Overpower 压制
  11585: handler_damage, //("Overpower"),

  //Rend 撕裂
  25208: handler_damage, //("Rend"),

  /* Zero threat abilities 嘲讽 */
  355: threatFunctions.concat(
    handler_taunt,
    handler_markSourceOnMiss(borders.taunt)
  ), //("Taunt"), //Taunt
  1161: handler_markSourceOnMiss(borders.taunt), //("Challenging Shout"), //Challenging Shout 挑战怒吼
  2687: handler_energizeCoeff, //("Bloodrage"), //Bloodrage (cast) 血性狂暴
  29131: handler_energize, //("Bloodrage"), //Bloodrage (buff) 血性狂暴
  29478: handler_zero, //("Battlegear of Might"), //Battlegear of Might 力量
  23602: handler_zero, //("Shield Specialization"), //Shield Specialization 盾牌专精效果
  12964: handler_energize, //("Unbridled Wrath"), //Unbridled Wrath 怒不可遏效果
  11578: handler_zero, //("Charge"), //Charge 冲锋
  7922: handler_zero, //("Charge Stun"), //Charge Stun 冲锋昏迷
  18499: handler_zero, //("Berserker Rage"), //Berserker Rage 狂暴之怒
  12966: handler_zero, //("Flurry (Rank 1)"), //Flurry (Rank 1) 乱舞
  12967: handler_zero, //("Flurry (Rank 2)"), //Flurry (Rank 2)
  12968: handler_zero, //("Flurry (Rank 3)"), //Flurry (Rank 3)
  12969: handler_zero, //("Flurry (Rank 4)"), //Flurry (Rank 4)
  12970: handler_zero, //("Flurry (Rank 5)"), //Flurry (Rank 5)
  12971: handler_zero, //("Flurry (Rank 5)"), //Flurry (Rank 6)
  12972: handler_zero, //("Flurry (Rank 5)"), //Flurry (Rank 7)
  12973: handler_zero, //("Flurry (Rank 5)"), //Flurry (Rank 8)
  12974: handler_zero, //("Flurry (Rank 5)"), //Flurry (Rank 9)
  12328: handler_zero, //("Death Wish"), //Death Wish 横扫攻击
  871: handler_zero, //("Shield Wall"), 盾墙
  1719: handler_zero, //("Recklessness"), //Recklessness 鲁莽
  12323: handler_zero, //("Piercing Howl"), //Piercing Howl 刺耳怒吼
  14204: handler_zero, //("Enrage"), //Enrage 激怒
  12975: handler_zero, //("Last Stand (cast)"), //Last Stand (cast) 破釜
  12976: handler_zero, //("Last Stand (buff)"), //Last Stand (buff) 破釜
  2565: handler_zero, //("Shield Block"), //Shield Block 盾牌格挡

  /* Consumable */
  6613: handler_zero, //("Great Rage Potion"), //Great Rage Potion 暴怒
  17528: handler_zero, //("Mighty Rage Potion"), //Mighty Rage Potion 强效怒气

  /* Forms */
  9634: handler_zero, //(1.45, "Bear Form"), 巨熊形态
  768: handler_zero, //(0.71, "Cat Form"), 猫形态

  /* Bear */
  5209: handler_markSourceOnMiss(borders.taunt), // Challenging Roar 挑战咆哮
  6807: handler_modDamage(1.75, 'Maul (Rank 1)'), // 重殴
  6808: handler_modDamage(1.75, 'Maul (Rank 2)'),
  6809: handler_modDamage(1.75, 'Maul (Rank 3)'),
  8972: handler_modDamage(1.75, 'Maul (Rank 4)'),
  9745: handler_modDamage(1.75, 'Maul (Rank 5)'),
  9880: handler_modDamage(1.75, 'Maul (Rank 6)'),
  9881: handler_modDamage(1.75, 'Maul (Rank 7)'),
  26996: handler_modDamage(1.75, 'Maul'),

  779: handler_modDamage(1.75, 'Swipe (Rank 1)'), // 横扫
  780: handler_modDamage(1.75, 'Swipe (Rank 2)'),
  769: handler_modDamage(1.75, 'Swipe (Rank 3)'),
  9754: handler_modDamage(1.75, 'Swipe (Rank 4)'),
  9908: handler_modDamage(1.75, 'Swipe (Rank 5)'),
  26997: handler_modDamage(1.75, 'Swipe'),

  99: handler_threatOnDebuff(9, 'Demoralizing Roar (Rank 1)'), // 挫志咆哮
  1735: handler_threatOnDebuff(15, 'Demoralizing Roar (Rank 2)'),
  9490: handler_threatOnDebuff(20, 'Demoralizing Roar (Rank 3)'),
  9747: handler_threatOnDebuff(30, 'Demoralizing Roar (Rank 4)'),
  9898: handler_threatOnDebuff(39, 'Demoralizing Roar (Rank 5)'),
  26998: handler_threatOnDebuff(39, 'Demoralizing Roar'),

  6795: threatFunctions.concat(
    handler_taunt,
    handler_markSourceOnMiss(borders.taunt)
  ), //("Growl"), 低吼
  5229: handler_energize, //("Enrage"), 激怒
  17057: handler_energize, //("Furor"), 激怒

  8983: handler_zero, //("Bash"), //TODO test bash threat 猛击

  /* Cat follow line 294*/
  27000: handler_damage, //("Claw"),
  27002: handler_damage, //("Shred"),
  9904: handler_damage, //("Rake"),
  22829: handler_damage, //("Ferocious Bite"),
  27005: handler_damage, //("Ravage"),
  27008: handler_damage, //("Rip"),
  27006: handler_damage, //("Pounce"),
  9913: handler_zero, //("Prowl"),
  9846: handler_zero, //("Tiger's Fury"),
  33983: handler_damage, //裂伤3

  1850: handler_zero, //("Dash (Rank 1)"),
  33357: handler_zero, //("Dash"),

  // 畏缩
  8998: handler_castCanMiss(-240, 'Cower (Rank 1)'),
  9000: handler_castCanMiss(-390, 'Cower (Rank 2)'),
  9892: handler_castCanMiss(-600, 'Cower (Rank 3)'),
  27004: handler_castCanMiss(-1000, 'Cower'), //Rank 5

  /* Healing */
  //TODO

  /* Abilities 野性精灵之火*/
  16857: handler_threatOnDebuff(108, 'Faerie Fire (Feral)(Rank 1)'),
  17390: handler_threatOnDebuff(108, 'Faerie Fire (Feral)(Rank 2)'),
  17391: handler_threatOnDebuff(108, 'Faerie Fire (Feral)(Rank 3)'),
  17392: handler_threatOnDebuff(108, 'Faerie Fire (Feral)(Rank 4)'),
  26993: handler_threatOnDebuff(108, 'Faerie Fire (Feral)'),

  770: handler_threatOnDebuff(108, 'Faerie Fire (Rank 1)'),
  778: handler_threatOnDebuff(108, 'Faerie Fire (Rank 2)'),
  9749: handler_threatOnDebuff(108, 'Faerie Fire (Rank 3)'),
  9907: handler_threatOnDebuff(108, 'Faerie Fire (Rank 4)'),
  27011: handler_threatOnDebuff(108, 'Faerie Fire'),

  16870: handler_zero, //("Clearcasting"), 节能施法
  29166: handler_zero, //("Innervate"), 激活

  22842: handler_heal, //("Frienzed Regeneration (Rank 1)"), 狂暴回复
  22895: handler_heal, //("Frienzed Regeneration (Rank 2)"),
  22896: handler_heal, //("Frienzed Regeneration (Rank 3)"),
  26999: handler_heal, //("Frienzed Regeneration"),

  24932: handler_zero, //("Leader of the Pack"), 兽群领袖

  /* Items */
  13494: handler_zero, //("Manual Crowd Pummeler"), 加速
};

let zeroThreatSpells = [];
for (let i in spellFunctions) {
  if (i >= 0 && spellFunctions[i] === handler_zero) {
    zeroThreatSpells.push(i);
  }
}

const PARSING_TYPES = {
  'ABILITY': 0,
  'OTHER': 1,
  'FLAT': 2,
  'WEAPON': 3,
};

export class Config {
  static TYPES = PARSING_TYPES;

  static DEFENSE = {
    'ac': {'form': 'ac'},
    'ref(?:lex|)': {'form': 'ref'},
    'fort(?:itude|)': {'form': 'fort'},
    'wil(?:l|)': {'form': 'wil'},
  };

  static WEAPON = {
    'melee\\s*(?:weapon)?': {'form': 'melee'},
    'ranged\\s*(?:weapon)?': {'form': 'ranged'},
    '(?:(?:(?:melee|ranged)\\s*(?:weapon|)\\s*(?:or|/|,|)\\s*){2}|weapon)': {'form': 'meleeRanged'},
    'imp(?:lement|)': {'form': 'implement'},
    'none': {'form': 'none'},
    '(?:(?:(?:imp(?:lement|)|weapon)\\s*(?:or|/|,|)\\s*){2}|any)': {'form': 'any'}
  }

  static SIGN = {
    '\\+': {'form': '+'},
    '(?:\\-|—)': {'form': '-'},
    '\\*': {'form': '*'},
    '/': {'form': '/'}
  };

  static FORMULA = {
    'str(?:ength|)\\s*(?:ability|)\\s*(?:mod|)(?:ifier|)': {'form': '@strMod', 'type': PARSING_TYPES.ABILITY},
    'con(?:stitution|)\\s*(?:ability|)\\s*(?:mod|)(?:ifier|)': {'form': '@conMod', 'type': PARSING_TYPES.ABILITY},
    'dex(?:terity|)\\s*(?:ability|)\\s*(?:mod|)(?:ifier|)': {'form': '@dexMod', 'type': PARSING_TYPES.ABILITY},
    'int(?:elligence|)\\s*(?:ability|)\\s*(?:mod|)(?:ifier|)': {'form': '@intMod', 'type': PARSING_TYPES.ABILITY},
    'wis(?:dom|)\\s*(?:ability|)\\s*(?:mod|)(?:ifier|)': {'form': '@wisMod', 'type': PARSING_TYPES.ABILITY},
    'cha(?:risma|)\\s*(?:ability|)\\s*(?:mod|)(?:ifier|)': {'form': '@chaMod', 'type': PARSING_TYPES.ABILITY},
    'str(?:ength|)\\s*(?:ability|)\\s*score': {'form': '@abilities.str.value', 'type': PARSING_TYPES.FLAT},
    'con(?:stitution|)\\s*(?:ability|)\\s*score': {'form': '@abilities.con.value', 'type': PARSING_TYPES.FLAT},
    'dex(?:terity|)\\s*(?:ability|)\\s*score': {'form': '@abilities.dex.value', 'type': PARSING_TYPES.FLAT},
    'int(?:elligence|)\\s*(?:ability|)\\s*score': {'form': '@abilities.int.value', 'type': PARSING_TYPES.FLAT},
    'wis(?:dom|)\\s*(?:ability|)\\s*score': {'form': '@abilities.wis.value', 'type': PARSING_TYPES.FLAT},
    'cha(?:risma|)\\s*(?:ability|)\\s*score': {'form': '@abilities.cha.value', 'type': PARSING_TYPES.FLAT},
    '(\\d*)d(\\d+)': {'form': '$0', 'crit': '$1*$2', 'type': PARSING_TYPES.OTHER},
    '\\d+': {'form': '$0', 'type': PARSING_TYPES.FLAT},
    '(?:level|lv)': {'form': '@lv', 'type': PARSING_TYPES.FLAT},
    'bloodied\\s*value': {'form': '@details.bloodied', 'type': PARSING_TYPES.FLAT},
    'your\\s*healing\\s*surge\\s*value': {'form': '@details.surgeValue', 'type': PARSING_TYPES.FLAT},
  };

  static DAMAGE = {
    '(\\d+)\\s*\\[\\s*W\\s*\\]': {'form': '@powBase', 'crit': '@powMax', 'baseQuantity': '$1', 'type': PARSING_TYPES.WEAPON},
  };

  static DAMAGE_TYPES = [
    "acid",
    "cold",
    "fire",
    "force",
    "lightning",
    "necrotic",
    "poison",
    "psychic",
    "radiant",
    "thunder"
  ];

  static RESOURCE = {
    'Augment': {'name': 'Power'}
  };

  static EFFECT = {
    '(?:\\(\\s*save\\s*ends\\s*\\)|save\\s*ends)': {'durationType': 'saveEnd'},
    '(?:until|)\\s*(?:the|)\\s*end\\s*of\\s*(?:the|)\\s*encounter': {'durationType': 'endOfEncounter'},
    '(?:until|)\\s*(?:the|)\\s*end\\s*of\\s*(?:the|)\\s*day': {'durationType': 'endOfDay'},
    '(?:until|)\\s*(?:the|)\\s*end\\s*of\\s*.*\\s*next\\s*turn': {'durationType': 'endOfUserTurn', 'altDurationType': 'endOfTargetTurn', 'endsOnInit': 'TRUE'},
    '(?:until|)\\s*(?:the|)\\s*start\\s*of\\s*.*\\s*next\\s*turn': {'durationType': 'startOfUserTurn', 'altDurationType': 'startOfTargetTurn', 'endsOnInit': 'TRUE'},
  };

  static DURATION_LABEL = {
    'saveEnd': "DND4EBETA.DurationSaveEnd",
    'endOfEncounter': "DND4EBETA.DurationEndOfEnc",
    'endOfDay': "DND4EBETA.DurationEndOfDay",
    'endOfUserTurn': "DND4EBETA.DurationEndOfUserTurn",
    'endOfTargetTurn': "DND4EBETA.DurationEndOfTargetTurnSimp",
    'startOfUserTurn': "DND4EBETA.DurationStartOfUserTurn",
    'startOfTargetTurn': "DND4EBETA.DurationStartOfTargetTurnSimp"
  };

  static COMMON_EFFECTS = {
    'marked(?:\\s*\\(\\s*red\\s*\\)|)': { 'id': 'mark_1' },
    'marked\\s*\\(\\s*blue\\s*\\)': { 'id': 'mark_2' },
    'marked\\s*\\(\\s*green\\s*\\)': { 'id': 'mark_3' },
    'marked\\s*\\(\\s*orange\\s*\\)': { 'id': 'mark_4' },
    'marked\\s*\\(\\s*purple\\s*\\)': { 'id': 'mark_5' },
    'marked\\s*\\(\\s*yellow\\s*\\)': { 'id': 'mark_6' },
    'marked\\s*\\(\\s*gr(?:a|e)y\\s*\\)': { 'id': 'mark_7' },
    'bloodied': { 'id': 'bloodied' },
    'attack\\s+up': { 'id': 'attack_up' },
    'attack\\s+down': { 'id': 'attack_down' },
    'defense\\s+up': { 'id': 'defUp' },
    'defense\\s+down': { 'id': 'defDown' },
    '(?:regen|regenerating|regeneration)': { 'id': 'regen' },
    'ammo\\s+charges': { 'id': 'ammo_count' },
    'cursed?': { 'id': 'curse' },
    'oath': { 'id': 'oath' },
    "hunter's\\s+mark": { 'id': 'hunter_mark' },
    'target': { 'id': 'target' },
    'ongoing\\s+effect(?:\\s*\\(\\s*green\\s*\\)|)': { 'id': 'ongoing_1' },
    'ongoing\\s+effect\\s*\\(\\s*blue\\s*\\)': { 'id': 'ongoing_2' },
    'ongoing\\s+effect\\s*\\(\\s*red\\s*\\)': { 'id': 'ongoing_3' },
    'blinded': { 'id': 'blinded' },
    'dazed': { 'id': 'dazed' },
    'dead': { 'id': 'dead' },
    'deafened': { 'id': 'deafened' },
    'disarmed': { 'id': 'disarmed' },
    'dominated': { 'id': 'dominated' },
    'drunk': { 'id': 'drunk' },
    'dying': { 'id': 'dying' },
    'flying': { 'id': 'flying' },
    'grabbed': { 'id': 'grabbed' },
    'immobilized': { 'id': 'immobilized' },
    'insubstantial': { 'id': 'insubstantial' },
    'invisible': { 'id': 'invisible' },
    'mounted': { 'id': 'mounted' },
    'petrified': { 'id': 'petrified' },
    'prone': { 'id': 'prone' },
    'removed\\s+from\\+play': { 'id': 'removed' },
    'restrained': { 'id': 'restrained' },
    '(?:sleeping|asleep)': { 'id': 'sleeping' },
    'slowed': { 'id': 'slowed' },
    'sneaking': { 'id': 'sneaking' },
    'stunned': { 'id': 'stunned' },
    'surprised': { 'id': 'surprised' },
    '(?:torch|lit)': { 'id': 'torch' },
    'unconscious': { 'id': 'unconscious' },
    'weakened': { 'id': 'weakened' }
  };

  static HEALING_TYPE = {
    'spend\\s*a\\s*healing\\s*surge': {'healing': 'surge'},
    '(?:heal\\w*|(?:re|)gains?)': {'healing': ''}
  };

  static HEALING = {
    '(?:their|his|her|its|his\\s*or\\s*her|her\\s*or\\s*his)\\s*healing\\s*surge\\s*value': {'healing': 'surgeValue'}
  };
}

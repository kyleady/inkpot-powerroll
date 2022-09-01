const PARSING_TYPES = {
  ABILITY: 0,
  OTHER: 1,
  FLAT: 2,
  WEAPON: 3,
};

export class Config {
  static TYPES = PARSING_TYPES;

  static ATTACK = {
    'str(?:ength|)': {'form': '@strMod', 'type': PARSING_TYPES.ABILITY},
    'con(?:stitution|)': {'form': '@conMod', 'type': PARSING_TYPES.ABILITY},
    'dex(?:terity|)': {'form': '@dexMod', 'type': PARSING_TYPES.ABILITY},
    'int(?:elligence|)': {'form': '@intMod', 'type': PARSING_TYPES.ABILITY},
    'wis(?:dom|)': {'form': '@wisMod', 'type': PARSING_TYPES.ABILITY},
    'cha(?:risma|)': {'form': '@chaMod', 'type': PARSING_TYPES.ABILITY},
    '(?:level|lv)': {'form': '@lv', 'type': PARSING_TYPES.OTHER},
    '\\d+': {'form': '$0', 'type': PARSING_TYPES.FLAT},
    '\\d*d\\d+': {'form': '$0', 'type': PARSING_TYPES.FLAT},
  };

  static DEFENSE = {
    'ac': {'form': 'ac'},
    'ref(?:lex|)': {'form': 'ref'},
    'fort(?:itude|)': {'form': 'fort'},
    'wil(?:l|)': {'form': 'wil'},
  };

  static WEAPON = {
    'melee\\s*(?:weapon)?': {'form': 'melee'},
    'ranged\\s*(?:weapon)?': {'form': 'ranged'},
    '(?:(?:melee|ranged)\\s*(?:weapon|)\\s*(?:or|/|,|)\\s*){2}': {'form': 'meleeRanged'},
    'imp(?:lement|)': {'form': 'implement'},
    'none': {'form': 'none'},
    '(?:(?:(?:imp(?:lement|)|weapon)\\s*(?:or|/|,|)\\s*){2}|any)': {'form': 'any'}
  }

  static DAMAGE = {
    'str(?:ength|)\\s*(?:ability|)\\s*(?:mod|)(?:ifier|)': {'form': '@strMod', 'type': PARSING_TYPES.FLAT},
    'con(?:stitution|)\\s*(?:ability|)\\s*(?:mod|)(?:ifier|)': {'form': '@conMod', 'type': PARSING_TYPES.FLAT},
    'dex(?:terity|)\\s*(?:ability|)\\s*(?:mod|)(?:ifier|)': {'form': '@dexMod', 'type': PARSING_TYPES.FLAT},
    'int(?:elligence|)\\s*(?:ability|)\\s*(?:mod|)(?:ifier|)': {'form': '@intMod', 'type': PARSING_TYPES.FLAT},
    'wis(?:dom|)\\s*(?:ability|)\\s*(?:mod|)(?:ifier|)': {'form': '@wisMod', 'type': PARSING_TYPES.FLAT},
    'cha(?:risma|)\\s*(?:ability|)\\s*(?:mod|)(?:ifier|)': {'form': '@chaMod', 'type': PARSING_TYPES.FLAT},
    '(\\d+)\\s*\\[\\s*W\\s*\\]': {'form': '@powBase', 'crit': '@powMax', 'baseQuantity': '$1', 'type': PARSING_TYPES.WEAPON},
    '(\\d*)d(\\d+)': {'form': '$0', 'crit': '$1*$2', 'type': PARSING_TYPES.OTHER},
    '\\d+': {'form': '$0', 'type': PARSING_TYPES.FLAT},
    '(?:level|lv)': {'form': '@lv', 'type': PARSING_TYPES.FLAT},
    'half\\s*(?:level|lv)': {'form': '@lvhalf', 'type': PARSING_TYPES.FLAT},
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
}

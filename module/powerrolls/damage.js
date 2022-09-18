import { Config } from '../config.js';
import { PowerRollUtils4e } from '../utils.js';

export class PowerRollDamage4e {
  static getMatch(withoutBrackets) {
    const damage_types = `(?:${Config.DAMAGE_TYPES.join('|')})`;
    const weapons = `(?:${Object.keys(Config.WEAPON).join('|')})`;

    const damagePart = `(?<dmgTxt>${PowerRollUtils4e.formulaRegExp(Config.DAMAGE)})`;
    const damageTypePart = `(?<typeTxt>(?:${damage_types}\\s*(?:,|)\\s*(?:and|or|)\\s*)*)`;
    const weaponPart = `(?<wpnTxt>\\(\\s*${weapons}\\s*\\)|)`;

    const damageRgx = new RegExp(`^\\s*${damagePart}(?:extra|)\\s*${damageTypePart}\\s*damage\\s*${weaponPart}\\s*$`, 'i');
    const damageMatch = withoutBrackets.match(damageRgx);
    if (damageMatch) return damageMatch;
    const altDamageRgx = new RegExp(`^\\s*(?:extra|)\\s*${damageTypePart}\\s*damage\\s*equal\\s*to\\s*(?:your|)\\s*${damagePart}\\s*${weaponPart}\\s*$`, 'i');
    return withoutBrackets.match(altDamageRgx);
  }

  static _createPowerRollDamage(withoutBrackets, {dmgTxt, typeTxt, wpnTxt}) {
    let { parsedForm, formula, additionalFormulas: [crit]} = PowerRollUtils4e.parseFormula(dmgTxt, Config.DAMAGE, ['crit']);
    const weapons = parsedForm
                      .map(data => PowerRollUtils4e._replaceWithMatches(data.data.baseQuantity, data.match, 2))
                      .filter(baseQuantity => baseQuantity);
    if(weapons.length > 1) ui.notifications.warn(`Too many weapons in: ${withoutBrackets}`);
    const baseQuantity = weapons[0] || "";
    formula += '+@dmgMod';
    crit += '+@dmgMod';
    const damageType = Config.DAMAGE_TYPES
                        .filter(dmgType => typeTxt.match(new RegExp(dmgType, 'i')))
                        .reduce((obj, dmgType) => ({ ...obj, [dmgType]: true}), {});
    const typesTag = Object.keys(damageType).length ? `[${Object.keys(damageType).join()}]` : '';

    const a = document.createElement('a');
    a.classList.add('power-roll');
    a.title = `${formula}${typesTag}`;
    a.dataset['action'] = 'damage';
    a.dataset['overrides'] = JSON.stringify({
      'damage.parts': [],
      'damageCrit.parts': [],
      'damageType': damageType,
      'hit.baseQuantity': baseQuantity,
      'hit.formula': formula,
      'miss.formula': '',
      'hit.critFormula': crit,
      ...PowerRollUtils4e._weaponOverride(wpnTxt)
    });
    a.innerHTML = `<i class="fas fa-heart-broken"></i> ${withoutBrackets}`;
    return a;
  }
}

import { Config } from '../config.js';
import { PowerRollUtils4e } from '../utils.js';

export class PowerRollDamage4e {
  static getMatch(withoutBrackets) {
    const damages = `(?:${Object.keys(Config.DAMAGE).join('|')})`;
    const damage_types = `(?:${Config.DAMAGE_TYPES.join('|')})`;
    const weapons = `(?:${Object.keys(Config.WEAPON).join('|')})`;

    const damagePart = `((?:\\+|\\-|)\\s*${damages}\\s*(?:(?:\\+|\\-)\\s*${damages}\\s*)*)`;
    const damageTypePart = `((?:${damage_types}\\s*(?:,|)\\s*(?:and|or|)\\s*)*)`;
    const weaponPart = `(\\(\\s*${weapons}\\s*\\))?`;

    const damageRgx = new RegExp(`^\\s*${damagePart}(?:extra|)\\s*${damageTypePart}\\s*damage\\s*${weaponPart}\\s*$`, 'i');
    const damageMatch = withoutBrackets.match(damageRgx);
    return damageMatch;
  }

  static _createPowerRollDamage(fullTxt, withoutBrackets, dmgTxt, ...matches) {
    const weaponTxt = matches.pop();
    const typeTxt = matches.pop();

    const parsedDmg = PowerRollUtils4e._toParsedData(dmgTxt, '(\\+|\\-|)\\s*({})(?=(?:\\+|\\-|\\s|$))', Config.DAMAGE);
    const weapons = parsedDmg
                      .map(data => PowerRollUtils4e._replaceWithMatches(data.data.baseQuantity, data.match, 2))
                      .filter(baseQuantity => baseQuantity);
    if(weapons.length > 1) ui.notifications.warn(`Too many weapons in: ${withoutBrackets}`);
    const baseQuantity = weapons[0] || "";

    const formula = '@dmgMod' + parsedDmg
                    .map(data => [data.match[1] || '+', PowerRollUtils4e._replaceWithMatches(data.data.form, data.match, 2)])
                    .filter(signAndPart => signAndPart[1])
                    .map(signAndPart => signAndPart.join(''))
                    .join('');
    const crit = '@dmgMod' + parsedDmg
                    .map(data => [data.match[1] || '+', PowerRollUtils4e._replaceWithMatches(data.data.type == Config.TYPES.FLAT ? data.data.form : data.data.crit, data.match, 2)])
                    .filter(signAndPart => signAndPart[1])
                    .map(signAndPart => signAndPart.join(''))
                    .join('');

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
      ...PowerRollUtils4e._weaponOverride(weaponTxt)
    });
    a.innerHTML = `<i class="fas fa-heart-broken"></i> ${withoutBrackets}`;
    return a;
  }
}

import { Config } from './config.js';

export class PowerRollUtils4e {
  static formulaRegExp(additionalOptions) {
    additionalOptions = additionalOptions || {};
    const jointOptions = {...Config.FORMULA, ...additionalOptions};
    const form = `${Object.keys(jointOptions).join('|')}`;
    const sign = `${Object.keys(Config.SIGN).join('|')}`;
    return `\\s*(?:${sign}|)\\s*(?:${form})\\s*(?:(?:${sign})\\s*(?:${form})\\s*)*`;
  }

  static parseFormula(formTxt, additionalOptions, additionalKeys) {
    if(!formTxt) return {'parsedForm': [], 'formula': '', 'additionalFormulas': []};
    additionalOptions = additionalOptions || {};
    additionalKeys = additionalKeys || [];
    const jointOptions = {...Config.FORMULA, ...additionalOptions};
    const formKeys = Object.keys(Config.FORMULA).concat(Object.keys(additionalOptions));
    const sign = `${Object.keys(Config.SIGN).join('|')}`;
    const parsedForm = PowerRollUtils4e._toParsedData(formTxt, `(${sign}|)\\s*({})\\s*(?=(?:${sign}|$))`, jointOptions);
    const [formula, ...additionalFormulas] = ['form'].concat(additionalKeys).map(additionalKey => parsedForm
      .map(data => {
        const {'matchKey': signKey} = PowerRollUtils4e.getMatchKey(data.match[1], Config.SIGN);
        const sign = Config.SIGN[signKey]?.form || '';
        const form = PowerRollUtils4e._replaceWithMatches(data.data[additionalKey] || data.data.form, data.match, 2);
        return [sign, form];
      })
      .filter(signAndForm => signAndForm[1])
      .map(signAndForm => signAndForm.join(''))
      .join('')
    );
    return {parsedForm, formula, additionalFormulas};
  }

  static getMatchKey(input, parsingData, rgx) {
    rgx = rgx || '{}';
    for (let rgxTxt in parsingData) {
      const match = input.match(new RegExp('^' + rgx.replace('{}', rgxTxt) + '$', 'i'));
      if (match) return {match: match, matchKey: rgxTxt};
    }

    return {};
  }

  static _replaceWithMatches(txt, match, offset=0) {
    if (!txt) return undefined;
    let output = txt;
    const replaceRgx = new RegExp('(?<!\\$)\\$(\\d+)', 'i');
    let replaceMatch = output.match(replaceRgx);
    while(replaceMatch) {
      const startIndex = replaceMatch.index;
      const stopIndex = startIndex + replaceMatch[0].length;
      const replaceTxt = match[Number(replaceMatch[1]) + offset];
      output = output.substring(0, startIndex) + replaceTxt + output.substring(stopIndex);
      replaceMatch = output.match(replaceRgx);
    }

    return output;
  }

  static _weaponOverride(weaponTxt) {
    if (!weaponTxt) return {};
    const weaponParsed = PowerRoll4e._toParsedData(weaponTxt, '\\(\\s*{}\\s*\\)', Config.WEAPON);
    return {
      'weaponType': weaponParsed[0].data.form
    }
  }

  static _toParsedData(input, rgx, parsingData) {
    const anyOption = `(?:${Object.keys(parsingData).join('|')})`;
    const globalRgx = new RegExp(rgx.replace('{}', anyOption), 'gi');
    return input
      .match(globalRgx)
      .map(part => {
        const {match, matchKey} = PowerRollUtils4e.getMatchKey(part, parsingData, rgx);
        return {
          'match': match,
          'txt': part,
          'data': parsingData[matchKey]
        }
      });
  }
}

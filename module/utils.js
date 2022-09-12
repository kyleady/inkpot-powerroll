import { Config } from './config.js';

export class PowerRollUtils4e {
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
    const parsedData = [];
    const anyOption = `(?:${Object.keys(parsingData).join('|')})`;
    const globalRgx = new RegExp(rgx.replace('{}', anyOption), 'gi');
    const allParts = input.match(globalRgx);
    for (let part of allParts) {
      for (let rgxTxt in parsingData) {
        const match = part.match(new RegExp('^' + rgx.replace('{}', rgxTxt) + '$', 'i'));
        if (match) {
          parsedData.push({
            'match': match,
            'txt': part,
            'data': parsingData[rgxTxt]
          });
          break;
        }
      }
    }

    return parsedData;
  }
}

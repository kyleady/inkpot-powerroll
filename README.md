# Inkpot - Power Roll for FoundryVTT
A module that allows inline links for rolling of D&D 4e power attacks, damage, and resource spending.

These power links are recognized in...

### Chat

![powerroll_chat](https://user-images.githubusercontent.com/20159776/187782759-1be673b1-6995-453c-b79a-798263611b2f.gif)

### Powers

![powerroll_character](https://user-images.githubusercontent.com/20159776/187782912-dea8b509-3353-4986-bce8-9d3d40906b13.png)

### Character Sheets

![powerroll_bio](https://user-images.githubusercontent.com/20159776/187783042-a72b3385-5a07-4092-a93d-7d454ba651d9.png)

### Journals

![powerroll_journal](https://user-images.githubusercontent.com/20159776/187783131-c89a13b2-546c-4086-ad9a-d75179c4472d.png)

### Items

![powerroll_item](https://user-images.githubusercontent.com/20159776/187783267-e2686c2d-66ab-474e-8b0d-f157c1935c6c.png)

## Usage

### Format

The following Power Roll types are currently recoginized and are case-insensitive
* **Attack**: Has the format `[[/p <ATTACK> vs <DEFENSE> ]]`.
    * `<ATTACK>` can be any combination of the following joined by `+` or `-`
        * `Str`
        * `Dex`
        * `Con`
        * `Wis`
        * `Int`
        * `Cha`
        * `Lv`
        * `Strength`
        * `Dexterity`
        * `Constitution`
        * `Wisdom`
        * `Inteligence`
        * `Charisma`
        * `Level`
        * `\<Number>`
        * `\<Number>d\<Number>`
    * `<DEFENSE>` is exactly one of the following
        * `AC`
        * `Reflex`
        * `Fortitude`
        * `Will`
        * `Ref`
        * `Fort`
        * `Wil`
* **Damage**: Has the format `[[/p <DAMAGE> <DAMAGE_TYPE> damage ]]`.
    * `<DAMAGE>` can be any combination of the following joined by `+` or `-`
        * `Str`
        * `Dex`
        * `Con`
        * `Wis`
        * `Int`
        * `Cha`
        * `Lv`
        * `Half Lv`
        * `Strength`
        * `Dexterity`
        * `Constitution`
        * `Wisdom`
        * `Inteligence`
        * `Charisma`
        * `Level`
        * `Half Level`
        * `\<Number>`
        * `\<Number>d\<Number>`
        * `\<Number>[W]`
    * `<DAMAGE_TYPE>` can be any combination of the following joined by `extra`, `,`, `and`, or `or`, 
        * `Acid`
        * `Cold`
        * `Fire`
        * `Force`
        * `Lightning`
        * `Necrotic`
        * `Poison`
        * `Psychic`
        * `Radiant`
        * `Thunder`
* **Resource**: Has the format `[[/p <RESOURCE> <NUMBER>]]`.
    * `<RESOURCE>` can be any one of
        * `Augment` will spend a Resource named `Power`

### Links

Attack and Damage power roll links work just like the Attack and Damage buttons on Power Chat Cards. However, the written formula overrides certain 
details about the power such as the attack or damage formula, targeted defense, the damage types, and the weapon dice count. If there is no 
Power to override, in the case of clicking a Power Roll outside of a Power (Journal, Bio, Item, Chat), then a temporary default power that can
use any weapon is generated and has its details set by the Power Roll.

Resource power roll links will spend the listed resource for the amount listed. It will then roll the `/r min(@current - @cost, @max)` to the chat. The
max is there to show the `@max` and to ensure a negative cost could not exceed the max.

If no Character is defined by the location of the Power Roll (Journal, Chat, Unowned Item), then the selected characters are used. If no 
characters are selected it will use a temporary default actor for the roll. This can be useful when rolling for a trap or disease and you do
not want to include anyone's universal bonuses to attacks or damage.

Resource power roll links require a real character to spend the resource. It requires the character to have the resource with an identical name. 
It also requires the character to have enough of the resource to spend.

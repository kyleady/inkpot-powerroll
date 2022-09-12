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
* **Attack**: Has the format `[[/p <ATTACK> vs <DEFENSE> <WEAPON>]]`.
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
        * `Intelligence`
        * `Charisma`
        * `Level`
        * `<Number>`
        * `<Number>d<Number>`
    * `<DEFENSE>` is exactly one of the following
        * `AC`
        * `Reflex`
        * `Fortitude`
        * `Will`
        * `Ref`
        * `Fort`
        * `Wil`
    * `<WEAPON>` is an optional argument in parentheses `( ... )` and, if included, is one of the following
        * `Melee`
        * `Ranged`
        * `Melee/Ranged`
        * `Weapon`
        * `Implement`
        * `None`
        * `Weapon/Implement`
        * `Any`
* **Damage**: Has the format `[[/p <DAMAGE> <DAMAGE_TYPE> damage <WEAPON>]]`.
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
        * `Intelligence`
        * `Charisma`
        * `Level`
        * `Half Level`
        * `<Number>`
        * `<Number>d<Number>`
        * `<Number>[W]`
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
    * `<WEAPON>` is an optional argument in parentheses `( ... )` that takes the same form as in **Attack** Power Roll
* **Resource**: Has the format `[[/p <RESOURCE> <NUMBER>]]`.
    * `<RESOURCE>` can be any one of
        * `Augment` will spend a Resource named `Power`
* **Effect**: Has three formats 
    * `[[/p until the <start|end> of ... next turn]]`
    * `[[/p until the end of the <encounter|day>]]`
    * `[[/p save ends]]`   
    
    

### Links

A Power Roll Link uses the owning Character and the Power from where the Power Roll was clicked as the source for the Character and Power.
* If no Character is defined by the location of the Power Roll (Journal, Chat, Unowned Item), then the selected Characters are used. If no Characters are selected it will use a temporary default Character for the roll. This can be useful when rolling for a trap or disease and you do not want to include anyone's universal bonuses to attacks or damage.
* If no Power is defined by the location of the Power Roll (Journal, Chat, Actor Bio, non-Power Item), then an empty Power is used with the system defaults as the base for the Power Roll that can use `any` weapon.

#### Attack / Damage
Attack and Damage power roll links work just like the Attack and Damage buttons on Power Chat Cards. However, the written formula overrides certain
details about the power such as the attack or damage formula, targeted defense, the damage types, and the weapon dice count. If there is no
Power to override, in the case of clicking a Power Roll outside of a Power (Journal, Bio, Item, Chat), then a temporary default power that
requires no weapon or implement is generated and has its details set by the Power Roll.

#### Resource
Resource power roll links will spend the listed resource for the amount listed. It will then roll the `/r min(@current - @cost, @max)` to the chat. The
max is there to show the `@max` and to ensure a negative cost could not exceed the max.

Resource power roll links require a real character to spend the resource. It requires the character to have the resource with an identical name to the name the Resource is mapped to. It also requires the character to have enough of the resource to spend.

#### Effects
Effect Power Rolls will  
* `[[/p until the <start|end> of ... next turn]]`: will add an effect to each targeted Token that is targeted that ends at the start or end of the source token's next turn. If a fastForward key is used, the effect will last until the start or end of the targeted token's next turn instead. If there is no source token (such as applying an effect from a JournalEntry), the effect will end based on the target's next turn.
    * The `...` in the first format can take any text due to the variety in monster and character block descriptions. However, the text in the `...` has no impact on the behavior of the Power Roll Effect. For example, these three following Power Rolls have the same exact behavior despite the different meaning in the text: `[[/p until the end of your next turn]]`, `[[/p until the end of the target's next turn]]`, `[[/p until the end of your third favorite pet's next turn]]`.
* `[[/p until the end of the <encounter|day>]]` will add an effect to each targeted Token that will last until the Token Short Rests / Long Rests.
* `[[/p save ends]]` will add an effect to each targeted Token that can be ended with a successful Save.


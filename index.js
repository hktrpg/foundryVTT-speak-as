var isDefaultName = false;
var innerHTML;
Hooks.once("init", () => {

    console.log('AAAAAAAAAAAAAAAAAs')
    /*
    game.settings.register("default_name", "isDefaultName", {
        name: 'is Default Name',
        hint: 'If checked, there will be a be default name by placeholder in box, otherwise will focus only.',
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
    isDefaultName = game.settings.get("default_name", "isDefaultName");

     */
});

/***

SPEAK
speaker:
actor: "Y0AF1TTJc62818xw"
alias: "BBBC"
scene: "h4pMkoiYTRL1AVto"
token: "WR37HUvxw2akCWIE"

修改行為
1)必需選定一個名字
i)可選自己的身份或自己擁有的TOKEN
2)如場上有同樣的TOKEN，使用那個TOKEN發言
3)沒有的話，則把發言名稱改成那個名字


  <label class="chat-control-icon"><i class="fas fa-dice-d20"></i></label>
        <select class="roll-type-select" name="rollMode">
            <optgroup label="Default Roll Mode">
            <option value="roll">Public Roll</option>
            <option value="gmroll">Private GM Roll</option>
            <option value="blindroll" selected="">Blind GM Roll</option>
            <option value="selfroll">Self Roll</option>
            </optgroup>
        </select>

        <div class="control-buttons">
            <a class="button export-log" title="Export Chat Log"><i class="fas fa-save"></i></a>
            <a class="delete button chat-flush" title="Clear Chat Log"><i class="fas fa-trash"></i></a>
        </div>

*/



Hooks.on("renderSidebarTab", (dialog, $element, ABC) => {
    var HTML;
    /**
     * 自己的登入名字
     * 自己擁有的角色
    */
    ($element.find(`div#chat - controls.flexrow`)) ? HTML = $element.find(`div#chat - controls.flexrow`) : null;
    if (HTML[0]) {
        console.log(HTML[0].innerHTML)
        //innerHTML = HTML[0].innerHTML;
        HTML[0].innerHTML = updateSpeakerList() + HTML[0].innerHTML;
    }

    //  innerHTML[0].innerHTML = ""

    // outerHTML

    //  innerHTML.prevObject[0].outerHTML=''
    /// ABC.speaker.token = "XXX"
    //2)如場上有同樣的TOKEN，使用那個TOKEN發言
    //ABC.speaker.actor = '';
    //ABC.speaker.alias = 'XXX';
});


function updateSpeakerList() {
    let myUser = game.users.find(user => user.id == game.userId);
    let myactors = game.actors.filter(actor => actor.permission >= 2);

    let addText = `<select name="namelist" id="namelist"  class="roll-type-select">
    <optgroup label="Speak As....">
    <option value="user">${myUser.name}</option>`;
    for (let index = 0; index < myactors.length; index++) {
        addText += `\n<option value="${myactors[index].id}">${myactors[index].name}</option>`
    };
    addText += `\n</select>`;
    return addText;
}

Hooks.on("chatMessage", (dialog, $element, ABC) => {
    //   console.log('dialog', dialog)
    // console.log('$element', $element)
    // console.log('ABC', ABC)

    ABC.speaker.token = "XXX"
    //2)如場上有同樣的TOKEN，使用那個TOKEN發言
    //ABC.speaker.actor = '';
    ABC.speaker.alias = 'XXX';
});


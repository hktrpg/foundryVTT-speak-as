Hooks.on("renderSidebarTab", (dialog, $element, targets) => {
    /**
     * 自己的登入名字
     * 自己擁有的角色
    */
    let HTML = $element.find(`div#chat-controls.flexrow`)[0];
    if (!HTML) return;
    $('#namelist').remove();
    $('#chat-controls.flexrow').prepend(updateSpeakerList());
    $('#chat-controls.flexrow').prepend(checkedBox);
    let color = $(".roll-type-select").css("color");
    let height = $(".roll-type-select").css("height");
    let bgcolor = $(".roll-type-select").css("background");
    let width = $(".roll-type-select").css("width");
    var x = document.querySelectorAll("#namelist");
    x[0].style.setProperty("width", width, "important")
    x[0].style.setProperty("color", color, "important")
    x[0].style.setProperty("height", height, "important")
    x[0].style.setProperty("background", bgcolor, "important")
});



function updateSpeakerList() {
    let myUser = game.users.find(user => user.id == game.userId);
    let myactors = game.actors.filter(actor => actor.permission >= 2);
    let selectedCharacter = myactors.find(actor => actor.id === myUser.character?.id);

    let addText = `<div style="word-break: break-all;"><input type="checkbox" id="speakerSwitch" name="speakerSwitch" checked>
    <select name="namelist" id="namelist" class="namelist">
    <optgroup label="Speak As....">`;
    if (selectedCharacter) addText += `<option value="${selectedCharacter.id}">${selectedCharacter.name}</option>`
    addText += `<option value="userName" name="XX">${myUser.name}</option>`
    for (let index = 0; index < myactors.length; index++) {
        addText += `\n<option value="${myactors[index].id}">${myactors[index].name}</option>`
    };
    addText += `\n</select></div>`;
    return addText;
}

Hooks.on("chatMessage", (dialog, $element, targets) => {
    let namelist = document.getElementById('namelist');
    let checked = document.getElementById("speakerSwitch").checked;
    if (!checked) return;
    if (!namelist) return;
    switch (namelist.value) {
        case 'userName':
            targets.speaker.actor = null;
            targets.speaker.token = null;
            targets.speaker.alias = null;
            break;
        default:
            let map = game.scenes.find(scene => scene.isView);
            let target = map.tokens.find(token => {
                return token.name == namelist.options[namelist.selectedIndex].text
            })
            if (!target) {
                targets.speaker.token = 'Speak As zzzz';
                targets.speaker.alias = namelist.options[namelist.selectedIndex].text;
            }
            if (target) {
                targets.speaker.token = target.id;
                targets.speaker.alias = namelist.options[namelist.selectedIndex].text;
            }
            break;
    }

});


Hooks.on("renderActorDirectory", (dialog, $element, targets) => {
    $('#namelist').remove();
    $('#chat-controls.flexrow').prepend(updateSpeakerList());
});


    //targets.speaker.token = "XXX"
    //2)如場上有同樣的TOKEN，使用那個TOKEN發言
    //targets.speaker.actor = '';
    //  targets.speaker.alias = 'XXX';

/***

SPEAK
speaker:
actor: "Y0A5555818xw"
alias: "BBBC"
scene: "h4pM555L1AVto"
token: "WR37H5552akCWIE"

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
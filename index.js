var color;
var height;
var bgcolor;
var width = "80%";;

Hooks.once('init', () => {
    //Not used anymore but kept for compatibility with migration
    game.settings.register("speak-as", "checked", {
        name: "checked",
        scope: "client",
        default: true,
        type: Boolean,
        config: false
    });

});
Hooks.once('ready', () => {
    // Event listener will be set up when the element is created in renderSidebarTab
});

Hooks.on("renderChatLog", () => {
    /**
     * 自己的登入名字
     * 自己擁有的角色
    */

    let HTML = document.getElementById('chat-controls')
    console.log(HTML);
    if (!HTML) return;
    $('#divnamelist').remove();
    $('#chat-controls.flexrow').before(updateSpeakerList());
    $(".roll-type-select").css("color") ? color = $(".roll-type-select").css("color") : null;
    $(".roll-type-select").css("height") ? height = $(".roll-type-select").css("height") : null;
    $(".roll-type-select").css("background") ? bgcolor = $(".roll-type-select").css("background") : null;
    check();

    var x = document.querySelectorAll("#namelist");
    if (x.length > 0 && x[0]) {
        if (width) x[0].style.setProperty("width", width, "important")
        if (color) x[0].style.setProperty("color", color, "important")
        if (height) x[0].style.setProperty("height", height, "important")
        if (bgcolor) x[0].style.setProperty("background", bgcolor, "important")
    }
    $('#namelist').attr('title', 'Speak As……');
    $('#speakerSwitch').attr('title', 'Disable Speak As…… if unchecked');

    // Set up event listener for the speaker switch
    const speakerSwitch = document.getElementById('speakerSwitch');
    if (speakerSwitch && !speakerSwitch.hasAttribute('data-listener-attached')) {
        speakerSwitch.addEventListener('click', (event) => {
            let checked = document.getElementById("speakerSwitch").checked;
            game.settings.set("speak-as", "checked", checked);
        });
        speakerSwitch.setAttribute('data-listener-attached', 'true');
    }
});

function resortCharacter(activeActor, characterList, selectedCharacter) {
    let newCharacterList = [];
    for (let index = 0; index < characterList.length; index++) {
        let check = false;
        for (let index2 = 0; index2 < activeActor.length; index2++) {
            if (activeActor[index2] === characterList[index].name) {
                check = true;
                break;
            }
        }
        if (selectedCharacter === characterList[index].name) break;
        if (check) newCharacterList.unshift(characterList[index]);
        else newCharacterList.push(characterList[index]);
    }
    let uniq = [...new Set(newCharacterList)];
    return uniq;
}
function updateSpeakerList() {
    let myUser = game.users.find(user => user.id == game.userId);
    let myactors = game.actors.filter(actor => actor.permission >= 2);
    let selectedCharacter = myactors.find(actor => actor.id === myUser.character?.id);
    const users = game.users.filter(user => user.active);
    let playerNames = users.map(u => u.character?.name)
    myactors = resortCharacter(playerNames, myactors, selectedCharacter?.name);

    let addText = `<div style="flex: 0;" id="divnamelist">
    <input type="checkbox" id="speakerSwitch" name="speakerSwitch" checked>
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
                let myactors = game.actors.filter(actor => actor.permission >= 2);
                let actortarget = myactors.find(actor => actor.name === namelist.options[namelist.selectedIndex].text);
                if (!actortarget) return;
                targets.speaker.token = actortarget.id;
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
    $('#divnamelist').remove();
    $('#chat-controls.flexrow').before(updateSpeakerList());
    check();

    $(".roll-type-select").css("color") ? color = $(".roll-type-select").css("color") : null;
    $(".roll-type-select").css("height") ? height = $(".roll-type-select").css("height") : null;
    $(".roll-type-select").css("background") ? bgcolor = $(".roll-type-select").css("background") : null;
    var x = document.querySelectorAll("#namelist");
    if (!x.length) return;
    if (width) x[0].style.setProperty("width", width, "important")
    if (color) x[0].style.setProperty("color", color, "important")
    if (height) x[0].style.setProperty("height", height, "important")
    if (bgcolor) x[0].style.setProperty("background", bgcolor, "important")

    // Set up event listener for the speaker switch
    const speakerSwitch = document.getElementById('speakerSwitch');
    if (speakerSwitch && !speakerSwitch.hasAttribute('data-listener-attached')) {
        speakerSwitch.addEventListener('click', (event) => {
            let checked = document.getElementById("speakerSwitch").checked;
            game.settings.set("speak-as", "checked", checked);
        });
        speakerSwitch.setAttribute('data-listener-attached', 'true');
    }
});

function check() {
    let checked = game.settings.get("speak-as", "checked")
    let speaker = document.getElementById("speakerSwitch");
    if (speaker) speaker.checked = checked;
}




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
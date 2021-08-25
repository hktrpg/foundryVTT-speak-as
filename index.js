var isDefaultName = false;

Hooks.once("init", () => {
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


*/

Hooks.on("chatMessage", (dialog, $element, ABC) => {
    console.log('dialog', dialog)
    console.log('$element', $element)
    console.log('ABC', ABC)

    ABC.speaker.token = "XXX"
    //2)如場上有同樣的TOKEN，使用那個TOKEN發言
    //ABC.speaker.actor = '';
    ABC.speaker.alias = 'XXX';
});


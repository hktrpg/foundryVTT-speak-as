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





Hooks.on("preCreateChatMessage", (dialog, $element) => {
    console.log('dialog', dialog)
    console.log($element)

});

// Configuration variables
let color;
let height;
let bgcolor;
const width = "80%";

// UI state management
let rendered = false;
let speakAsContainer = null;

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
    console.log("Speak-As module loaded successfully");
    // Initial render will be handled by chat popout hooks
});

Hooks.on("renderChatLog", (chatlog, html, data, opt) => {
    if (!chatlog.isPopout) return;
    renderSpeakAsUI();
});

Hooks.on("closeChatLog", (chatlog, html, data, opt) => {
    if (!chatlog.isPopout) return;
    $('#divnamelist').remove();
    rendered = false;
});

Hooks.on("activateChatLog", (chatlog) => {
    if (ui.chat.popout?.rendered && !ui.chat.isPopout) return;
    renderSpeakAsUI();
});

Hooks.on("deactivateChatLog", (chatlog) => {
    if (ui.chat.popout?.rendered && !ui.chat.isPopout) return;
    $('#divnamelist').remove();
    rendered = false;
});

Hooks.on("collapseSidebar", (sidebar, wasExpanded) => {
    if (ui.chat.popout?.rendered && !ui.chat.isPopout) return;
    if (!wasExpanded) renderSpeakAsUI();
});

// Cleanup on game unload
Hooks.on("unload", () => {
    cleanup();
});

/**
 * Renders the Speak-As UI component
 */
function renderSpeakAsUI() {
    if (rendered) return;

    try {
        const inputElement = document.getElementById("chat-message");
        if (!inputElement) {
            console.warn("Speak-As: Chat message input not found");
            return;
        }

        // Remove existing UI if present
        removeExistingUI();

        // Create and insert the speak-as UI
        speakAsContainer = createSpeakAsContainer();
        inputElement.insertAdjacentElement("afterend", speakAsContainer);

        // Apply styling and setup
        applyDynamicStyling();
        setupEventListeners();
        updateSpeakerSwitchState();

        rendered = true;
    } catch (error) {
        console.error("Speak-As: Error rendering UI:", error);
    }
}

/**
 * Removes existing Speak-As UI elements
 */
function removeExistingUI() {
    const existing = document.getElementById('divnamelist');
    if (existing) {
        existing.remove();
    }
    speakAsContainer = null;
    rendered = false;
}

/**
 * Cleans up the module state
 */
function cleanup() {
    removeExistingUI();
    rendered = false;
    speakAsContainer = null;
}

/**
 * Creates the Speak-As container element
 */
function createSpeakAsContainer() {
    const container = document.createElement('div');
    container.className = 'speak-as-container';
    container.id = 'divnamelist';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Speak As Controls');

    // Apply base styles
    Object.assign(container.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '4px',
        padding: '6px 8px',
        background: 'rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        backdropFilter: 'blur(2px)',
        transition: 'all 0.2s ease'
    });

    container.innerHTML = generateSpeakAsHTML();
    return container;
}

/**
 * Applies dynamic styling based on existing UI elements
 */
function applyDynamicStyling() {
    if (!speakAsContainer) return;

    const rollTypeSelect = document.querySelector(".roll-type-select");
    if (rollTypeSelect) {
        const computedStyle = getComputedStyle(rollTypeSelect);
        color = computedStyle.color;
        height = computedStyle.height;
        bgcolor = computedStyle.background;
    }

    const nameList = speakAsContainer.querySelector("#namelist");
    if (nameList) {
        if (width) nameList.style.setProperty("width", width, "important");
        if (color) nameList.style.setProperty("color", color, "important");
        if (height) nameList.style.setProperty("height", height, "important");
        if (bgcolor) nameList.style.setProperty("background", bgcolor, "important");
    }
}

/**
 * Sets up event listeners for the UI components
 */
function setupEventListeners() {
    if (!speakAsContainer) return;

    const speakerSwitch = speakAsContainer.querySelector('#speakerSwitch');
    const nameList = speakAsContainer.querySelector('#namelist');

    if (speakerSwitch && !speakerSwitch.hasAttribute('data-listener-attached')) {
        speakerSwitch.addEventListener('change', handleSpeakerSwitchChange);
        speakerSwitch.setAttribute('data-listener-attached', 'true');
    }

    if (nameList) {
        nameList.addEventListener('keydown', handleKeyDown);
        nameList.setAttribute('title', 'Speak As……');
    }
}

/**
 * Handles speaker switch change events
 */
function handleSpeakerSwitchChange(event) {
    const checked = event.target.checked;
    game.settings.set("speak-as", "checked", checked);
}

/**
 * Handles keyboard navigation
 */
function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        // Allow default behavior for select dropdown
    }
}

/**
 * Updates the UI state based on settings
 */
function updateUIState() {
    const checked = game.settings.get("speak-as", "checked");
    const speakerSwitch = speakAsContainer?.querySelector("#speakerSwitch");
    if (speakerSwitch) {
        speakerSwitch.checked = checked;
        speakerSwitch.setAttribute('title', checked ? 'Disable Speak As' : 'Enable Speak As');
    }
}

/**
 * Resorts character list to prioritize active player characters
 * @param {Array} activeActorNames - Names of active player characters
 * @param {Array} characterList - List of available characters
 * @param {string} selectedCharacterName - Name of currently selected character
 * @returns {Array} Sorted character list
 */
function resortCharacter(activeActorNames, characterList, selectedCharacterName) {
    const prioritized = [];
    const others = [];

    for (const character of characterList) {
        if (selectedCharacterName && character.name === selectedCharacterName) {
            // Selected character goes first
            prioritized.unshift(character);
            continue;
        }

        if (activeActorNames.includes(character.name)) {
            prioritized.push(character);
        } else {
            others.push(character);
        }
    }

    return [...prioritized, ...others];
}

/**
 * Generates the HTML for the Speak-As UI
 * @returns {string} HTML string
 */
function generateSpeakAsHTML() {
    try {
        const currentUser = game.users.find(user => user.id === game.userId);
        if (!currentUser) return '';

        const availableActors = game.actors.filter(actor => actor.permission >= 2);
        const selectedCharacter = availableActors.find(actor => actor.id === currentUser.character?.id);
        const activeUsers = game.users.filter(user => user.active);
        const activePlayerNames = activeUsers.map(u => u.character?.name).filter(Boolean);

        const sortedActors = resortCharacter(activePlayerNames, availableActors, selectedCharacter?.name);

        let html = `
            <label for="speakerSwitch" style="
                font-size: 11px;
                color: var(--color-text-light-primary, #c9c7ba);
                white-space: nowrap;
                cursor: pointer;
                font-weight: 500;
                user-select: none;
            ">Speak As:</label>
            <input type="checkbox" id="speakerSwitch" name="speakerSwitch"
                style="
                    margin: 0;
                    cursor: pointer;
                    accent-color: var(--color-text-light-highlight, #ffffff);
                "
                aria-label="Enable/disable speak as functionality">
            <select name="namelist" id="namelist" class="namelist"
                style="
                    flex: 1;
                    min-width: 120px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                    color: var(--color-text-light-primary, #c9c7ba);
                    padding: 2px 4px;
                    font-size: 12px;
                    cursor: pointer;
                "
                aria-label="Select speaker identity">
                <optgroup label="Speak As....">`;

        // Add selected character first if exists
        if (selectedCharacter) {
            html += `<option value="${selectedCharacter.id}">${selectedCharacter.name}</option>`;
        }

        // Add current user
        html += `<option value="userName">${currentUser.name}</option>`;

        // Add other available actors
        for (const actor of sortedActors) {
            if (selectedCharacter && actor.id === selectedCharacter.id) continue; // Skip if already added
            html += `<option value="${actor.id}">${actor.name}</option>`;
        }

        html += `</optgroup></select>`;
        return html;
    } catch (error) {
        console.error("Speak-As: Error generating HTML:", error);
        return '';
    }
}

/**
 * Handles chat message sending and modifies speaker information
 */
Hooks.on("chatMessage", (dialog, $element, targets) => {
    try {
        // Check if speak-as is enabled
        const isEnabled = game.settings.get("speak-as", "checked");
        if (!isEnabled) return;

        const nameList = document.getElementById('namelist');
        if (!nameList) return;

        const selectedValue = nameList.value;
        const selectedText = nameList.options[nameList.selectedIndex]?.text;

        if (!selectedText) return;

        switch (selectedValue) {
            case 'userName':
                // Speak as user
                targets.speaker.actor = null;
                targets.speaker.token = null;
                targets.speaker.alias = null;
                break;

            default:
                // Speak as selected character
                applyCharacterSpeaker(targets, selectedText);
                break;
        }
    } catch (error) {
        console.error("Speak-As: Error in chatMessage hook:", error);
    }
});

/**
 * Applies character speaker information to chat targets
 * @param {Object} targets - Chat message targets
 * @param {string} characterName - Name of the character to speak as
 */
function applyCharacterSpeaker(targets, characterName) {
    try {
        // First, try to find a token with the same name on the current scene
        const currentScene = game.scenes.find(scene => scene.isView);
        if (currentScene) {
            const token = currentScene.tokens.find(token => token.name === characterName);
            if (token) {
                targets.speaker.token = token.id;
                targets.speaker.alias = characterName;
                return;
            }
        }

        // If no token found, use the actor directly
        const availableActors = game.actors.filter(actor => actor.permission >= 2);
        const actor = availableActors.find(actor => actor.name === characterName);

        if (actor) {
            targets.speaker.token = actor.id;
            targets.speaker.alias = characterName;
        }
    } catch (error) {
        console.error("Speak-As: Error applying character speaker:", error);
    }
}



/**
 * Updates the speaker switch UI state based on saved settings
 */
function updateSpeakerSwitchState() {
    try {
        const checked = game.settings.get("speak-as", "checked");
        const speakerSwitch = speakAsContainer?.querySelector("#speakerSwitch");
        if (speakerSwitch) {
            speakerSwitch.checked = checked;
        }
    } catch (error) {
        console.error("Speak-As: Error updating speaker switch state:", error);
    }
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
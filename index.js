// Configuration variables
let color;
let height;
let bgcolor;
const width = "80%";

// UI state management
let rendered = false;
let speakAsContainer = null;
let characterOptions = []; // Store character options for search
let selectedCharacterValue = null; // Store selected character value

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
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => renderSpeakAsUI(), 0);
});

Hooks.on("closeChatLog", (chatlog, html, data, opt) => {
    if (!chatlog.isPopout) return;
    $('#divnamelist').remove();
    rendered = false;
    speakAsContainer = null;
});

Hooks.on("activateChatLog", (chatlog) => {
    if (ui.chat.popout?.rendered && !ui.chat.isPopout) return;
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => renderSpeakAsUI(), 0);
    startPositionMonitoring();
});

Hooks.on("deactivateChatLog", (chatlog) => {
    if (ui.chat.popout?.rendered && !ui.chat.isPopout) {
        stopPositionMonitoring();
        return;
    }
    $('#divnamelist').remove();
    rendered = false;
    speakAsContainer = null;
    stopPositionMonitoring();
});

Hooks.on("collapseSidebar", (sidebar, wasExpanded) => {
    if (ui.chat.popout?.rendered && !ui.chat.isPopout) return;
    if (!wasExpanded) {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => renderSpeakAsUI(), 0);
    }
});

// Monitor DOM changes to ensure UI stays in correct position
let positionCheckInterval = null;

function startPositionMonitoring() {
    if (positionCheckInterval) return;
    
    positionCheckInterval = setInterval(() => {
        const existing = document.getElementById('divnamelist');
        const inputElement = document.getElementById("chat-message");
        
        if (existing && inputElement) {
            const nextSibling = inputElement.nextElementSibling;
            if (!nextSibling || nextSibling.id !== 'divnamelist') {
                // UI is in wrong position, re-render
                rendered = false;
                renderSpeakAsUI();
            }
        } else if (inputElement && !existing) {
            // Input exists but UI doesn't, re-render
            rendered = false;
            renderSpeakAsUI();
        }
    }, 500); // Check every 500ms
}

function stopPositionMonitoring() {
    if (positionCheckInterval) {
        clearInterval(positionCheckInterval);
        positionCheckInterval = null;
    }
}

// Cleanup on game unload
Hooks.on("unload", () => {
    cleanup();
});

/**
 * Renders the Speak-As UI component
 */
function renderSpeakAsUI() {
    try {
        const inputElement = document.getElementById("chat-message");
        if (!inputElement) {
            console.warn("Speak-As: Chat message input not found");
            return;
        }

        // Save current selection before re-rendering
        const existingInput = document.getElementById('namelist');
        if (existingInput) {
            const currentValue = existingInput.getAttribute('data-selected-value');
            if (currentValue) {
                selectedCharacterValue = currentValue;
            }
        }

        // Check if element already exists and is in correct position
        const existing = document.getElementById('divnamelist');
        if (existing) {
            // Verify it's in the correct position (right after chat-message)
            const nextSibling = inputElement.nextElementSibling;
            if (nextSibling && nextSibling.id === 'divnamelist') {
                // Already in correct position, just update state
                speakAsContainer = existing;
                rendered = true;
                applyDynamicStyling();
                setupEventListeners();
                updateSpeakerSwitchState();
                return;
            } else {
                // Exists but in wrong position, remove it
                existing.remove();
            }
        }

        // Remove existing UI if present (cleanup)
        removeExistingUI();

        // Create and insert the speak-as UI
        speakAsContainer = createSpeakAsContainer();
        
        // Ensure we insert right after the textarea, not before other elements
        // Use insertAdjacentElement which is more reliable than appendChild
        inputElement.insertAdjacentElement("afterend", speakAsContainer);

        // Verify insertion was successful
        const verifyNext = inputElement.nextElementSibling;
        if (!verifyNext || verifyNext.id !== 'divnamelist') {
            console.warn("Speak-As: Failed to insert UI in correct position, retrying...");
            // Fallback: find the parent form and append after textarea
            const form = inputElement.closest('form.chat-form');
            if (form) {
                speakAsContainer.remove();
                inputElement.insertAdjacentElement("afterend", speakAsContainer);
            }
        }

        // Apply styling and setup
        applyDynamicStyling();
        setupEventListeners();
        updateSpeakerSwitchState();

        rendered = true;
    } catch (error) {
        console.error("Speak-As: Error rendering UI:", error);
        rendered = false;
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
    stopPositionMonitoring();
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

    const nameListInput = speakAsContainer.querySelector("#namelist");
    if (nameListInput) {
        if (color) nameListInput.style.setProperty("color", color, "important");
        if (height) nameListInput.style.setProperty("height", height, "important");
        if (bgcolor) nameListInput.style.setProperty("background", bgcolor, "important");
    }
}

/**
 * Sets up event listeners for the UI components
 */
function setupEventListeners() {
    if (!speakAsContainer) return;

    const speakerSwitch = speakAsContainer.querySelector('#speakerSwitch');
    const nameListInput = speakAsContainer.querySelector('#namelist');
    const dropdown = speakAsContainer.querySelector('#namelist-dropdown');

    if (speakerSwitch && !speakerSwitch.hasAttribute('data-listener-attached')) {
        speakerSwitch.addEventListener('change', handleSpeakerSwitchChange);
        speakerSwitch.setAttribute('data-listener-attached', 'true');
    }

    if (nameListInput && !nameListInput.hasAttribute('data-listener-attached')) {
        // Focus events
        nameListInput.addEventListener('focus', handleSearchFocus);
        nameListInput.addEventListener('blur', handleSearchBlur);
        
        // Input events for search
        nameListInput.addEventListener('input', handleSearchInput);
        
        // Keyboard navigation
        nameListInput.addEventListener('keydown', handleSearchKeyDown);
        
        nameListInput.setAttribute('data-listener-attached', 'true');
    }

        // Refresh character options and populate dropdown initially
        characterOptions = generateCharacterOptions();
        if (dropdown) {
            populateDropdown(characterOptions);
        }
}

/**
 * Handles search input focus
 */
function handleSearchFocus(event) {
    const dropdown = speakAsContainer?.querySelector('#namelist-dropdown');
    if (dropdown) {
        dropdown.style.display = 'block';
        // Reset scroll position to top when showing dropdown (since it opens upward)
        dropdown.scrollTop = 0;
        // Always show all options when focused, regardless of input value
        populateDropdown(characterOptions);
    }
}

/**
 * Handles search input blur (with delay to allow click events)
 */
function handleSearchBlur(event) {
    // Delay to allow click events on dropdown items
    setTimeout(() => {
        const dropdown = speakAsContainer?.querySelector('#namelist-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }, 200);
}

/**
 * Handles search input changes
 */
function handleSearchInput(event) {
    const searchValue = event.target.value.trim();
    const dropdown = speakAsContainer?.querySelector('#namelist-dropdown');
    
    // Only filter when user has typed something
    if (searchValue.length > 0) {
        // User is typing, filter the options
        const filtered = filterAndShowDropdown(searchValue);
        
        // Auto-fill: if exact match found, select it
        const exactMatch = characterOptions.find(opt => 
            opt.text.toLowerCase() === searchValue.toLowerCase()
        );
        
        if (exactMatch) {
            event.target.setAttribute('data-selected-value', exactMatch.value);
            selectedCharacterValue = exactMatch.value;
        } else if (filtered.length === 1) {
            // If only one match, auto-select it
            const singleMatch = filtered[0];
            event.target.setAttribute('data-selected-value', singleMatch.value);
            selectedCharacterValue = singleMatch.value;
        } else {
            // Clear selection if no exact match
            event.target.removeAttribute('data-selected-value');
            selectedCharacterValue = null;
        }
    } else {
        // Input is empty, show all options
        if (dropdown) {
            populateDropdown(characterOptions);
        }
        // Clear selection when input is cleared
        event.target.removeAttribute('data-selected-value');
        selectedCharacterValue = null;
    }
}

/**
 * Filters and displays dropdown options based on search query
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered options array
 */
function filterAndShowDropdown(searchQuery = '') {
    const dropdown = speakAsContainer?.querySelector('#namelist-dropdown');
    if (!dropdown) return [];

    const query = searchQuery.toLowerCase().trim();
    let filteredOptions = characterOptions;

    if (query) {
        filteredOptions = characterOptions.filter(opt => 
            opt.text.toLowerCase().includes(query)
        );
    }

    populateDropdown(filteredOptions, query);
    // Reset scroll position to top (since dropdown opens upward)
    dropdown.scrollTop = 0;
    return filteredOptions;
}

/**
 * Populates the dropdown with options
 */
function populateDropdown(options, highlightQuery = '') {
    const dropdown = speakAsContainer?.querySelector('#namelist-dropdown');
    if (!dropdown) return;

    if (options.length === 0) {
        dropdown.innerHTML = '<div style="padding: 8px; color: #999; text-align: center;">No matches found</div>';
        return;
    }

    let html = '';
    for (const option of options) {
        let displayText = option.text;
        
        // Highlight matching text if query provided
        if (highlightQuery) {
            const regex = new RegExp(`(${highlightQuery})`, 'gi');
            displayText = displayText.replace(regex, '<mark style="background: rgba(255, 255, 0, 0.3);">$1</mark>');
        }

        html += `
            <div class="dropdown-option" 
                data-value="${option.value}" 
                data-text="${option.text}"
                style="
                    padding: 6px 8px;
                    cursor: pointer;
                    color: #fff;
                    font-size: 12px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    transition: background 0.15s;
                "
                onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'"
                onmouseout="this.style.background='transparent'">
                ${displayText}
            </div>`;
    }

    dropdown.innerHTML = html;
    
    // Reset scroll position to top (since dropdown opens upward)
    dropdown.scrollTop = 0;

    // Add click listeners to dropdown options
    const optionElements = dropdown.querySelectorAll('.dropdown-option');
    optionElements.forEach(optionEl => {
        optionEl.addEventListener('click', (e) => {
            const value = e.currentTarget.getAttribute('data-value');
            const text = e.currentTarget.getAttribute('data-text');
            selectCharacter(value, text);
        });
    });
}

/**
 * Selects a character from the dropdown
 */
function selectCharacter(value, text) {
    const nameListInput = speakAsContainer?.querySelector('#namelist');
    const dropdown = speakAsContainer?.querySelector('#namelist-dropdown');
    
    if (nameListInput) {
        nameListInput.value = text;
        nameListInput.setAttribute('data-selected-value', value);
        selectedCharacterValue = value;
    }
    
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    
    // Blur the input to close dropdown
    if (nameListInput) {
        nameListInput.blur();
    }
}

/**
 * Handles keyboard navigation in search input
 */
function handleSearchKeyDown(event) {
    const dropdown = speakAsContainer?.querySelector('#namelist-dropdown');
    if (!dropdown || dropdown.style.display === 'none') {
        if (event.key === 'Enter') {
            event.preventDefault();
            // Try to select first match or current value
            const input = event.target;
            const query = input.value.toLowerCase().trim();
            const match = characterOptions.find(opt => 
                opt.text.toLowerCase() === query || 
                opt.text.toLowerCase().startsWith(query)
            );
            if (match) {
                selectCharacter(match.value, match.text);
            }
        }
        return;
    }

    const options = dropdown.querySelectorAll('.dropdown-option');
    const currentFocused = dropdown.querySelector('.dropdown-option.highlighted');
    let currentIndex = currentFocused ? Array.from(options).indexOf(currentFocused) : -1;

    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            currentIndex = (currentIndex + 1) % options.length;
            highlightOption(options, currentIndex);
            break;
        
        case 'ArrowUp':
            event.preventDefault();
            currentIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
            highlightOption(options, currentIndex);
            break;
        
        case 'Enter':
            event.preventDefault();
            if (currentFocused) {
                const value = currentFocused.getAttribute('data-value');
                const text = currentFocused.getAttribute('data-text');
                selectCharacter(value, text);
            } else if (options.length > 0) {
                // Select first option if none highlighted
                const firstOption = options[0];
                const value = firstOption.getAttribute('data-value');
                const text = firstOption.getAttribute('data-text');
                selectCharacter(value, text);
            }
            break;
        
        case 'Escape':
            event.preventDefault();
            dropdown.style.display = 'none';
            event.target.blur();
            break;
    }
}

/**
 * Highlights a dropdown option
 */
function highlightOption(options, index) {
    options.forEach((opt, i) => {
        if (i === index) {
            opt.classList.add('highlighted');
            opt.style.background = 'rgba(255, 255, 255, 0.2)';
            // Scroll into view
            opt.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            opt.classList.remove('highlighted');
            opt.style.background = 'transparent';
        }
    });
}

/**
 * Handles speaker switch change events
 */
function handleSpeakerSwitchChange(event) {
    const checked = event.target.checked;
    game.settings.set("speak-as", "checked", checked);
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
 * Generates character options list for search
 * @returns {Array} Array of character options
 */
function generateCharacterOptions() {
    try {
        const currentUser = game.users.find(user => user.id === game.userId);
        if (!currentUser) return [];

        const availableActors = game.actors.filter(actor => actor.permission >= 2);
        const selectedCharacter = availableActors.find(actor => actor.id === currentUser.character?.id);
        const activeUsers = game.users.filter(user => user.active);
        const activePlayerNames = activeUsers.map(u => u.character?.name).filter(Boolean);

        const sortedActors = resortCharacter(activePlayerNames, availableActors, selectedCharacter?.name);

        const options = [];

        // Add selected character first if exists
        if (selectedCharacter) {
            options.push({
                value: selectedCharacter.id,
                text: selectedCharacter.name,
                isUser: false
            });
        }

        // Add current user
        options.push({
            value: 'userName',
            text: currentUser.name,
            isUser: true
        });

        // Add other available actors
        for (const actor of sortedActors) {
            if (selectedCharacter && actor.id === selectedCharacter.id) continue; // Skip if already added
            options.push({
                value: actor.id,
                text: actor.name,
                isUser: false
            });
        }

        return options;
    } catch (error) {
        console.error("Speak-As: Error generating character options:", error);
        return [];
    }
}

/**
 * Generates the HTML for the Speak-As UI
 * @returns {string} HTML string
 */
function generateSpeakAsHTML() {
    try {
        characterOptions = generateCharacterOptions();
        if (characterOptions.length === 0) return '';

        // Get initial selected value (default to first option or previously selected)
        const initialValue = selectedCharacterValue || characterOptions[0]?.value || '';
        const initialText = characterOptions.find(opt => opt.value === initialValue)?.text || characterOptions[0]?.text || '';

        let html = `
            <label for="speakerSwitch" style="
                font-size: 11px;
                white-space: nowrap;
                cursor: pointer;
                font-weight: 500;
                user-select: none;
            ">Speak As:</label>
            <input type="checkbox" id="speakerSwitch" name="speakerSwitch"
                style="
                    margin: 0;
                    cursor: pointer;
                   
                "
                aria-label="Enable/disable speak as functionality">
            <div class="speak-as-search-wrapper" style="
                position: relative;
                flex: 1;
                min-width: 120px;
            ">
                <input type="text" 
                    id="namelist" 
                    class="namelist-search" 
                    name="namelist"
                    value="${initialText}"
                    autocomplete="off"
                    placeholder="Search or select..."
                    style="
                        width: 100%;
                        border-radius: 3px;
                        padding: 2px 4px;
                        font-size: 12px;
                        cursor: pointer;
                        box-sizing: border-box;
                    "
                    aria-label="Select speaker identity"
                    data-selected-value="${initialValue}"
                    title="Speak As……">
                <div id="namelist-dropdown" class="namelist-dropdown" style="
                    display: none;
                    position: absolute;
                    bottom: 100%;
                    left: 0;
                    right: 0;
                    max-height: 200px;
                    overflow-y: auto;
                    background: rgba(0, 0, 0, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                    margin-bottom: 2px;
                    z-index: 1000;
                    box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.3);
                "></div>
            </div>`;

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

        const nameListInput = document.getElementById('namelist');
        if (!nameListInput) return;

        // Get selected value from data attribute or try to match by text
        let selectedValue = nameListInput.getAttribute('data-selected-value');
        const selectedText = nameListInput.value;

        if (!selectedText) return;

        // If no data-selected-value, try to find matching option
        if (!selectedValue) {
            const match = characterOptions.find(opt => opt.text === selectedText);
            if (match) {
                selectedValue = match.value;
            } else {
                // Try partial match
                const partialMatch = characterOptions.find(opt => 
                    opt.text.toLowerCase().includes(selectedText.toLowerCase()) ||
                    selectedText.toLowerCase().includes(opt.text.toLowerCase())
                );
                if (partialMatch) {
                    selectedValue = partialMatch.value;
                }
            }
        }

        if (!selectedValue) return;

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
let existingBoxes = {};

class WhisperBox extends Application {

    constructor(options, data, target) {
        super(options);
        this.data = data;
        this.target = target;
        this.user = game.user.id;
        this.combi = this.target + this.user;


        let historyContainer = $('<div></div>');
        historyContainer.css({
            "flex": "1",
            "min-height": "0",
            "overflow": "hidden"
        });

        let whisperHistory = $('<ul></ul>')
        whisperHistory.attr('id', `whisperTextHistory${this.combi}`);
        whisperHistory.css({
            "overflow-y": "auto",
            "overflow-x": "hidden",
            width: 'auto',
            height: 'calc(100% - 60px)',
            padding: '0'
        });

        historyContainer.append('<h2>History:</h2>');
        historyContainer.append(whisperHistory);

        let messageContainer = $('<div></div>');
        messageContainer.css({
            "flex": "0 0 110px"
        });

        let whisperMessage = $('<textarea></textarea>')
        whisperMessage.attr('rows', '4');
        whisperMessage.attr('cols', '120');
        whisperMessage.attr('name', 'whisperText');
        whisperMessage.attr('id', `whisperTextId${this.combi}`);
        whisperMessage.css({
            background: "white",
            color: "black",
            "font-family": "Arial",
        });

        messageContainer.append('<h2>Message:</h2>');
        messageContainer.append(whisperMessage);

        let appBody = $('<div></div>');

        appBody.append(historyContainer);
        appBody.append(messageContainer);

        this.content = {
            content: appBody.html()
        }
    }

    /**
     * Creates a new WhisperBox
     * @param {Object} data WhisperBox initialisation data
     * @param {String} data.name Name of the targeted actor / User
     * @param {String} data.targetUser Id of the targeted user
     * @return {WhisperBox}
     */
    static createWhisperBox(data) {
        let name = data.name;
        let target = data.targetUser;

        let combi = target + game.user.id;

        let whisperbox = existingBoxes[combi];

        if (!whisperbox) {
            let opt = Dialog.defaultOptions;
            opt.title = `Whispering to ${name}`;
            opt.width = 400;
            opt.height = 450;
            opt.minimizable = true;
            opt.resizable = true;
            opt.classes.push('whisperBox');


            whisperbox = new WhisperBox(opt, data, target);
            existingBoxes[combi] = whisperbox;
        }

        if(!whisperbox.rendered) {
            whisperbox.render(true);
        }

        whisperbox.getHistory();

        Hooks.on('renderChatMessage', function (html, data) {
            whisperbox.getHistory();
        });

        return whisperbox;
    }

    activateListeners(html) {
        super.activateListeners(html);
        var whisperField = html.find(`textarea[id='whisperTextId${this.combi}']`);
        whisperField.on("keyup", event => this._onEnterEvent(event, html, this));
        this.getHistory();
    }

    //The following code detects the enter key being released and then sends the message.
    async _onEnterEvent(event, html, data) {
        if (event.keyCode === 13) {
            var whisper = event.target;
            await ChatMessage.create({
                type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
                user: this.user,
                content: whisper.value,
                whisper: [this.target]
            })
            whisper.value = "";
            whisper.focus();
            this.getHistory();
        }
    }

    getHistory() {
        let whisperHistory = $('#whisperTextHistory' + this.combi);
        if (whisperHistory.length > 0) {
            whisperHistory.html('');

            let relevantChatHistory = game.messages.contents.filter((msg) => {
                return msg.whisper.length === 1 &&
                    (this.user === msg?.user?.id && this.target === msg?.whisper[0]) ||
                    (this.target === msg?.user?.id && this.user === msg?.whisper[0]);
            });

            for (let chatMessage of relevantChatHistory) {
                //The next line has changed from chatMessage.data.speaker.alias and we are now not compatible with Foundry versions 9 or lower.
                let speaker = chatMessage.speaker.alias ?? chatMessage.user.name;
                let whisperedTo = game.users.get(chatMessage.whisper[0])?.name ?? game.actors.get(chatMessage.whisper[0])?.name;
                let left = 5;
                let right = 5;
                if (this.user === chatMessage.user.id) left += 50;
                if (this.target === chatMessage.user.id) right += 50;
                let chatMessageItem = $(`<li class="chat-message message flexcol whisper" style="margin-right:${right}px; margin-left:${left}px">
    <header class="message-header flexrow">
        <h4 class="message-sender">${speaker}</h4>
        <span class="message-metadata">
            <span class="whisper-to">To: ${whisperedTo}</span>
        </span>
    </header>
    <div class="message-content">
        ${chatMessage.content}
    </div>
</li>`);

                whisperHistory.append(chatMessageItem);
            }

            // Timeout to ensure box is rendered before scrolling
            setTimeout(() => {
                this.scrollHistory()
            }, 200);
        }
    }

    scrollHistory() {
        let whisperHistory = $('#whisperTextHistory' + this.combi);
        whisperHistory.scrollTop(whisperHistory.prop("scrollHeight"))
    }

    getData() {
        return this.content;
    }
}

Hooks.on("renderTokenHUD", function (hudButtons, html, data) {
    // if html is jquery, convert to HTMLElement - this is future proofing for when this does return an HTMLElement.
    if (html instanceof jQuery){
        html = $(html)[0];
    }

    var users = game.users.contents;
    var user = users.find(user => user?.character?.id === data.actorId)
    if (user) {
        let button = `<button type="button" class="button control-icon whisperBox"><i class="fa fa-user-secret"></i></div>`;
        let col = html.querySelector('.col.left');
        col.insertAdjacentHTML("beforeend", button);
        let buttonEl = html.querySelector("button.whisperBox");
        buttonEl.addEventListener("click", (async (ev) => {
            let name = user.name;
            if(game.settings.get('WhisperBox', 'showCharacterName')){
                name = user?.character?.name ?? name;
            }

            let whisperBoxData = {
                name: name,
                targetUser: user.id
            }

            WhisperBox.createWhisperBox(whisperBoxData);
        }));
    }
});

Hooks.on('init', function () {
    game.settings.register('WhisperBox', 'openBoxOnAllWhispers', {
        name: 'Open box on all whispers',
        hint: 'Opens the box on whisper sending or receiving, and not just by using the button or macro',
        scope: 'client',
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register('WhisperBox', 'showCharacterName', {
        name: 'Show character name on box',
        hint: 'Shows the user\'s main character name if available',
        scope: 'client',
        config: true,
        default: true,
        type: Boolean
    });
});

Hooks.on('ready', function () {
    Hooks.on('renderChatMessage', function (data, elt) {
        if (game.settings.get('WhisperBox', 'openBoxOnAllWhispers')) {
            if(data.whisper.length === 1 &&
                (game.user.id === data.user.id ||
                    game.user.id === data.whisper[0])){

                    let targetUser = data.user.id;
                    if(game.user.id === data.user.id){
                        targetUser = data.whisper[0];
                    }

                    let name = game.users.get(targetUser)?.name;
                    if(game.settings.get('WhisperBox', 'showCharacterName')){
                        name = game.users.get(targetUser)?.character?.name ?? name;
                     }

                    WhisperBox.createWhisperBox({name: name, targetUser: targetUser})
            }
        }
    });
});

Hooks.on('getUserContextOptions', function (html, contextOptions) {
    contextOptions.push({
        name: 'Open whisper box',
        icon: '<i class="fas fa-comments"></i>',
        condition: () => true,
        callback: (li) => {
            const user = game.users.get(li[0].dataset.userId);

            let name = user.name;
            if(game.settings.get('WhisperBox', 'showCharacterName')){
                name = user?.character?.name ?? name;
            }

            WhisperBox.createWhisperBox({name: name, targetUser: user.id});
        }
    });
});
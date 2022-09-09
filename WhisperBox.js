class WhisperBox extends Application {

    constructor(options, data, target){
        super(options);
        this.data=data;
        this.target = target;
        this.user = game.user.id;
        this.combi=this.target+this.user;
        this.content= {content:`<h2>History:</h2><p><textarea readonly name="whisperHistory" id ="whisperTextHistory${this.combi}" style="background: white; color: black; font-family: Arial;" rows ="10 cols="120"></textarea></p>
        <h2>Message:</h2><p><textarea name="whisperText" id="whisperTextId${this.combi}" style="background: white; color: black; font-family: Arial" rows="4" cols="120"></textarea></p>`}
    }

    activateListeners(html) {
        super.activateListeners(html);
        var whisperField = html.find(`textarea[id='whisperTextId${this.combi}']`);
        whisperField.on("keyup",event => this._onEnterEvent(event, html, this));
        this.getHistory();
      }   

    //The following code detects the enter key being released and then sends the message.
    async _onEnterEvent(event, html, data) {
        if(event.keyCode === 13){
            var whisper = event.target;
            var message= await ChatMessage.create({type:CONST.CHAT_MESSAGE_TYPES.WHISPER, user: this.user, content : whisper.value, whisper : [this.target]})
            whisper.value="";
            whisper.focus();
            this.getHistory();
        }
      }

      getHistory(){

          var whisperHistory=document.getElementById(`whisperTextHistory${this.combi}`);
          if (whisperHistory!=null && whisperHistory != undefined){
            whisperHistory.innerHTML="";
          }
          let chatHistory = game.messages.contents;
        
          for (var i=0;i<chatHistory.length; i++){
              
              //If the user in the chat message is me, and the whisper target in the chat history is the target of this Whisperbox, add the message to the log here.
                if(this.user===chatHistory[i].user?.id && chatHistory[i].whisper[0]===this.target) {
                    var msgString = `${game.user.name}: ${chatHistory[i].content}`
                    if(whisperHistory != null && whisperHistory != undefined){
                        whisperHistory.innerHTML+=`${msgString}\n`;
                    }
                }

                //If the user in the chat message is the target of this whisperbox, and the whisper target in the chat history is me, add the message to the log here.
                if(chatHistory[i].user.id===this.target && chatHistory[i].whisper[0]===this.user) {
                    var msgString = `${chatHistory[i].user.name}: ${chatHistory[i].content}`
                    if (whisperHistory != null && whisperHistory != undefined){
                        whisperHistory.innerHTML+=`${msgString}\n`;
                    }
                }
          }
          //this.render(false);
          var whisper = document.getElementById(`whisperTextId${this.combi}`)
          if (whisper != undefined) {
            whisperHistory.scrollTop = whisperHistory.scrollHeight;
          }
      }

    getData(){ 
        return this.content; 
    }
}

Hooks.on('renderTokenHUD', function(hudButtons, html, data){
    var users = game.users.contents;
    var user = users.find(user => user?.character?.id==data.actorId);

    if (user != undefined){
        let button = $(`<div class="control-icon whisperBox"><i class="fa fa-user-secret"></i></div>`);
        let col = html.find('.col.left');
        col.append(button);
 
        button.find('i').click(async (ev) => {
            let opt=Dialog.defaultOptions;
            opt.resizable=false;
            let name = data.name;
            opt.title=`Whispering to ${name}`;
            opt.width=400;
            opt.height="auto";
            opt.minimizable=true;
            opt.resizable=true;
            var target=user.id;
            var whisperbox = new WhisperBox (opt, data, target);
            await whisperbox.render(true);
            whisperbox.getHistory();

            Hooks.on('renderChatMessage', function(html, data){
                whisperbox.getHistory();
            });
        });
    }        
})
